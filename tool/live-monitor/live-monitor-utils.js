const DEFAULT_CHECK_EVERY_MILLIS = 1_000;

const MONITOR_EVENTS = {
    checkingBlock: 'checkingBlock',
    filterMatched: 'filterMatched',
    latestBlockReached: 'latestBlockReached',
    error: 'error',
    stopped: 'stopped',
    started: 'started',
    reset: 'reset',
};

const defaultParamsValues = {
    fromBlock: 'latest',
    methods: [],
    events: [],
    pegout: false,
    pegin: false,
    network: 'https://public-node.testnet.rsk.co/',
    checkEveryMilliseconds: DEFAULT_CHECK_EVERY_MILLIS,
    keepTryingOnError: true,
    retryOnError: false,
    retryOnErrorAttempts: 3,
    toBlock: -1,
};

module.exports = {
    MONITOR_EVENTS,
    defaultParamsValues,
    DEFAULT_CHECK_EVERY_MILLIS,
};
