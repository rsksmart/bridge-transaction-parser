const ethers = require('ethers');
const networkParser = require('./network-parser');
const BridgeTransactionParser = require('../index');

(async () => {
    try {
        const network = networkParser(process.argv[2]);
        const bridgeTransactionParser = new BridgeTransactionParser(network);
        const transactionHash = process.argv[3]; // Format: 0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7
        const transaction = await bridgeTransactionParser.getBridgeTransactionByTxHash(transactionHash)
        
        if (transaction) {
            console.log(JSON.stringify(transaction, (key, value) =>
                typeof value === "bigint" ? value.toString() : value, 2
            ));
        } else {
            console.log(`Tx ${transactionHash} not found or not a Bridge transaction`);
        }
    } catch (error) {
        console.log(error);
    }
})();
