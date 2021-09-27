const Web3 = require('web3');
const networkParser = require('./network-parser');
const checkBridgeEvent = require('../index');

(async () => {
    try {

        const network = process.argv[2];
        const web3Client = new Web3(networkParser(network));

        const startingBlock = process.argv[3];
        const blocksToSearch = process.argv[4]; // optional, default is 10

        const result = await checkBridgeEvent(web3Client, startingBlock, blocksToSearch);
        console.log(JSON.stringify(result, null, 4));
    } catch (error) {
        console.log(error);
    }
})();
