const Web3 = require('web3');
const { getBridgeTransactionByTxHash } = require('../index');
const networkParser = require('./network-parser');
const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;
const util = require('util');

const DEFAULT_CHECK_EVERY_MILLIS = 1_000;

const defaultParamsValues = {
    fromBlock: 'latest',
    methods: [],
    events: [],
    pegout: false,
    pegin: false,
    network: 'testnet',
    checkEveryMillis: DEFAULT_CHECK_EVERY_MILLIS,
};

const getParsedParams = () => {
    const params = process.argv.filter(param => param.startsWith('--'))
    .reduce((params, param) => {
        if(param.startsWith('--fromblock')) {
            params.fromBlock = param.slice(param.indexOf('=') + 1);
        } else if(param.startsWith('--methods') || param.startsWith('--events')) { // Parsing params that include an array
            const paramName = param.slice(2, param.indexOf('='));
            params[paramName] = JSON.parse(param.slice(param.indexOf('=') + 1).replaceAll("'", '"'));
        } else if(param.startsWith('--network')) {
            params.network = param.slice(param.indexOf('=') + 1);
        } else if(param.startsWith('--pegout') || param.startsWith('--pegin')) {
            const paramName = param.replace('--', '');
            params[paramName] = true;
        } else if(param.startsWith('--checkeverymillis')) {
            params.checkEveryMillis = Number(param.slice(param.indexOf('=') + 1));
        } else {
            throw new Error(`Parameter '${param}' not recognized`);
        }
        return params;
    }, defaultParamsValues);
    return params;
};

const PEGOUT_METHOD_SIGNATURES = {
    releaseBtc: '0x',
    updateCollections: '0x0c5a9990',
    addSignature: '0xf10b9c59'
};

const PEGIN_METHOD_SIGNATURES = {
    registerBtcCoinbaseTransaction: '0xccf417ae',
    registerBtcTransaction: '0x43dc0656',
    registerFastBridgeBtcTransaction: '0x6adc0133'
};

function isAPegoutRelatedTransactionData(data) {
    const methodSignature = data.slice(0, 10);
    return Object.values(PEGOUT_METHOD_SIGNATURES)
            .includes(methodSignature);
}

function isAPeginRelatedTransactionData(data) {
    const methodSignature = data.slice(0, 10);
    return Object.values(PEGIN_METHOD_SIGNATURES)
            .includes(methodSignature);
}

const params = getParsedParams();

const web3Client = new Web3(networkParser(params.network));

let currentBlockNumber = params.fromBlock;

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

        for(const transaction of block.transactions) {
            
            if(transaction.to === Bridge.address) {

                const isPeginRelated = isAPeginRelatedTransactionData(transaction.input);
                const isPegoutRelated = isAPegoutRelatedTransactionData(transaction.input);

                // Requested only pegouts, if tx is not a pegout then continue
                if(!params.pegin && (params.pegout && !isPegoutRelated)) {
                    continue;
                // Requested only pegins, if tx is not a pegin then return
                } else if(!params.pegout && (params.pegin && !isPeginRelated)) {
                    continue;
                // Requested only pegins and pegouts, if tx is not a pegin or pegout then return
                } else if((params.pegin && !isPeginRelated) || (params.pegout && !isPegoutRelated)) {
                    continue;
                }
                // Showing all bridge events by default if params.pegin and params.pegout where not specified
        
                const rskTx = await getBridgeTransactionByTxHash(web3Client, transaction.hash);

                if(params.methods.length > 0 && !params.methods.includes(rskTx.method.name)) {
                    continue;
                }

                const containsAtLeast1RequestedEvent = rskTx.events.some(event => params.events.includes(event.name));
                if(params.events.length > 0 && containsAtLeast1RequestedEvent) {
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

                console.info(util.inspect(bridgeTxDetails, {depth: null, colors: true}));

            }

        }

    } catch(e) {
        console.error(`There was an error trying to get the tx data/events in block: ${currentBlockNumber - 1}`, e);
        console.info("Moving forward...");
    }
    
}

const checkEveryMillis = params.checkEveryMillis || DEFAULT_CHECK_EVERY_MILLIS;

console.log(`Checking a block every ${checkEveryMillis} milliseconds`);

setInterval(async () => {
    await monitor();
}, checkEveryMillis);
