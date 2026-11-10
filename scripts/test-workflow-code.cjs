const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const { getSrc } = require('../task2-n8n/src/index.js');

const root = path.resolve(__dirname, '..');

function run(name, input, upstream = {}) {
  const source = getSrc(name);
  return JSON.parse(
    JSON.stringify(
      vm.runInNewContext(`(function(){\n${source}\n})()`, {
        $input: { first: () => ({ json: input }) },
        $: (node) => ({ first: () => ({ json: upstream[node] }) }),
        Date,
        console,
      })
    )
  )[0].json;
}

// 1. Configure Request validation tests
const config = run('configure', { body: { topic: 'automation', threshold: 1000 } });
assert.equal(config.topic, 'automation');
assert.throws(() => run('configure', { body: { topic: '../../private' } }));
assert.throws(() => run('configure', { body: { threshold: -1 } }));
assert.throws(() => run('configure', { body: { threshold: 99999999 } }));

// 2. Normalize and Top-Five tests
const fixturePath = path.join(root, 'task2-n8n/fixtures/sample-github-search.json');
const sample = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const normalized = run('normalize', sample, { 'Configure request': config });
assert.equal(normalized.count, 5);
assert.ok(normalized.repositories.every((r, i, a) => !i || a[i - 1].stars >= r.stars));
assert.equal(run('normalize', { items: [] }, { 'Configure request': config }).count, 0);
assert.throws(() => run('normalize', {}, { 'Configure request': config }));
assert.throws(() => run('normalize', { items: [{}] }, { 'Configure request': config }));
assert.equal(
  run(
    'normalize',
    { items: [{}, sample.items[0], sample.items[0]] },
    { 'Configure request': config }
  ).count,
  1
);

// 3. Language Enrichment tests
const enriched = run(
  'enrich',
  { TypeScript: 750, JavaScript: 250 },
  { 'Normalize top five': normalized }
);
assert.equal(enriched.enrichment.languages[0].percent, 75);
assert.equal(
  run('enrich', { error: 'Simulated unavailable' }, { 'Normalize top five': normalized }).enrichment
    .status,
  'unavailable'
);

// 4. Digest Formatting tests
for (const priority of ['high', 'standard']) {
  const digest = run('format', { ...enriched, priority });
  assert.ok(digest.content.length <= 2000);
  assert.ok(digest.content.includes(priority === 'high' ? 'PRIORITY' : 'STANDARD'));
  assert.ok(digest.content.includes('TypeScript 75%'));
}
assert.ok(
  run('format', { ...config, repositories: [], count: 0, priority: 'empty' }).content.includes(
    'No matching'
  )
);

console.log(
  'PASS: configuration, ranking/top-five, empty response, malformed response, filtering/deduplication, enrichment, fallback, both digest formats and message size.'
);
console.log(
  'These are Code-node logic checks, not evidence of an executed n8n workflow or Discord delivery.'
);
