const fs = require('node:fs');
const path = require('node:path');
const { getSrc } = require('../task2-n8n/src/index.js');

const root = path.resolve(__dirname, '..');
const src = getSrc;
const nodes = [],
  connections = {};
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
const condition = (left, operation, right) => ({
  conditions: {
    options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
    conditions: [
      {
        id: require('node:crypto').randomUUID(),
        leftValue: left,
        rightValue: right,
        operator: { type: 'number', operation },
      },
    ],
    combinator: 'and',
  },
  options: {},
});
const httpOptions = { timeout: 15000, response: { response: { responseFormat: 'json' } } };
add(
  'Digest webhook',
  'webhook',
  2.1,
  [0, 0],
  {
    httpMethod: 'POST',
    path: 'oytra-repository-digest',
    responseMode: 'responseNode',
    options: {},
  },
  { webhookId: require('node:crypto').randomUUID() }
);
code('Configure request', [220, 0], src('configure'), { onError: 'continueErrorOutput' });
add(
  'Search GitHub',
  'httpRequest',
  4.4,
  [440, 0],
  {
    url: 'https://api.github.com/search/repositories',
    sendQuery: true,
    queryParameters: {
      parameters: [
        { name: 'q', value: '={{ "topic:" + $json.topic }}' },
        { name: 'sort', value: 'stars' },
        { name: 'order', value: 'desc' },
        { name: 'per_page', value: '10' },
      ],
    },
    sendHeaders: true,
    headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github+json' }] },
    options: httpOptions,
  },
  { retryOnFail: true, maxTries: 2, waitBetweenTries: 1000, onError: 'continueErrorOutput' }
);
code('Normalize top five', [660, 0], src('normalize'), { onError: 'continueErrorOutput' });
add('Any results?', 'if', 2.2, [880, 0], condition('={{ $json.count }}', 'gt', 0));
add(
  'Get language breakdown',
  'httpRequest',
  4.4,
  [1100, -100],
  {
    url: '={{ "https://api.github.com/repos/" + encodeURIComponent($json.repositories[0].owner) + "/" + encodeURIComponent($json.repositories[0].name) + "/languages" }}',
    sendHeaders: true,
    headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github+json' }] },
    options: httpOptions,
  },
  { retryOnFail: true, maxTries: 2, waitBetweenTries: 1000, onError: 'continueRegularOutput' }
);
code('Combine enrichment', [1320, -100], src('enrich'), { onError: 'continueErrorOutput' });
add(
  'Popularity threshold',
  'if',
  2.2,
  [1540, -100],
  condition('={{ $json.topStars }}', 'gt', '={{ $json.threshold }}')
);
code('Priority digest', [1760, -200], "return [{json:{...$input.first().json,priority:'high'}}];");
code('Standard digest', [1760, 0], "return [{json:{...$input.first().json,priority:'standard'}}];");
code(
  'No results notice',
  [1100, 180],
  "return [{json:{...$input.first().json,priority:'empty'}}];"
);
code('Format digest', [1980, 0], src('format'), { onError: 'continueErrorOutput' });
add(
  'Send Discord digest',
  'discord',
  2,
  [2200, 0],
  {
    authentication: 'webhook',
    resource: 'message',
    operation: 'sendLegacy',
    content: '={{ $json.content }}',
    options: { wait: true },
  },
  { onError: 'continueErrorOutput' }
);
code(
  'Delivery receipt',
  [2420, 0],
  "const message=$input.first().json; const digest=$('Format digest').first().json; if(!message.id) throw new Error('Discord did not return a message ID.'); return [{json:{status:'delivered',priority:digest.priority,count:digest.count,topic:digest.topic,enrichment:digest.enrichment?.status ?? 'not-attempted',messageId:message.id,executionId:$execution.id}}];",
  { onError: 'continueErrorOutput' }
);
add('Respond success', 'respondToWebhook', 1.5, [2640, 0], {
  respondWith: 'json',
  responseBody: '={{ $json }}',
  options: { responseCode: 200 },
});
code(
  'Report failure',
  [1980, 400],
  "return [{json:{status:'failed',message:'Request processing or notification delivery failed. Inspect this execution for the failing node.',executionId:$execution.id}}];"
);
add('Respond failure', 'respondToWebhook', 1.5, [2200, 400], {
  respondWith: 'json',
  responseBody: '={{ $json }}',
  options: { responseCode: 502 },
});
add('Mark execution failed', 'stopAndError', 1, [2420, 400], {
  errorType: 'errorMessage',
  errorMessage: '={{ $json.message }}',
});
link('Digest webhook', 'Configure request');
link('Configure request', 'Search GitHub');
link('Search GitHub', 'Normalize top five');
link('Normalize top five', 'Any results?');
link('Any results?', 'Get language breakdown');
link('Any results?', 'No results notice', 1);
link('Get language breakdown', 'Combine enrichment');
link('Combine enrichment', 'Popularity threshold');
link('Popularity threshold', 'Priority digest');
link('Popularity threshold', 'Standard digest', 1);
for (const n of ['Priority digest', 'Standard digest', 'No results notice'])
  link(n, 'Format digest');
link('Format digest', 'Send Discord digest');
link('Send Discord digest', 'Delivery receipt');
link('Delivery receipt', 'Respond success');
for (const n of [
  'Configure request',
  'Search GitHub',
  'Normalize top five',
  'Combine enrichment',
  'Format digest',
  'Send Discord digest',
  'Delivery receipt',
])
  link(n, 'Report failure', 1);
link('Report failure', 'Respond failure');
link('Respond failure', 'Mark execution failed');
const workflow = {
  name: 'Oytra — GitHub Repository Intelligence Digest',
  nodes,
  connections,
  settings: {
    executionOrder: 'v1',
    saveDataErrorExecution: 'all',
    saveDataSuccessExecution: 'all',
    saveManualExecutions: true,
    executionTimeout: 120,
  },
  active: false,
  pinData: {},
  tags: [],
};
fs.writeFileSync(
  path.join(root, 'task2-n8n/Task2_Workflow_Kumar_Kaushik.json'),
  JSON.stringify(workflow, null, 2) + '\n'
);
console.log(
  `Built ${nodes.length} nodes. Select a Discord credential after importing; credential secrets are intentionally excluded.`
);
