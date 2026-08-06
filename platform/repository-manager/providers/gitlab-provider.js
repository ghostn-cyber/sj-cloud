const { LocalProvider } = require('./local-provider');

class GitLabProvider extends LocalProvider {
  _getAuthUrl(repoUrl, credentials = {}) {
    if (!credentials.token) return repoUrl;
    // Replace https://gitlab.com/ with https://oauth2:<token>@gitlab.com/
    return repoUrl.replace('https://gitlab.com/', `https://oauth2:${credentials.token}@gitlab.com/`);
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
  GitLabProvider
};
