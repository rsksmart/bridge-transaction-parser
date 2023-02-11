const Web3 = require('web3');
const { getBridgeTransactionByTxHash } = require('../index');
const networkParser = require('./network-parser');
const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;
console.log("Bridge.address: ", Bridge.address);
const util = require('util');

const DEFAULT_CHECK_EVERY_MILLIS = 1_000;

const defaultCommandsValues = {
    fromBlock: 'latest',
    methods: [],
    events: [],
    pegout: false,
    pegin: false,
    network: 'testnet',
    checkEveryMillis: DEFAULT_CHECK_EVERY_MILLIS,
};

const getParsedCommands = () => {
    const commands = process.argv.filter(command => command.startsWith('--'))
    .reduce((commands, command) => {
        if(command.startsWith('--fromblock')) {
            commands.fromBlock = command.slice(command.indexOf('=') + 1);
        } else if(command.startsWith('--methods') || command.startsWith('--events')) { // Parsing commands that include an array
            commands['methods'] = JSON.parse(command.slice(command.indexOf('=') + 1).replaceAll("'", '"'));
        } else if(command.startsWith('--network')) {
            commands.network = command.slice(command.indexOf('=') + 1);
        } else if(command.startsWith('--pegout') || command.startsWith('--pegin')) {
            const parsedCommand = command.replace('--', '');
            commands[parsedCommand] = true;
        } else if(command.startsWith('--checkeverymillis')) {
            commands.checkEveryMillis = Number(command.slice(command.indexOf('=') + 1));
        } else {
            throw new Error(`Command '${command}' not recognized`);
        }
        return commands;
    }, defaultCommandsValues);
    return commands;
};

const PEGOUT_METHOD_SIGNATURES = {
    releaseBtc: '0x',
    updateCollections: '0x0c5a9990',
    addSignature: '0xf10b9c59'
};

const PEGIN_METHOD_SIGNATURES = {
    registerBtcCoinbaseTransaction: '0xccf417ae',
    registerBtcTransaction: '0x43dc0656',
};

function isAPegoutRelatedTransactionData(data) {
    const methodSignature = data.slice(0, 10);
    switch(methodSignature) {
        case PEGOUT_METHOD_SIGNATURES.releaseBtc:
        case PEGOUT_METHOD_SIGNATURES.updateCollections:
        case PEGOUT_METHOD_SIGNATURES.addSignature:
            return true;
        default:
            return false;
    }
}

function isAPeginRelatedTransactionData(data) {
    const methodSignature = data.slice(0, 10);
    switch(methodSignature) {
        case PEGIN_METHOD_SIGNATURES.registerBtcTransaction:
            return true;
        default:
            return false;
    }
}

const commands = getParsedCommands();

const web3Client = new Web3(networkParser(commands.network));

let currentBlockNumber = commands.fromBlock;

let notified = false;

async function monitor() {

    try {

        const latestBlockNumber = await web3Client.eth.getBlockNumber();

        if(currentBlockNumber === 'latest') {
            currentBlockNumber = latestBlockNumber;
        }

        if(latestBlockNumber < currentBlockNumber) {
            if(!notified) {
                console.warn("latestBlockNumber was reached!");
                notified = true;
            }
            return;
        }

        notified = false;

        const block = await web3Client.eth.getBlock(currentBlockNumber, true);

        console.info("Checking block: ", block.number);

        currentBlockNumber++;

        for(transaction of block.transactions) {
            
            if(transaction.to === Bridge.address) {

                // Requested only pegouts, if tx is not a pegout then continue
                if(!commands.pegin && commands.pegout && !isAPegoutRelatedTransactionData(transaction.input)) {
                    continue;
                // Requested only pegins, if tx is not a pegin then return
                } else if(!commands.pegout && commands.pegin && !isAPeginRelatedTransactionData(transaction.input)) {
                    continue;
                // Requested only pegins and pegouts, if tx is not a pegin or pegout then return
                } else if(commands.pegin && commands.pegout && (!isAPeginRelatedTransactionData(transaction.input) || !isAPegoutRelatedTransactionData(transaction.input))) {
                    continue;
                }
                // Showing all bridge events by default if commands.pegin and commands.pegout where not specified
        
                const rskTx = await getBridgeTransactionByTxHash(web3Client, transaction.hash);

                if(commands.methods.length > 0 && !commands.methods.includes(rskTx.method.name)) {
                    continue;
                }

                const containsAtLeast1RequestedEvent = rskTx.events.some(event => commands.events.includes(event.name));
                if(commands.events.length > 0 && containsAtLeast1RequestedEvent) {
                    continue;
                }

                const bridgeTxDetails = {
                    txHash: transaction.hash,
                    blockHash: transaction.blockHash,
                    blockNumber: transaction.blockNumber,
                    from: transaction.from,
                    to: transaction.to,
                    method: rskTx.method,
                    events: rskTx.events
                };

                console.info("Found a tx:");

                console.info(util.inspect(bridgeTxDetails, {depth: null, colors: true}))

            }

        }

    } catch(e) {
        console.error(`There was an error trying to get the tx data/events in block: ${currentBlockNumber - 1}`, e);
        console.info("Moving forward...");
    }
    
}

const checkEveryMillis = commands.checkEveryMillis || DEFAULT_CHECK_EVERY_MILLIS;

console.log(`Checking a block every ${checkEveryMillis} milliseconds`);

setInterval(async () => {
    await monitor();
}, checkEveryMillis);
