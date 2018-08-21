const fs = require('fs');
const path = require('path');

module.exports = (() => {
  try {
    let files = fs.readdirSync(path.dirname(__filename));
    const exportsModules = {};

    files = files.filter(file => file !== 'index.js');

    files.forEach(file => {
      const stats = fs.lstatSync(path.join(__dirname, file));
      if(stats.isDirectory) {
        exportsModules[file] = require(`./${file}`);
      }
    });

    return exportsModules;
  } catch(error) {
    console.error(error);
  }
})();
