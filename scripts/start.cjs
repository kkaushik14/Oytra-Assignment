const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

console.log('\n============================================================');
console.log('  OYTRA ASSIGNMENT — TEST RUNNER & APPLICATION VERIFICATION');
console.log('  Candidate: Kumar Kaushik');
console.log('============================================================\n');

console.log('🔍 [1/3] Verifying core deliverables on disk...');
const deliverables = [
  'task1-qa/Task1_QA_Report_Kumar_Kaushik.pdf',
  'task1-qa/findings.json',
  'task1-qa/test-matrix.md',
  'task2-n8n/Task2_Workflow_Kumar_Kaushik.json',
  'task2-n8n/screenshots/Task2_Workflow_Canvas.png',
  'bonus-uptime/Bonus_UptimeMonitor_Kumar_Kaushik.json',
  'README.md',
  'WALKTHROUGH.md',
];

let allPresent = true;
for (const rel of deliverables) {
  const full = path.join(root, rel);
  if (fs.existsSync(full)) {
    const stat = fs.statSync(full);
    console.log(`  ✅ ${rel} (${(stat.size / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`  ❌ MISSING: ${rel}`);
    allPresent = false;
  }
}
if (!allPresent) {
  console.error('\n❌ Error: One or more deliverables are missing.');
  process.exit(1);
}

console.log('\n🧪 [2/3] Running automated unit tests for Task 2 (GitHub Digest)...');
require('./test-workflow-code.cjs');

console.log('\n🧪 [3/3] Running automated unit tests for Bonus Task (Uptime Monitor)...');
require('./test-bonus-workflow.cjs');

console.log('\n============================================================');
console.log('  🎉 ALL APP TESTS & DELIVERABLE CHECKS PASSED SUCCESSFULLY!');
console.log('============================================================\n');
