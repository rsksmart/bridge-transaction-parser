const networkParser = require('./network-parser');
const BridgeTransactionParser = require('../index');
const {ethers} = require("ethers");

(async () => {
  try {
    const network = process.argv[2];
    const rskClient = new ethers.JsonRpcProvider(networkParser(network));
    const bridgeTransactionParser = new BridgeTransactionParser(rskClient);
    const bridgeTx = JSON.parse(process.argv[3]);
    const bridgeTxReceipt = JSON.parse(process.argv[4]);
    const transaction = await bridgeTransactionParser.decodeBridgeTransaction(bridgeTx, bridgeTxReceipt)

    if (transaction) {
      console.log(JSON.stringify(transaction, null, 2));
    } else {
      console.log(`BridgeTx could not be decoded.`);
    }
  } catch (error) {
    console.log(error);
  }
})();
