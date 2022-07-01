const Web3 = require('web3');
const networkParser = require('./network-parser');
const blockTransactionParser = require('../index');

(async () => {
  try {
    const network = process.argv[2];
    const web3Client = new Web3(networkParser(network));

    const bridgeTx = JSON.parse(process.argv[3]);
    const bridgeTxReceipt = JSON.parse(process.argv[4]);
    const transaction = await blockTransactionParser.decodeBridgeTransaction(web3Client, bridgeTx, bridgeTxReceipt, network)

    if (transaction) {
      console.log(JSON.stringify(transaction, null, 2));
    } else {
      console.log(`BridgeTx could not be decoded.`);
    }
  } catch (error) {
    console.log(error);
  }
})();
