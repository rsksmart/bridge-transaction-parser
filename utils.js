const verifyHashOrBlockNumber = (blockHashOrBlockNumber) => {
    if (typeof blockHashOrBlockNumber === "string" &&
        blockHashOrBlockNumber.indexOf("0x") === 0 &&
        blockHashOrBlockNumber.length !== 66) {
        throw new Error('Hash must be of length 66 starting with "0x"');
    } else if (isNaN(blockHashOrBlockNumber) || blockHashOrBlockNumber <= 0) {
        throw new Error("Block number must be greater than 0");
    }
};

const formatBigIntForJson = obj => {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'bigint') {
        return obj.toString();
    }

    if (Array.isArray(obj)) {
        return obj.map(formatBigIntForJson);
    }

    if (typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = formatBigIntForJson(value);
        }
        return result;
    }

    return obj;
};

// Errors that point to a dropped or stuck connection, not to a bad request.
const RETRYABLE_ERROR_CODES = new Set([
    'TIMEOUT',
    'NETWORK_ERROR',
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'EPIPE'
]);

const isRetryableError = error => RETRYABLE_ERROR_CODES.has(error?.code);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async (operation, {retries = 3, baseDelayMs = 500} = {}) => {
    for (let attempt = 0; ; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (!isRetryableError(error) || attempt >= retries) {
                throw error;
            }
            await sleep(baseDelayMs * 2 ** attempt);
        }
    }
};

module.exports = {
    verifyHashOrBlockNumber,
    formatBigIntForJson,
    withRetry
};
