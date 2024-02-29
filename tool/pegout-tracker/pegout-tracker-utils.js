const PEGOUT_TRACKER_EVENTS = {
    releaseRequestRejectedEventFound: 'releaseRequestRejectedEventFound',
    releaseRequestReceivedEventFound: 'releaseRequetReceivedEventFound',
    releaseRequestedEventFound: 'releaseRequestedEventFound',
    batchPegoutCreatedEventFound: 'batchPegoutCreatedEventFound',
    pegoutConfirmedEventFound: 'pegoutConfirmedEventFound',
    addSignatureEventFound: 'addSignatureEventFound',
    releaseBtcEventFound: 'releaseBtcEventFound',
    pegoutStagesFound: 'pegoutStagesFound',
};

const NETWORK_REQUIRED_CONFIRMATIONS = {
    mainnet: 4000,
    testnet: 10,
    regtest: 3,
};

module.exports = {
    PEGOUT_TRACKER_EVENTS,
    NETWORK_REQUIRED_CONFIRMATIONS,
};
