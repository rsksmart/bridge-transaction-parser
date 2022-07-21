const verifyHashOrBlockNumber = (blockHashOrBlockNumber) => {
    if (typeof blockHashOrBlockNumber === "string" &&
        blockHashOrBlockNumber.indexOf("0x") === 0 &&
        blockHashOrBlockNumber.length !== 66) {
        throw new Error('Hash must be of length 66 starting with "0x"');
    } else if (isNaN(blockHashOrBlockNumber) || blockHashOrBlockNumber <= 0) {
        throw new Error("Block number must be greater than 0");
    }
};

module.exports = {
    verifyHashOrBlockNumber,
};
