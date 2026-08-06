class TokenManager {
  validateToken(token) {
    if (!token) return false;
    // Check if token starts with a known format or is sufficiently long
    return token.startsWith('tok_') || token.startsWith('ghp_') || token.length >= 20;
  }

  isExpired(tokenMetadata) {
    if (!tokenMetadata || !tokenMetadata.expiresAt) return false;
    return new Date(tokenMetadata.expiresAt) < new Date();
  }
}

const globalTokenManager = new TokenManager();

module.exports = {
  TokenManager,
  globalTokenManager
};
