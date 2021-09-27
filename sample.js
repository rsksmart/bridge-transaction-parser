const Web3 = require('web3');
const networkParser = require('./network');
const checkBridgeEvent = require('./index');

(async () => {
    try {
        const startingBlock = 3701647;
        const blocksToSearch = 5; // optional, default is 10
        const network = "mainnet";

        const web3Client = new Web3(networkParser(network));
        const result = await checkBridgeEvent(web3Client, startingBlock, blocksToSearch);
        console.log(JSON.stringify(result, null, 4));
    } catch (error) {
        console.log(error);
    }
})();
