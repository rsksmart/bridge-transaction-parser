const DEFAULT_CHECK_EVERY_MILLIS = 1_000;

const MONITOR_EVENTS = {
    checkingBlock: 'checkingBlock',
    filterMatched: 'filterMatched',
    latestBlockReached: 'latestBlockReached',
    error: 'error',
    stopped: 'stopped',
    started: 'started',
};

const defaultParamsValues = {
    fromBlock: 'latest',
    methods: [],
    events: [],
    pegout: false,
    pegin: false,
    network: 'testnet',
    checkEveryMilliseconds: DEFAULT_CHECK_EVERY_MILLIS,
};

module.exports = {
    MONITOR_EVENTS,
    defaultParamsValues,
    DEFAULT_CHECK_EVERY_MILLIS,
};
