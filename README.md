<img src="./rootstock_logo.png" alt="Rootstock" />

# bridge-transaction-parser
![Github CI/CD](https://github.com/rsksmart/bridge-transaction-parser/actions/workflows/workflow.yml/badge.svg)
[![CodeQL](https://github.com/rsksmart/bridge-transaction-parser/workflows/CodeQL/badge.svg)](https://github.com/rsksmart/bridge-transaction-parser/actions?query=workflow%3ACodeQL)

A tool to find interactions with the Bridge on Rootstock

## Prerequisites
1. Have nodejs installed https://nodejs.org/. LTS version.
2. Install dependencies `npm install`

## Run console tool:
- `node tool/bridge-transaction-txHash.js $network $txHash`
- `node tool/bridge-transactions-single-block.js $network $blockHashOrBlockNumber`
- `node tool/bridge-transactions-multiple-blocks.js $network $startingBlockHashOrBlockNumber $blocksToSearch`
- `node tool/bridge-transaction-decoder.js $network $bridgeTx $bridgeTxReceipt`


- `network`: mainnet or testnet
- `txHash`: A transaction hash.
- `starting block hash or number`: block hash or number from where to start searching interaction with the Bridge contract
- `blocks to search`: amount of blocks to search, from the starting block forward. Max 100 blocks.
- bridgeTx: A bridgeTx: web3TransactionObject. E.g.: {\"hash\":\"0xc2dee2f542cee022196948b1da5d8d44331e3f8de964ee6fb025e06bb077c880\",\"nonce\":241,\"blockHash\":\"0x3cd357a760e69e3942d344062f751eff7be4d07d4a01f095ebfd42c8c0d2498e\",\"blockNumber\":2867321,\"transactionIndex\":3,\"from\":\"0x92C94AE16eEfC9202bb8BCAf1F6B0c8702fb56eE\",\"to\":\"0x0000000000000000000000000000000001000006\",\"gas\":67152,\"gasPrice\":\"65164000\",\"value\":\"0\",\"input\":\"0x43dc06560000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000022280e00000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000000131010000000001014e80d52d5ed9dfe3523c47e7cb095b9cffe6677f22090fd9e0bbf32813c18be00200000017160014c4cb069eec8a8b695a8c50515eaec10b4e65bb5bffffffff030000000000000000306a2e52534b54013a29282d5144cea68cb33995ce82212f4b21ccec012b6f4aecd3bad677f9056c20958b1c1ff56d25c3405489000000000017a9148f38b3d8ec8816f7f58a390f306bb90bb178d6ac87ee3a07000000000017a914f38b645178d325b086b1849bb79147518b8931698702483045022100be99ce8ce2de3147ba64e81ec5fe4bc0dea12dccf258cd4dca65c0c09108da8f022024b5c36e2184a4d2a67b5212b52e6955e4e7a9fbff896825bef7e028d34ef4c70121028d2a1b7ef1feffdfd1aa57d543bf0799107ec44469f9e3d332ffe25fec2b8e590000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000470200000002000000000000000000000000000000000000000000000000000000000000000076113d8b6fc306e168ac534d80874e3ee1b9f418b8c1985ead59399d638b1ea3010500000000000000000000000000000000000000000000000000\",\"v\":\"0x62\",\"r\":\"0x802a61cfaa81791b8e5a5101887932f4e9cd0f64d3bb0d7d61ae77d190f289a2\",\"s\":\"0x5e1f5b3d2ae30474665e2485f472c81979f6b6db8c9dc2c92408b4f96d7d2baf\"}
- bridgeTxReceipt: A bridgeTxReceipt: web3TransactionObject. E.g.: {\"transactionHash\":\"0xc2dee2f542cee022196948b1da5d8d44331e3f8de964ee6fb025e06bb077c880\",\"transactionIndex\":3,\"blockHash\":\"0x3cd357a760e69e3942d344062f751eff7be4d07d4a01f095ebfd42c8c0d2498e\",\"blockNumber\":2867321,\"cumulativeGasUsed\":507369,\"gasUsed\":67152,\"contractAddress\":null,\"logs\":[],\"from\":\"0x92c94ae16eefc9202bb8bcaf1f6b0c8702fb56ee\",\"to\":\"0x0000000000000000000000000000000001000006\",\"status\":true,\"logsBloom\":\"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000\"}

## Live monitoring tool

The live monitoring tool enables real-time monitoring of a given set of Bridge related events and methods.

This tool can be helpful to track peg-ins, peg-outs or any other specific bridge action in real time.

It can be executed against a node running in any network (regtest, testnet or mainnet).

To print in the console all the transactions sent to the bridge with their method and events data, the following command can be used:

> node tool/live-monitor/cli-live-monitor.js

The tool will start checking block by block (starting from the latest one), transaction by transaction, filtering the transaction sent to the bridge and printing a payload like this:

```js
...

{
  txHash: '0xda3db1d8b949e99a4f0fb27dc867981e79b457339b8df94a5bd27654a79bf6da',
  blockHash: '0x69304c7b6d072c157245d9f93f09661fe86d30f6befc28ba7c188ca33685d6cf',
  blockNumber: 3574944,
  from: '0x62dB6C4b118d7259c23692B162829E6bd5e4d5B0',
  to: '0x0000000000000000000000000000000001000006',
  method: '',
  events: [
    BridgeEvent {
      name: 'release_request_received',
      signature: '0x8e04e2f2c246a91202761c435d6a4971bdc7af0617f0c739d900ecd12a6d7266',
      arguments: {
        sender: '0x62dB6C4b118d7259c23692B162829E6bd5e4d5B0',
        btcDestinationAddress: '0xcab5925c59a9a413f8d443000abcc5640bdf0675',
        amount: '5130000'
      }
    }
  ]
}

{
  txHash: '0x77b15a4b54029cc9edec8096606a7b7eae1ad749c3a98ed4e0e393028e568d2f',
  blockHash: '0x2c819a09d8e00fed67ea216c563d14e2b8286f4c0a2480b764f6dd86b3662396',
  blockNumber: 3574946,
  from: '0xD478f3CE39cc5957b890C09EFE709AC7d4c282F8',
  to: '0x0000000000000000000000000000000001000006',
  method: BridgeMethod {
    name: 'receiveHeaders',
    signature: '0xe5400e7b',
    arguments: {
      blocks: [
        '0x0000a0200f0a949fe1d050024b2077c7528792edb620f89cb5db089f29000000000000005e54b6818e31f89e69f1ddd523b7a58d2d45259b77a110fd875b8328de2b5d1e0750e6639cde2c1983e2d76a'
      ]
    }
  },
  events: []
}

...
```

It will continue to print as it finds new Bridge methods or events in the upcoming blocks.

Available param options:

* [--fromBlock=number] defaults to `latest`. If the block number is negative, it will be interpreted as the number of blocks before the latest block.
* [--network=network] Expects a url host for a network. If passed the literal `mainnet` or `testnet` it will be parsed to the respective mainnet and testnet public nodes hosts (found in the `network-parser.js` file). Defaults to `testnet`.
* [--pegin] if provided, prints peg-in related transactions. It can be used along `--pegout` to only print peg-in and peg-out related transactions.
* [--pegout] if provided, prints peg-out related transactions  It can be used along `--pegin` to only print peg-in and peg-out related transactions.
* [--methods="['bridgeMethod1', 'bridgeMethod2']"] prints transaction data of calls made to any of the specified bridge methods. Defaults to all Bridge methods.
* [--events="['bridgeEvent1', 'bridgeEvent2']"] prints transaction data of those that emitted any of these events. Defaults to all Bridge events.
* [--checkEveryMilliseconds=timeInMilliseconds] time between executions to get the next block to filter and print the transactions data. Defaults to 1000 milliseconds.

### Samples with the command line

Note: All the options are optional and can be provided in any order

Print all Bridge methods and events related transaction data starting at block `3,573,827` in `testnet`:

> node tool/live-monitor/cli-live-monitor.js --fromBlock=3574944 

Print all the peg-out related transaction data from block `3,574,944 ` in a local node at `http://127.0.0.1:30007`:

> node tool/live-monitor/cli-live-monitor.js --fromBlock=3574944  --pegout --network=http://127.0.0.1:30007

Print all the transaction data that only has the `addSignature` method starting at the latest block in `testnet`:

> node tool/live-monitor/cli-live-monitor.js --methods="['addSignature']"

Print all the transaction data only related to peg-ins and peg-outs in testnet:

> node tool/live-monitor/cli-live-monitor.js --pegin --pegout

Only print peg-in related transaction data in testnet from block `3,575,114`:

> node tool/live-monitor/cli-live-monitor.js --fromBlock=3575114 --pegin

Only print peg-out related transaction data in testnet:

> node tool/live-monitor/cli-live-monitor.js --pegout

Only print the transaction data that contains the `updateCollections` method and the `release_requested` event starting at block `3,574,944 ` in `testnet`:

> node tool/live-monitor/cli-live-monitor.js --fromBlock=3574944  --methods="['updateCollections']" --events="['release_requested']"

Only print the transaction data that contains the `updateCollections` method and the `release_requested` event starting at block `500` at host `http://127.0.0.1:30007` retrieving new blocks every minute:

> node tool/live-monitor/cli-live-monitor.js --fromBlock=500 --methods="['updateCollections']" --events="['release_requested']" --network=http://127.0.0.1:30007 --checkEveryMilliseconds=60000

If an unknown option parameter is passed, the tool will throw an exception.

Using the `--fromBlock` with a negative number:

If the latest block number is something like 531 and we want to start searching 100 blocks before that (from 431), then we pass `-100` to the `--fromBlock` flag, like this:

> node tool/live-monitor/cli-live-monitor.js --fromBlock=-100

The monitoring tool will keep retrying to get a block by default, 3 times. If you want to change that, you can try:

> node tool/live-monitor/cli-live-monitor.js --retryOnError=false

Or, if you want it to retry more times, for example to retry a maximum attepts of 10, try:

> node tool/live-monitor/cli-live-monitor.js --retryOnErrorAttempts=10

You can also specify a `toBlock` parameter.

> node tool/live-monitor/cli-live-monitor.js --fromBlock=1000 --toBlock=1500

If `toBlock` param is not provided, then the tool will continue to synch with new blocks.

If `toBlock` param is provided and the monitor reaches that block number, then the monitor will emit the `toBlockReached` event and stop.

### Samples with the exported `monitor` function

```js

const LiveMonitor = require('./tool/live-monitor');
const Web3 = require('web3');

const rskClient = new Web3('https://public-node.testnet.rsk.co/');

const params = {
    fromBlock: 'latest',
    methods: ['updateCollections'],
    events: ['release_request_received'],
    pegout: true,
    pegin: false,
    network: 'https://public-node.testnet.rsk.co/',
    checkEveryMilliseconds: 1000,
};

// Passing params through the constructor is optional. Default params will be used if not provided.
// The can be provided at any time using the `reset(params)` function.
const monitor = new LiveMonitor(params);

monitor.on(MONITOR_EVENTS.stopped, () => {
    console.info("Monitor stopped");
});

monitor.on(MONITOR_EVENTS.started, () => {
    console.info("Monitor started");
});

monitor.on(MONITOR_EVENTS.checkingBlock, blockNumber => {
    console.info("Checking block: ", blockNumber);
});

monitor.on(MONITOR_EVENTS.filterMatched, bridgeTxDetails => {
    console.info("Found a tx:");
    console.info(util.inspect(bridgeTxDetails, {depth: null, colors: true}));
});

monitor.on(MONITOR_EVENTS.latestBlockReached, message => {
    console.info(message);
});

monitor.on(MONITOR_EVENTS.error, errorMessage => {
    console.info(errorMessage);
});

// We can optionally pass the params to the `start` functions the first time we run the `start` function.
// Otherwise we need to use `reset(params)` function if the monitor had already started.
monitor.start(params);

const newParams = {
    fromBlock: -100, // A negative number indicates that the monitor should start checking this amount of blocks back from the latest
    methods: [], // Any method
    events: [], // Any events
    pegout: true, // Includes pegout related transactions
    pegin: true, // Includes pegin related transactions
    network: 'https://public-node.rsk.co/', // New network
    checkEveryMilliseconds: 1000,
};

// The `reset` function will `stop()` the monitor and then `start(params)` it with the new params.
// These parameters are also optional. If not provided, default values will be used.
monitor.reset(newParams);

```
## Contributing

Any comments or suggestions feel free to contribute or reach out at our [open slack](https://dev.rootstock.io//slack).
