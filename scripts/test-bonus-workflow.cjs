const assert = require('node:assert/strict');
const vm = require('node:vm');

function runCode(codeStr, input, upstream = {}) {
  const context = {
    $input: { first: () => ({ json: input }) },
    $: (node) => ({ first: () => ({ json: upstream[node] }) }),
    Date,
    console
  };
  return JSON.parse(JSON.stringify(vm.runInNewContext(`(function(){\n${codeStr}\n})()`, context)))[0].json;
}

// 1. Test Initialize Ping
const initCode = `
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
`;
const initRes = runCode(initCode, {});
assert.equal(initRes.targetUrl, 'https://demo.realworld.show');
assert.ok(typeof initRes.startTime === 'number');

// 2. Test Evaluate Health & Latency (Healthy case)
const evalCode = `
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
`;

const healthyEval = runCode(evalCode, { statusCode: 200 }, { 'Initialize Ping': { ...initRes, startTime: Date.now() - 150 } });
assert.equal(healthyEval.isSuccess, true);
assert.equal(healthyEval.statusCategory, 'HEALTHY');

// 3. Test Evaluate Health & Latency (Degraded case - slow latency)
const degradedEval = runCode(evalCode, { statusCode: 200 }, { 'Initialize Ping': { ...initRes, startTime: Date.now() - 3500 } });
assert.equal(degradedEval.isSuccess, true);
assert.equal(degradedEval.isDegraded, true);
assert.equal(degradedEval.statusCategory, 'DEGRADED');

// 4. Test Evaluate Health & Latency (Down case - 500 error)
const downEval = runCode(evalCode, { statusCode: 503 }, { 'Initialize Ping': { ...initRes, startTime: Date.now() - 200 } });
assert.equal(downEval.isSuccess, false);
assert.equal(downEval.statusCategory, 'DOWN');

// 5. Test Format Incident Alert
const formatAlertCode = `
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
`;

const alertRes = runCode(formatAlertCode, downEval);
assert.ok(alertRes.content.includes('SERVICE DOWN'));
assert.ok(alertRes.content.includes('503'));
assert.ok(alertRes.content.length < 2000);

console.log('PASS: Bonus Uptime Monitor logic (Healthy, Degraded, Down, Incident Alert formatting).');
