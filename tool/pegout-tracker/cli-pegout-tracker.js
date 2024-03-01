const util = require('util');
const PegoutTracker = require('./pegout-tracker');
const { PEGOUT_TRACKER_EVENTS } = require('./pegout-tracker-utils');

const getParsedParams = () => {
    const params = process.argv.filter(param => param.startsWith('--'))
    .reduce((params, param) => {
        if(param.startsWith('--pegoutTxHash')) {
            params.pegoutTxHash = param.slice(param.indexOf('=') + 1);
        } else if(param.startsWith('--network')) {
            params.network = param.slice(param.indexOf('=') + 1);
        } else if(param.startsWith('--requiredConfirmations')) {
            params.requiredConfirmations = param.slice(param.indexOf('=') + 1);
        } 
        return params;
    }, {});
    return params;
};

const params = getParsedParams();

const pegoutTracker = new PegoutTracker();

const { pegoutTxHash, network } = params;

pegoutTracker.on(PEGOUT_TRACKER_EVENTS.releaseRequestRejectedEventFound, bridgeTxDetails => {
    console.info('Pegout stage 1 (pegout request rejected) transaction found: ');
    console.info(util.inspect(bridgeTxDetails, {depth: null, colors: true}));
});

pegoutTracker.on(PEGOUT_TRACKER_EVENTS.releaseRequestReceivedEventFound, bridgeTxDetails => {
    console.info('Pegout stage 1 (pegout request) transaction found: ');
    console.info(util.inspect(bridgeTxDetails, {depth: null, colors: true}));
});

pegoutTracker.on(PEGOUT_TRACKER_EVENTS.releaseRequestedEventFound, bridgeTxDetails => {
    console.info('Pegout stage 2 (pegout created) transaction found: ');
    console.info(util.inspect(bridgeTxDetails, {depth: null, colors: true}));
});

pegoutTracker.on(PEGOUT_TRACKER_EVENTS.batchPegoutCreatedEventFound, bridgeTxDetails => {
    console.info('Pegout stage 2 (batch pegout created) transaction found: ');
    console.info(util.inspect(bridgeTxDetails, {depth: null, colors: true}));
});

pegoutTracker.on(PEGOUT_TRACKER_EVENTS.pegoutConfirmedEventFound, bridgeTxDetails => {
    console.info('Pegout stage 3 (confirmations) transaction found: ');
    console.info(util.inspect(bridgeTxDetails, {depth: null, colors: true}));
});

pegoutTracker.on(PEGOUT_TRACKER_EVENTS.addSignatureEventFound, bridgeTxDetails => {
    console.info('Pegout stage 4 (signatures) transaction found: ');
    console.info(util.inspect(bridgeTxDetails, {depth: null, colors: true}));
});

pegoutTracker.on(PEGOUT_TRACKER_EVENTS.releaseBtcEventFound, bridgeTxDetails => {
    console.info('Pegout stage 4 (release) transaction found: ');
    console.info(util.inspect(bridgeTxDetails, {depth: null, colors: true}));
});

pegoutTracker.on(PEGOUT_TRACKER_EVENTS.pegoutStagesFound, bridgeTxDetails => {
    console.info('pegoutStagesFound: ')
    console.info(util.inspect(bridgeTxDetails, {depth: null, colors: true}));
});

const options = params.requiredConfirmations ? { requiredConfirmations: params.requiredConfirmations } : {};

pegoutTracker.trackPegout(pegoutTxHash, network, options);
