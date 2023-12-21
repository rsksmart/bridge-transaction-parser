const LiveMonitor = require('./live-monitor');
const util = require('util');
const { defaultParamsValues, DEFAULT_CHECK_EVERY_MILLIS, MONITOR_EVENTS } = require('./live-monitor-utils');
const networkParser = require('../network-parser');

const getParsedParams = () => {
    const params = process.argv.filter(param => param.startsWith('--'))
    .reduce((params, param) => {
        if(param.startsWith('--fromBlock')) {
            params.fromBlock = param.slice(param.indexOf('=') + 1);
        } else if(param.startsWith('--methods') || param.startsWith('--events')) { // Parsing params that include an array
            const paramName = param.slice(2, param.indexOf('='));
            params[paramName] = JSON.parse(param.slice(param.indexOf('=') + 1).replaceAll("'", '"'));
        } else if(param.startsWith('--network')) {
            params.network = param.slice(param.indexOf('=') + 1);
        } else if(param.startsWith('--pegout') || param.startsWith('--pegin')) {
            const paramName = param.replace('--', '');
            params[paramName] = true;
        } else if(param.startsWith('--checkEveryMilliseconds')) {
            params.checkEveryMilliseconds = Number(param.slice(param.indexOf('=') + 1)) || DEFAULT_CHECK_EVERY_MILLIS;
        } else if(param.startsWith('--retryOnError')) {
            params.retryOnError = param.slice(param.indexOf('=') + 1) === 'true';
        } else if(param.startsWith('--retryOnErrorAttempts')) {
            params.retryOnErrorAttempts = Number(param.slice(param.indexOf('=') + 1));
        } else if(param.startsWith('--toBlock')) {
            params.toBlock = Number(param.slice(param.indexOf('=') + 1));
        } else {
            throw new Error(`Parameter '${param}' not recognized`);
        }
        return params;
    }, defaultParamsValues);
    return params;
};

const params = getParsedParams();

if(params.network === 'mainnet' || params.network === 'testnet') {
    params.network = networkParser(params.network);
}

if(!params.network) {
    params.network = networkParser('testnet');
}

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

monitor.start();
