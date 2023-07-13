const Web3 = require('web3');
const networkParser = require('./network-parser');
const BridgeTransactionParser = require('../index');

(async () => {
    try {
        const network = process.argv[2];
        const web3Client = new Web3(networkParser(network));
        const bridgeTransactionParser = new BridgeTransactionParser(web3Client);
        const blockNumber = process.argv[3];

        const blockTransactions = await bridgeTransactionParser.getBridgeTransactionsInThisBlock(blockNumber);
        if (blockTransactions.length) {
            console.log(JSON.stringify(blockTransactions, null, 2));
        } else {
            console.log(`No Bridge transactions found in block ${blockNumber}`);
        }
    } catch (error) {
        console.log(error);
    }
})();
