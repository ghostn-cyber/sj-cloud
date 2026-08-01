class ImageCache {
  constructor() {
    this.cache = new Map();
  }

  set(image, digest) {
    this.cache.set(image, digest);
  }

  get(image) {
    return this.cache.get(image) || null;
  }

  clear() {
    this.cache.clear();
  }
}

module.exports = { ImageCache };
