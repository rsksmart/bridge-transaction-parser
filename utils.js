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

module.exports = {
    verifyHashOrBlockNumber,
    formatBigIntForJson
};
