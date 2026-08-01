const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONFIG_DIR = path.resolve(__dirname, '../../../../config/services');

function migrate() {
  const files = fs.readdirSync(CONFIG_DIR);
  for (const file of files) {
    if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      const filePath = path.join(CONFIG_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      try {
        const parsed = yaml.load(content);
        if (parsed.apiVersion) {
          console.log(`Skipping already migrated: ${file}`);
          continue;
        }

        const migrated = {
          apiVersion: 'mesh.sjcloud.io/v1alpha1',
          kind: 'Service',
          schemaVersion: 1,
          metadata: {
            name: parsed.service.id
          },
          spec: parsed
        };

        fs.writeFileSync(filePath, yaml.dump(migrated, { noRefs: true, lineWidth: 120 }), 'utf8');
        console.log(`Successfully migrated: ${file}`);
      } catch (err) {
        console.error(`Failed to migrate ${file}: ${err.message}`);
      }
    }
  }
}

migrate();
