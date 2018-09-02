const fs = require('fs');
const path = require('path');

module.exports = (() => {
  try {
    const modulesPath = path.join(__dirname, 'libs');
    let files = fs.readdirSync(modulesPath);
    const exportsModules = {};

    files = files.filter(file => file !== 'index.js');

    files.forEach(file => {
      const filePath = path.join(modulesPath, file);
      const stats = fs.lstatSync(filePath);
      if(stats.isDirectory) {
        exportsModules[file] = require(filePath);
      }
    });

    return exportsModules;
  } catch(error) {
    console.error(error);
  }
})();
