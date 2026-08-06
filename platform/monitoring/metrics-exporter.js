const { globalMetricsRegistry } = require('./metrics-registry');
const { globalMetricsStorage } = require('./metrics-storage');

class MetricsExporter {
  exportPrometheus() {
    let output = '';
    const definitions = globalMetricsRegistry.getAllDefinitions();
    
    for (const def of definitions) {
      output += `# HELP ${def.name} ${def.help}\n`;
      output += `# TYPE ${def.name} ${def.type}\n`;
      
      const values = globalMetricsStorage.getAll().filter(v => v.name === def.name);
      if (values.length === 0) {
        output += `${def.name} 0\n`;
      } else {
        for (const item of values) {
          const sortedKeys = Object.keys(item.labels).sort();
          const labelParts = sortedKeys.map(k => `${k}="${item.labels[k]}"`);
          const labelStr = labelParts.length > 0 ? `{${labelParts.join(',')}}` : '';
          output += `${def.name}${labelStr} ${item.value}\n`;
        }
      }
      output += '\n';
    }
    return output;
  }
}

const globalMetricsExporter = new MetricsExporter();

module.exports = {
  MetricsExporter,
  globalMetricsExporter
};
