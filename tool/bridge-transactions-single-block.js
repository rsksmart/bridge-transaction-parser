const networkParser = require('./network-parser');
const BridgeTransactionParser = require('../index');
const createRskClient = require("./create-rsk-client");

(async () => {
    try {
        const network = process.argv[2];
        const rskClient = createRskClient(networkParser(network));
        const bridgeTransactionParser = new BridgeTransactionParser(rskClient);
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
