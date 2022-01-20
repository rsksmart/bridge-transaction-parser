const bitcoin = require("bitcoinjs-lib");

const btcAddressFromPublicKeyHash = (pubKeyHash, network) => {
    return bitcoin.payments.p2pkh({
        hash: Buffer.from(stripHexPrefix(pubKeyHash), "hex"),
        network: getNetwork(network),
    }).address;
};

const getNetwork = (network) => {
    return network === "mainnet" ? bitcoin.networks.MAINNET : bitcoin.networks.testnet;
};

const stripHexPrefix = (str) => {
    return typeof str === "string" && str.startsWith("0x") ? str.slice(2) : str;
};

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
    btcAddressFromPublicKeyHash,
    verifyHashOrBlockNumber,
};
