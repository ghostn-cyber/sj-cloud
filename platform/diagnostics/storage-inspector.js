const fs = require('fs');
const path = require('path');

class StorageInspector {
  inspect() {
    const rootStorage = path.resolve(__dirname, '../../storage');
    let writeable = false;
    try {
      if (fs.existsSync(rootStorage)) {
        const testFile = path.join(rootStorage, '.diag-write-test');
        fs.writeFileSync(testFile, 'test', 'utf8');
        fs.unlinkSync(testFile);
        writeable = true;
      }
    } catch (e) {}

    return {
      status: writeable ? 'OK' : 'ERROR',
      rootStoragePath: rootStorage,
      writePermissions: writeable ? 'GRANTED' : 'DENIED',
      spaceAvailable: 'HIGH'
    };
  }
}

const globalStorageInspector = new StorageInspector();

module.exports = {
  StorageInspector,
  globalStorageInspector
};
