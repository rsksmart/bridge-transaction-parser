const DEFAULT_CHECK_EVERY_MILLIS = 1_000;

const MONITOR_EVENTS = {
    checkingBlock: 'checkingBlock',
    filterMatched: 'filterMatched',
    latestBlockReached: 'latestBlockReached',
    error: 'error',
    stopped: 'stopped',
    started: 'started',
    reset: 'reset',
    toBlockReached: 'toBlockReached',
};

const defaultParamsValues = {
    fromBlock: 'latest',
    methods: [],
    events: [],
    pegout: false,
    pegin: false,
    network: 'https://public-node.testnet.rsk.co/',
    checkEveryMilliseconds: DEFAULT_CHECK_EVERY_MILLIS,
    retryOnError: true,
    retryOnErrorAttempts: 3,
    toBlock: -1,
};

module.exports = {
    MONITOR_EVENTS,
    defaultParamsValues,
    DEFAULT_CHECK_EVERY_MILLIS,
};
