const fs = require('node:fs');
const path = require('node:path');

const readSrc = (file) => fs.readFileSync(path.join(__dirname, file), 'utf8');

const initialize = readSrc('initialize.js');
const evaluate = readSrc('evaluate.js');
const formatAlert = readSrc('format-alert.js');
const formatPulse = readSrc('format-pulse.js');

module.exports = {
  initialize,
  evaluate,
  formatAlert,
  formatPulse,
  getSrc(name) {
    switch (name) {
      case 'initialize':
        return initialize;
      case 'evaluate':
        return evaluate;
      case 'format-alert':
      case 'formatAlert':
        return formatAlert;
      case 'format-pulse':
      case 'formatPulse':
        return formatPulse;
      default:
        throw new Error(`Unknown uptime node source: ${name}`);
    }
  },
};
