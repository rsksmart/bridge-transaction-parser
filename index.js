const web3 = require('web3');
let abis = require('@rsksmart/rsk-precompiled-abis');

const NETWORKS = {
    mainnet: 'https://public-node.rsk.co/',
    testnet: 'https://public-node.testnet.rsk.co/'
};

let _bridge = null;

function getBridge() {
    if (!_bridge) {
        throw 'Bridge not initialized';
    }
    return _bridge;
}

function initializeBridge(client) {
    _bridge = abis.bridge.build(client);
}

function processLogs(tx) {
    if (!tx.logs.length) {
        return;
    }
    let bridge = getBridge();
    for (let log of tx.logs) {
        let foundLog = bridge._jsonInterface.filter(i => i.signature === log.topics[0]);
        if (foundLog.length) {
            let log = foundLog[0];
            console.log(`= txId: ${tx.transactionHash} event: ${log.name}`);
        }
    }
}

async function procesBlock(block, client) {
    for (let txHash of block.transactions) {
        let tx = await client.eth.getTransactionReceipt(txHash);
        // console.log(JSON.stringify(tx, null, 2));
        if (tx.to === abis.bridge.address) {
            console.log(`= got a bridge tx: ${txHash}`);
            processLogs(tx);
        }
    }
}

const reject = () => {
    let msg = `
    Please provide the following parameters:
     - startingBlock(number) [must be bigger than 0] (REQUIRED)
     - blocksToSearch(number) [must be smaller than or equals 100] (DEFAULT: 10)
     - network(string): values => ${Object.keys(NETWORKS)} (DEFAULT: testnet)
    `;
    console.log(msg);
};

async function run() {
    try {
        console.log('Starting');
        if (process.argv.length < 3) {
            return reject();
        }
        let startingBlock = parseInt(process.argv[2]);
        if (isNaN(startingBlock) || startingBlock < 0) {
            return reject();
        }

        let blocksToSearch;
        if (process.argv.length >= 4) {
            blocksToSearch = parseInt(process.argv[3]);
        }
        if (isNaN(blocksToSearch) || blocksToSearch > 100 || blocksToSearch <= 0) {
            blocksToSearch = 100;
            console.log(` = Default blocksToSearch to ${blocksToSearch}`);
        }

        let network;
        if (process.argv.length >= 5) {
            network = NETWORKS[process.argv[4]];
        }
        if (!network) {
            network = NETWORKS.testnet;
            console.log(` = Default network to ${network}`);
        }

        const client = new web3(network); 
        initializeBridge(client);
        console.log(`Starting from ${startingBlock}\n`);
        for (let i = 0; i < blocksToSearch; i++) {
            let blockNumber = startingBlock + i;
            let block = await client.eth.getBlock(blockNumber);
            if (!block) {
                console.log(`Block ${blockNumber} not found`);
                return;
            }
            console.log(`Got block ${block.number} (has ${block.transactions.length} txs)`);
            // console.log(JSON.stringify(block, null, 2))
            await procesBlock(block, client);
            console.log('');
        }
        console.log('Done.-')

        return;
    } catch(e) {
        console.log(e);
        return;
    }
}

run();
