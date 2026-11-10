const { execSync } = require('node:child_process');
const path = require('node:path');

const run = (cmd) => execSync(cmd, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });

module.exports = {
  testWorkflow() {
    run('node scripts/test-workflow-code.cjs');
  },
  testBonus() {
    run('node scripts/test-bonus-workflow.cjs');
  },
  testAll() {
    run('node scripts/test-workflow-code.cjs');
    run('node scripts/test-bonus-workflow.cjs');
  },
  buildWorkflow() {
    run('node scripts/build-workflow.cjs');
  },
  buildBonusWorkflow() {
    run('node scripts/build-bonus-workflow.cjs');
  },
};
