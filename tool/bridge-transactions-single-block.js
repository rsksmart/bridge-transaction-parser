const Web3 = require('web3');
const networkParser = require('./network-parser');
const blockTransactionParser = require('../index');

(async () => {
    try {

        const network = process.argv[2];
        const web3Client = new Web3(networkParser(network));

        const blockNumber = process.argv[3];

        const blockTransactions = await blockTransactionParser.getBridgeTransactionsInThisBlock(web3Client, blockNumber);
        console.log(JSON.stringify(blockTransactions, null, 4));

    } catch (error) {
        console.log(error);
    }
})();
