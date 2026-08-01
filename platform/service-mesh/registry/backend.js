const RegistryBackend = require('./backends/backend-interface');
const FilesystemBackend = require('./backends/filesystem-backend');

module.exports = {
  RegistryBackend,
  FilesystemBackend
};
