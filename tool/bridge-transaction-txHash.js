const Web3 = require('web3');
const networkParser = require('./network-parser');
const blockTransactionParser = require('../index');

(async () => {
    try {

        const network = process.argv[2];
        const web3Client = new Web3(networkParser(network));

        const transactionHash = process.argv[3]; // Format: 0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7
        const transaction = await blockTransactionParser.getBridgeTransactionsByTxHash(web3Client, transactionHash)
        console.log(transaction);

    } catch (error) {
        console.log(error);
    }
})();
