const ethers = require('ethers');
const networkParser = require('./network-parser');
const BridgeTransactionParser = require('../index');

(async () => {
    try {
        const network = networkParser(process.argv[2]);
        const bridgeTransactionParser = new BridgeTransactionParser(network);
        const blockNumber = Number(process.argv[3]);

        const blockTransactions = await bridgeTransactionParser.getBridgeTransactionsInThisBlock(blockNumber);
        if (blockTransactions.length) {
            console.log(JSON.stringify(blockTransactions, (key, value) =>
                typeof value === "bigint" ? value.toString() : value, 2
            ));
        } else {
            console.log(`No Bridge transactions found in block ${blockNumber}`);
        }
    } catch (error) {
        console.log(error);
    }
})();
