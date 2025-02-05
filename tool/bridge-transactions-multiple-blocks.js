const networkParser = require('./network-parser');
const BridgeTransactionParser = require('../index');

(async () => {
    try {
        const network = networkParser(process.argv[2]);
        const bridgeTransactionParser = new BridgeTransactionParser(network);
        const startingBlock = Number(process.argv[3]);
        const blocksToSearch = Number(process.argv[4]); // Input should be between 1 and 100
        const transactions = await bridgeTransactionParser.getBridgeTransactionsSinceThisBlock(startingBlock, blocksToSearch);
        
        if (transactions.length) {
            console.log(JSON.stringify(transactions, (key, value) =>
                typeof value === "bigint" ? value.toString() : value, 2
            ));
        } else {
            console.log(`No Bridge transactions found between blocks ${startingBlock} and ${Number(startingBlock) + Number(blocksToSearch) - 1}`);
        }
    } catch (error) {
        console.log(error);
    }
})();
