# bridge-event-checker
A tool to find interactions with the Bridge on RSK

## Prerequisites
1. Have nodejs installed https://nodejs.org/
2. Install dependencies `npm install`

## Run
`node index.js [starting block] [blocks to search] [network]`

- `starting block`: block number from where to start searching interaction with the Bridge contract
- `blocks to search`: amount of blocks to search, from the starting block forward. Max 100 blocks, same value by default if no parameter is passed
- `network`: can be `mainnet` or `testnet`. By default it's `testnet`