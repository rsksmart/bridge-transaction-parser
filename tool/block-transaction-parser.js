const Web3 = require('web3');
const networkParser = require('./network-parser');
const blockTransactionParser = require('../index');

(async () => {
    try {

        const network = process.argv[2];
        const web3Client = new Web3(networkParser(network));

        const startingBlock = process.argv[3];
        const blocksToSearch = process.argv[4]; // Input should be between 1 and 100

        // 1
        const blockNumber = startingBlock;
        
        const blockTransactions = await blockTransactionParser.getBridgeTransactionsInThisBlock(web3Client, blockNumber);
        console.log(JSON.stringify(blockTransactions, null, 4));

        // 2
        const blockHash = (await web3Client.eth.getBlock(blockNumber)).hash;
        const blockTransactions2 = await blockTransactionParser.getBridgeTransactionsSinceThisBlock(web3Client, blockHash, blocksToSearch);
        console.log(JSON.stringify(blockTransactions2, null, 4));

        // 3
        const transactionHash = "0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7"; // mainnet
        const transaction = await blockTransactionParser.getBridgeTransaction(web3Client, transactionHash)
        console.log(transaction);

    } catch (error) {
        console.log(error);
    }
})();
