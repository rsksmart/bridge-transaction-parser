const chai = require('chai');
const {withRetry} = require('../utils');
const {assert, expect} = chai;

const errorWithCode = code => Object.assign(new Error(code), {code});

const failingTimes = (failures, error, result) => {
    let calls = 0;
    const operation = async () => {
        calls++;
        if (calls <= failures) {
            throw error;
        }
        return result;
    };
    operation.calls = () => calls;
    return operation;
};

describe('withRetry', () => {

    const noDelay = {baseDelayMs: 0};

    it('Should return the result without retry when the operation succeeds', async () => {
        const operation = failingTimes(0, null, 'ok');

        assert.equal(await withRetry(operation, noDelay), 'ok');
        assert.equal(operation.calls(), 1);
    });

    it('Should retry and return the result after a timeout', async () => {
        const operation = failingTimes(1, errorWithCode('TIMEOUT'), 'ok');

        assert.equal(await withRetry(operation, noDelay), 'ok');
        assert.equal(operation.calls(), 2);
    });

    it('Should retry after a socket error', async () => {
        const operation = failingTimes(2, errorWithCode('ECONNRESET'), 'ok');

        assert.equal(await withRetry(operation, noDelay), 'ok');
        assert.equal(operation.calls(), 3);
    });

    it('Should throw the last error when all retries time out', async () => {
        const operation = failingTimes(Infinity, errorWithCode('TIMEOUT'));

        await expect(withRetry(operation, {retries: 3, baseDelayMs: 0}))
            .to.be.rejectedWith('TIMEOUT');
        assert.equal(operation.calls(), 4);
    });

    it('Should not retry an error that is not retryable', async () => {
        const operation = failingTimes(Infinity, errorWithCode('CALL_EXCEPTION'));

        await expect(withRetry(operation, noDelay)).to.be.rejectedWith('CALL_EXCEPTION');
        assert.equal(operation.calls(), 1);
    });

    it('Should not retry an error without a code', async () => {
        const operation = failingTimes(Infinity, new Error('boom'));

        await expect(withRetry(operation, noDelay)).to.be.rejectedWith('boom');
        assert.equal(operation.calls(), 1);
    });
});
