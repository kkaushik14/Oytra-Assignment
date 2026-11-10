const assert = require('node:assert/strict');
const vm = require('node:vm');
const { getSrc } = require('../bonus-uptime/src/index.js');

function runCode(codeStr, input, upstream = {}) {
  const context = {
    $input: { first: () => ({ json: input }) },
    $: (node) => ({ first: () => ({ json: upstream[node] }) }),
    Date,
    console,
  };
  return JSON.parse(
    JSON.stringify(vm.runInNewContext(`(function(){\n${codeStr}\n})()`, context))
  )[0].json;
}

// 1. Test Initialize Ping
const initRes = runCode(getSrc('initialize'), {});
assert.equal(initRes.targetUrl, 'https://demo.realworld.show');
assert.ok(typeof initRes.startTime === 'number');

// 2. Test Evaluate Health & Latency (Healthy case)
const healthyEval = runCode(
  getSrc('evaluate'),
  { statusCode: 200 },
  { 'Initialize Ping': { ...initRes, startTime: Date.now() - 150 } }
);
assert.equal(healthyEval.isSuccess, true);
assert.equal(healthyEval.statusCategory, 'HEALTHY');

// 3. Test Evaluate Health & Latency (Degraded case - slow latency)
const degradedEval = runCode(
  getSrc('evaluate'),
  { statusCode: 200 },
  { 'Initialize Ping': { ...initRes, startTime: Date.now() - 3500 } }
);
assert.equal(degradedEval.isSuccess, true);
assert.equal(degradedEval.isDegraded, true);
assert.equal(degradedEval.statusCategory, 'DEGRADED');

// 4. Test Evaluate Health & Latency (Down case - 503 error)
const downEval = runCode(
  getSrc('evaluate'),
  { statusCode: 503 },
  { 'Initialize Ping': { ...initRes, startTime: Date.now() - 200 } }
);
assert.equal(downEval.isSuccess, false);
assert.equal(downEval.statusCategory, 'DOWN');

// 5. Test Format Incident Alert
const alertRes = runCode(getSrc('format-alert'), downEval);
assert.ok(alertRes.content.includes('SERVICE DOWN'));
assert.ok(alertRes.content.includes('503'));
assert.ok(alertRes.content.length < 2000);

// 6. Test Format Heartbeat Pulse
const pulseRes = runCode(getSrc('format-pulse'), healthyEval);
assert.equal(pulseRes.status, 'HEALTHY');
assert.equal(pulseRes.latencySLA, 'EXCELLENT');

console.log(
  'PASS: Bonus Uptime Monitor logic (Healthy, Degraded, Down, Incident Alert formatting, Heartbeat pulse).'
);
