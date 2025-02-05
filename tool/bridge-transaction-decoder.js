const networkParser = require('./network-parser');
const BridgeTransactionParser = require('../index');

(async () => {
  try {
    const network = networkParser(process.argv[2]);
    const bridgeTransactionParser = new BridgeTransactionParser(network);
    const bridgeTx = JSON.parse(process.argv[3]);
    const bridgeTxReceipt = JSON.parse(process.argv[4]);
    const transaction = await bridgeTransactionParser.decodeBridgeTransaction(bridgeTx, bridgeTxReceipt)

    if (transaction) {
      console.log(JSON.stringify(transaction, (key, value) =>
        typeof value === "bigint" ? value.toString() : value, 2
      ));
    } else {
      console.log(`BridgeTx could not be decoded.`);
    }
  } catch (error) {
    console.log(error);
  }
})();

// Example:
// node tool/bridge-transaction-decoder.js testnet '{"_type":"TransactionResponse","accessList":null,"blockNumber":6033160,"blockHash":"0xd7c485bb65ab170027a08aac33f56fcbef66fa1807e62c7fa14539ab36201e36","blobVersionedHashes":null,"chainId":"31","data":"0x","from":"0xB9acF09d4760DB501cE546f3e604452303479621","gasLimit":"44000","gasPrice":"5251555","hash":"0xc2bde392fb77f9bd2c101c3671c3819e46c4f1532cb4ec23d425f20f07672553","maxFeePerGas":null,"maxPriorityFeePerGas":null,"maxFeePerBlobGas":null,"nonce":5,"signature":{"_type":"signature","networkV":"97","r":"0xc45305a6b6862a3e6924f2073bb55c8f1c58f0dac85ff378277e4d254ecc50bc","s":"0x6d4991ae9513bc9228cb41463866557297712ce28adeee742d2885f2bf98bb78","v":27},"to":"0x0000000000000000000000000000000001000006","index":3,"type":0,"value":"5000000000000000"}' '{"_type":"TransactionReceipt","blockHash":"0xd7c485bb65ab170027a08aac33f56fcbef66fa1807e62c7fa14539ab36201e36","blockNumber":6033160,"contractAddress":null,"cumulativeGasUsed":"239223","from":"0xB9acF09d4760DB501cE546f3e604452303479621","gasPrice":"5251555","blobGasUsed":null,"blobGasPrice":null,"gasUsed":"44000","hash":"0xc2bde392fb77f9bd2c101c3671c3819e46c4f1532cb4ec23d425f20f07672553","index":3,"logs":[{"_type":"log","address":"0x0000000000000000000000000000000001000006","blockHash":"0xd7c485bb65ab170027a08aac33f56fcbef66fa1807e62c7fa14539ab36201e36","blockNumber":6033160,"data":"0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000007a12000000000000000000000000000000000000000000000000000000000000000226d79466e6f5878623637763169504e64464674714378745143547a344b6b62713256000000000000000000000000000000000000000000000000000000000000","index":0,"topics":["0x1a4457a4460d48b40c5280955faf8e4685fa73f0866f7d8f573bdd8e64aca5b1","0x000000000000000000000000b9acf09d4760db501ce546f3e604452303479621"],"transactionHash":"0xc2bde392fb77f9bd2c101c3671c3819e46c4f1532cb4ec23d425f20f07672553","transactionIndex":3}],"logsBloom":"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000500004000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000080000000000000000000000000000000000002000000000000000000000000000000000000000000100000000000000000000800000000000000","status":1,"to":"0x0000000000000000000000000000000001000006"}'

// Return:

// {
//   "txHash": "0xc2bde392fb77f9bd2c101c3671c3819e46c4f1532cb4ec23d425f20f07672553",
//   "method": "",
//   "events": [
//     {
//       "name": "release_request_received",
//       "signature": "0x1a4457a4460d48b40c5280955faf8e4685fa73f0866f7d8f573bdd8e64aca5b1",
//       "arguments": {
//         "sender": "0xB9acF09d4760DB501cE546f3e604452303479621",
//         "btcDestinationAddress": "myFnoXxb67v1iPNdFFtqCxtQCTz4Kkbq2V",
//         "amount": "500000"
//       }
//     }
//   ],
//   "sender": "0xB9acF09d4760DB501cE546f3e604452303479621",
//   "blockNumber": 6033160,
//   "blockTimestamp": 1738611412
// }

