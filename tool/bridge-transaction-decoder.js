const Web3 = require('web3');
const networkParser = require('./network-parser');
const blockTransactionParser = require('../index');

const parseUnquotedJsonString = (unquotedJsonString) => {
    return unquotedJsonString.slice(1, -1).split(/\s?,\s?/)
      .map(item => item.split(':'))
      .reduce((a, [key, val]) => Object.assign(a, {[key]: val}), {})
};

(async () => {
  try {
    const network = process.argv[2];
    const web3Client = new Web3(networkParser(network));

    const bridgeTx = parseUnquotedJsonString(process.argv[3]);
    const bridgeTxReceipt = parseUnquotedJsonString(process.argv[4]);
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