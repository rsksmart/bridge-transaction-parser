const NETWORKS = {
    mainnet: 'https://public-node.rsk.co/',
    testnet: 'https://public-node.testnet.rsk.co/'
};

module.exports = networkParser = (network) => {
    if (NETWORKS[network]) {
        return NETWORKS[network];
    }
    if (network.startsWith('http')) {
        return network;
    }
    throw new Error(`${network} is not a valid value for the host to connect to. Accepted values: ${Object.keys(NETWORKS)} or an http url`);
};
