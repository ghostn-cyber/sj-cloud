class ImageHistory {
  constructor() {
    this.history = [];
  }

  record(image, digest) {
    this.history.push({
      timestamp: new Date().toISOString(),
      image,
      digest
    });
  }

  getHistory() {
    return this.history;
  }
}

module.exports = { ImageHistory };
