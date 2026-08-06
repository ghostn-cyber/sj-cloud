const { LocalProvider } = require('./local-provider');

class GitHubProvider extends LocalProvider {
  _getAuthUrl(repoUrl, credentials = {}) {
    if (!credentials.token) return repoUrl;
    // Replace https://github.com/ with https://<token>@github.com/
    return repoUrl.replace('https://github.com/', `https://${credentials.token}@github.com/`);
  }

  clone(repoUrl, destination, credentials = {}) {
    const authUrl = this._getAuthUrl(repoUrl, credentials);
    return super.clone(authUrl, destination, credentials);
  }

  getBranches(repoUrl, credentials = {}) {
    const authUrl = this._getAuthUrl(repoUrl, credentials);
    return super.getBranches(authUrl, credentials);
  }
}

module.exports = {
  GitHubProvider
};
