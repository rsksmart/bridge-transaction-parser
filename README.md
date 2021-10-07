# bridge-event-checker
A tool to find interactions with the Bridge on RSK

## Prerequisites
1. Have nodejs installed https://nodejs.org/
2. Install dependencies `npm install`

## Run console tool:
`node tool/bridge-transaction-txHash.js $network $txHash`
`node tool/bridge-transactions-single-block.js $network $blockHashOrBlockNumber`
`node tool/bridge-transactions-multiple-block.js $network $startingBlockHashOrBlockNumber $blocksToSearch`

- `network`: mainnet or testnet
- `txHash`: A transaction hash.
- `starting block hash or number`: block hash or number from where to start searching interaction with the Bridge contract
- `blocks to search`: amount of blocks to search, from the starting block forward. Max 100 blocks.
