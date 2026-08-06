const EventEmitter = require('events');

class ConfigEvents extends EventEmitter {}

const globalConfigEvents = new ConfigEvents();

module.exports = globalConfigEvents;
