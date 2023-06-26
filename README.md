![Github CI/CD](https://github.com/rsksmart/bridge-transaction-parser/actions/workflows/workflow.yml/badge.svg)
[![CodeQL](https://github.com/rsksmart/bridge-transaction-parser/workflows/CodeQL/badge.svg)](https://github.com/rsksmart/bridge-transaction-parser/actions?query=workflow%3ACodeQL)


# bridge-transaction-parser
A tool to find interactions with the Bridge on RSK

# Disclaimer

This is a beta version until audited by the security team. Any comments or suggestions feel free to contribute or reach out at our [open slack](https://developers.rsk.co/slack).

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
