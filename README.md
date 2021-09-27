# bridge-event-checker
A tool to find interactions with the Bridge on RSK

## Prerequisites
1. Have nodejs installed https://nodejs.org/
2. Install dependencies `npm install`

## Run sample file:
`node tool/bridge-event-checker.js $network $startingBlock $blocksToSearch`

- `network`: mainnet or testnet
- `starting block`: block number from where to start searching interaction with the Bridge contract
- `blocks to search`: amount of blocks to search, from the starting block forward. Max 100 blocks, 10 blocks by default if no parameter is passed
