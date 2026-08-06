class OAuthManager {
  constructor() {
    this.clients = new Map();
  }

  registerClient(provider, clientId, clientSecret) {
    this.clients.set(provider, { clientId, clientSecret });
  }

  async exchangeCode(provider, code) {
    // Simulate OAuth code exchange
    return {
      access_token: `tok_oauth_${Math.random().toString(36).substr(2, 10)}`,
      refresh_token: `ref_oauth_${Math.random().toString(36).substr(2, 10)}`,
      expires_in: 3600
    };
  }

  async refreshToken(provider, refreshToken) {
    // Simulate token refresh
    return {
      access_token: `tok_oauth_refreshed_${Math.random().toString(36).substr(2, 10)}`,
      expires_in: 3600
    };
  }
}

const globalOAuthManager = new OAuthManager();

module.exports = {
  OAuthManager,
  globalOAuthManager
};
