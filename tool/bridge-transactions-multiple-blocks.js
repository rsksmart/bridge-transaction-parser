const Web3 = require('web3');
const networkParser = require('./network-parser');
const BridgeTransactionParser = require('../index');

(async () => {
    try {
        const network = process.argv[2];
        const web3Client = new Web3(networkParser(network));
        const bridgeTransactionParser = new BridgeTransactionParser(web3Client);
        const startingBlock = process.argv[3];
        const blocksToSearch = process.argv[4]; // Input should be between 1 and 100
        
        console.log("Searching...");
        const transactions = await bridgeTransactionParser.getBridgeTransactionsSinceThisBlock(startingBlock, blocksToSearch);
        
        if (transactions.length) {
            console.log(JSON.stringify(transactions, null, 2));
        } else {
            console.log(`No Bridge transactions found between blocks ${startingBlock} and ${Number(startingBlock) + Number(blocksToSearch) - 1}`);
        }
    } catch (error) {
        console.log(error);
    }
})();
