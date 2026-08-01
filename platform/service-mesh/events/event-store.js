class EventStore {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.events = [];
  }

  add(event) {
    this.events.push(event);
    if (this.events.length > this.maxSize) {
      this.events.shift();
    }
  }

  getEvents(filter = {}) {
    return this.events.filter(evt => {
      if (filter.type && evt.type !== filter.type) return false;
      if (filter.since && evt.timestamp < filter.since) return false;
      return true;
    });
  }

  clear() {
    this.events = [];
  }
}

const globalEventStore = new EventStore();

module.exports = {
  EventStore,
  globalEventStore
};
