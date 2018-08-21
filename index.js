const modules = require('./libs');

function getModule(moduleName) {
  if(modules.hasOwnProperty(moduleName)) {
    return modules[moduleName];
  }
  return {};
}

module.exports = {
  getModule
}