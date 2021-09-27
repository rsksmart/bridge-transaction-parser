const {NETWORKS} = require('./network');

module.exports = (arguments) => {

    if (arguments.length < 3) {
        throw reject();
    }

    const startingBlock = parseInt(arguments[2]);
    if (isNaN(startingBlock) || startingBlock < 0) {
        throw reject();
    }

    let blocksToSearch;
    if (arguments.length >= 4) {
        blocksToSearch = parseInt(arguments[3]);
    }
    if (isNaN(blocksToSearch) || blocksToSearch > 100 || blocksToSearch <= 0) {
        blocksToSearch = 100;
        console.log(`Setting Default for blocksToSearch to ${blocksToSearch}`);
    }

    let network;
    if (arguments.length >= 5) {
        network = NETWORKS[arguments[4]];
    }
    if (!network) {
        network = NETWORKS.testnet;
        console.log(`Setting Default for network to ${network}`);
    }

    return {startingBlock, blocksToSearch, network};
}

const reject = () => {
    return `
    Please provide the following parameters:
     - startingBlock(number) [must be bigger than 0] (REQUIRED)
     - blocksToSearch(number) [must be smaller than or equals 100] (DEFAULT: 10)
     - network(string): values => ${Object.keys(NETWORKS)} (DEFAULT: testnet)
    `;
};
