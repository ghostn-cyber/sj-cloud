/**
 * Translates Docker API version path headers (v1.24 -> v1.40)
 * @param {Buffer} data - Binary buffer payload
 * @returns {Object} Translation results
 */
function translate(data) {
  const str = data.toString('binary');
  if (str.includes('/v1.24/')) {
    const rewritten = str.replace(/\/v1\.24\//g, '/v1.40/');
    // Extract first line of HTTP request (e.g. GET /v1.24/containers/json HTTP/1.1)
    const requestLine = str.substring(0, str.indexOf('\r\n')).trim();
    return {
      modified: true,
      data: Buffer.from(rewritten, 'binary'),
      requestLine: requestLine
    };
  }
  return {
    modified: false,
    data: data
  };
}

module.exports = { translate };
