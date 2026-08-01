class ImageScanner {
  scan(image) {
    console.log(`[ImageScanner] Simulating vulnerability scan for image: ${image}...`);
    // Simulated scan results
    return {
      scannedAt: new Date().toISOString(),
      status: 'CLEAN',
      vulnerabilities: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };
  }
}

module.exports = { ImageScanner };
