const fs = require('node:fs');
const path = require('node:path');
const { getSrc } = require('../bonus-uptime/src/index.js');

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
    ...extra,
  });

const link = (a, b, output = 0) => {
  connections[a] ??= { main: [] };
  while (connections[a].main.length <= output) connections[a].main.push([]);
  connections[a].main[output].push({ node: b, type: 'main', index: 0 });
};

const code = (name, position, js, extra = {}) =>
  add(name, 'code', 2, position, { jsCode: js }, extra);

// 1. Schedule Trigger (Every 5 minutes)
add('Schedule 5m Ping', 'scheduleTrigger', 1.2, [0, 0], {
  rule: {
    interval: [{ field: 'minutes', minutesInterval: 5 }],
  },
});

// 2. Start Ping Timer & Target Configuration
code('Initialize Ping', [240, 0], getSrc('initialize'));

// 3. Ping Web App (HTTP Request with retryOnFail, 3 attempts)
add(
  'Ping Web App',
  'httpRequest',
  4.4,
  [480, 0],
  {
    url: '={{ $json.targetUrl }}',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        { name: 'User-Agent', value: 'Oytra-Uptime-Monitor/1.0' },
        { name: 'Cache-Control', value: 'no-cache' },
      ],
    },
    options: {
      timeout: 10000,
      response: { response: { fullResponse: true, responseFormat: 'text' } },
    },
  },
  {
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 2000,
    onError: 'continueRegularOutput',
  }
);

// 4. Measure Response Time & Evaluate Status
code('Evaluate Health & Latency', [720, 0], getSrc('evaluate'));

// 5. IF Condition: Is the app Healthy?
add('App Healthy?', 'if', 2.2, [960, 0], {
  conditions: {
    options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
    conditions: [
      {
        id: require('node:crypto').randomUUID(),
        leftValue: '={{ $json.isSuccess }}',
        rightValue: true,
        operator: { type: 'boolean', operation: 'equals' },
      },
    ],
    combinator: 'and',
  },
  options: {},
});

// Branch False (Output 1): Down / Unhealthy -> Incident Alert
code('Format Incident Alert', [1200, 160], getSrc('format-alert'));

add(
  'Send Incident Alert',
  'discord',
  2,
  [1440, 160],
  {
    authentication: 'webhook',
    resource: 'message',
    operation: 'sendLegacy',
    content: '={{ $json.content }}',
    options: { wait: true },
  },
  { onError: 'continueRegularOutput' }
);

code(
  'Log Incident Receipt',
  [1680, 160],
  `const alert = $('Format Incident Alert').first().json;\nreturn [{\n  json: {\n    status: 'ALERT_DELIVERED',\n    category: alert.statusCategory,\n    target: alert.target,\n    recordedAt: new Date().toISOString()\n  }\n}];`
);

// Branch True (Output 0): Healthy -> Heartbeat
code('Format Heartbeat Pulse', [1200, -140], getSrc('format-pulse'));

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
    executionTimeout: 60,
  },
  active: false,
  pinData: {},
  tags: ['uptime', 'bonus', 'monitoring', 'realworld'],
};

const outDir = path.join(root, 'bonus-uptime');
fs.mkdirSync(outDir, { recursive: true });
const targetFile = path.join(outDir, 'Bonus_UptimeMonitor_Kumar_Kaushik.json');
fs.writeFileSync(targetFile, JSON.stringify(workflow, null, 2) + '\n');

console.log(`Successfully generated ${nodes.length}-node Uptime Monitor workflow: ${targetFile}`);
