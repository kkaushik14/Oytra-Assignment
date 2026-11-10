const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

const nodes = [];
const connections = {};

const add = (name, type, version, position, parameters, extra = {}) =>
  nodes.push({
    id: require('node:crypto').randomUUID(),
    name,
    type: 'n8n-nodes-base.' + type,
    typeVersion: version,
    position,
    parameters,
    ...extra
  });

const link = (a, b, output = 0) => {
  connections[a] ??= { main: [] };
  while (connections[a].main.length <= output) connections[a].main.push([]);
  connections[a].main[output].push({ node: b, type: 'main', index: 0 });
};

const code = (name, position, js, extra = {}) => add(name, 'code', 2, position, { jsCode: js }, extra);

// 1. Schedule Trigger (Every 5 minutes)
add('Schedule 5m Ping', 'scheduleTrigger', 1.2, [0, 0], {
  rule: {
    interval: [{ field: 'minutes', minutesInterval: 5 }]
  }
});

// 2. Start Ping Timer & Target Configuration
code('Initialize Ping', [240, 0], `
const timestamp = new Date().toISOString();
const targetUrl = 'https://demo.realworld.show';
const apiTarget = 'https://api.realworld.show/api/tags';
return [{
  json: {
    timestamp,
    targetUrl,
    apiTarget,
    startTime: Date.now(),
    monitorVersion: '1.0.0'
  }
}];
`);

// 3. Ping Web App (HTTP Request with retryOnFail, 3 attempts)
add('Ping Web App', 'httpRequest', 4.4, [480, 0], {
  url: '={{ $json.targetUrl }}',
  sendHeaders: true,
  headerParameters: {
    parameters: [
      { name: 'User-Agent', value: 'Oytra-Uptime-Monitor/1.0' },
      { name: 'Cache-Control', value: 'no-cache' }
    ]
  },
  options: {
    timeout: 10000,
    response: { response: { fullResponse: true, responseFormat: 'text' } }
  }
}, {
  retryOnFail: true,
  maxTries: 3,
  waitBetweenTries: 2000,
  onError: 'continueRegularOutput'
});

// 4. Measure Response Time & Evaluate Status
code('Evaluate Health & Latency', [720, 0], `
const init = $('Initialize Ping').first().json;
const httpRes = $input.first().json;
const durationMs = Date.now() - init.startTime;

const statusCode = httpRes.statusCode || (httpRes.error ? (httpRes.error.status || 500) : 200);
const isSuccess = statusCode >= 200 && statusCode < 300 && !httpRes.error;
const isDegraded = isSuccess && durationMs > 3000;
const statusCategory = !isSuccess ? 'DOWN' : (isDegraded ? 'DEGRADED' : 'HEALTHY');

return [{
  json: {
    target: init.targetUrl,
    timestamp: init.timestamp,
    checkedAt: new Date().toISOString(),
    durationMs,
    statusCode,
    isSuccess,
    isDegraded,
    statusCategory,
    errorDetail: httpRes.error ? (httpRes.error.message || JSON.stringify(httpRes.error)) : null,
    retriesConfigured: 3
  }
}];
`);

// 5. IF Condition: Is the app Healthy?
add('App Healthy?', 'if', 2.2, [960, 0], {
  conditions: {
    options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
    conditions: [
      {
        id: require('node:crypto').randomUUID(),
        leftValue: '={{ $json.isSuccess }}',
        rightValue: true,
        operator: { type: 'boolean', operation: 'equals' }
      }
    ],
    combinator: 'and'
  },
  options: {}
});

// Branch False (Output 1): Down / Unhealthy -> Incident Alert
code('Format Incident Alert', [1200, 160], `
const data = $input.first().json;
const clean = s => String(s || '').replace(/@/g, '＠').slice(0, 150);

const lines = [
  '🚨 **OYTRA UPTIME ALERT — SERVICE DOWN / UNRESPONSIVE**',
  '',
  '• **Target Application:** ' + clean(data.target),
  '• **Status Code:** ' + data.statusCode + ' (Expected: 200 OK)',
  '• **Response Latency:** ' + data.durationMs + ' ms',
  '• **Health Category:** ' + data.statusCategory,
  '• **Retries Attempted:** ' + data.retriesConfigured + ' tries with 2s backoff',
  '• **Incident Timestamp:** ' + data.checkedAt,
  data.errorDetail ? ('• **Error Detail:** ' + clean(data.errorDetail)) : '',
  '',
  '⚠️ **Action:** Verify cloud bucket, DNS routing, or web server container status.'
].filter(Boolean);

return [{ json: { ...data, content: lines.join('\\n'), alertType: 'INCIDENT' } }];
`);

add('Send Incident Alert', 'discord', 2, [1440, 160], {
  authentication: 'webhook',
  resource: 'message',
  operation: 'sendLegacy',
  content: '={{ $json.content }}',
  options: { wait: true }
}, { onError: 'continueRegularOutput' });

code('Log Incident Receipt', [1680, 160], `
const alert = $('Format Incident Alert').first().json;
return [{
  json: {
    status: 'ALERT_DELIVERED',
    category: alert.statusCategory,
    target: alert.target,
    recordedAt: new Date().toISOString()
  }
}];
`);

// Branch True (Output 0): Healthy -> Heartbeat & Daily Summary Check
code('Format Heartbeat Pulse', [1200, -140], `
const data = $input.first().json;
return [{
  json: {
    status: 'HEALTHY',
    target: data.target,
    statusCode: data.statusCode,
    latencyMs: data.durationMs,
    latencySLA: data.durationMs < 1000 ? 'EXCELLENT' : (data.durationMs < 3000 ? 'ACCEPTABLE' : 'SLOW'),
    timestamp: data.checkedAt
  }
}];
`);

// Link nodes
link('Schedule 5m Ping', 'Initialize Ping');
link('Initialize Ping', 'Ping Web App');
link('Ping Web App', 'Evaluate Health & Latency');
link('Evaluate Health & Latency', 'App Healthy?');

// If unhealthy:
link('App Healthy?', 'Format Incident Alert', 1);
link('Format Incident Alert', 'Send Incident Alert');
link('Send Incident Alert', 'Log Incident Receipt');

// If healthy:
link('App Healthy?', 'Format Heartbeat Pulse', 0);

const workflow = {
  name: 'Bonus — Web Application Uptime & Response-Time Monitor',
  nodes,
  connections,
  settings: {
    executionOrder: 'v1',
    saveDataErrorExecution: 'all',
    saveDataSuccessExecution: 'all',
    saveManualExecutions: true,
    executionTimeout: 60
  },
  active: false,
  pinData: {},
  tags: ['uptime', 'bonus', 'monitoring', 'realworld']
};

const outDir = path.join(root, 'bonus-uptime');
fs.mkdirSync(outDir, { recursive: true });
const targetFile = path.join(outDir, 'Bonus_UptimeMonitor_Kumar_Kaushik.json');
fs.writeFileSync(targetFile, JSON.stringify(workflow, null, 2) + '\n');

console.log(`Successfully generated ${nodes.length}-node Uptime Monitor workflow: ${targetFile}`);
