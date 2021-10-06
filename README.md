# bridge-event-checker
A tool to find interactions with the Bridge on RSK

## Prerequisites
1. Have nodejs installed https://nodejs.org/
2. Install dependencies `npm install`

## Run console tool:
`node tool/block-transaction-parser.js $network $startingBlock $blocksToSearch`

- `network`: mainnet or testnet
- `starting block`: block number from where to start searching interaction with the Bridge contract
- `blocks to search`: amount of blocks to search, from the starting block forward. Max 100 blocks.
