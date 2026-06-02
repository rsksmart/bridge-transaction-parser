const chai = require('chai');

exports.mochaHooks = {
  async beforeAll() {
    const { default: chaiAsPromised } = await import('chai-as-promised');
    chai.use(chaiAsPromised);
  },
};
