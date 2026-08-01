const { IdentityResolver: BaseIdentityResolver } = require('../identity');

class IdentityResolver {
  static resolve(spec) {
    const identityObj = BaseIdentityResolver.resolve(spec);
    return identityObj.toJSON();
  }
}

module.exports = IdentityResolver;
