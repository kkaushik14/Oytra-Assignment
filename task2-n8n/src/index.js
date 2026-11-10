const fs = require('node:fs');
const path = require('node:path');

const readSrc = (file) => fs.readFileSync(path.join(__dirname, file), 'utf8');

const configure = readSrc('configure.js');
const normalize = readSrc('normalize.js');
const enrich = readSrc('enrich.js');
const format = readSrc('format.js');

module.exports = {
  configure,
  normalize,
  enrich,
  format,
  getSrc(name) {
    switch (name) {
      case 'configure':
        return configure;
      case 'normalize':
        return normalize;
      case 'enrich':
        return enrich;
      case 'format':
        return format;
      default:
        throw new Error(`Unknown node source: ${name}`);
    }
  },
};
