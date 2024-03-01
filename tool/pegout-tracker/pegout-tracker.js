
const Web3 = require('web3');
const BridgeTransactionParser = require('../../index');
const EventEmitter = require('node:events');
const LiveMonitor = require('../live-monitor/live-monitor');
const { MONITOR_EVENTS } = require('../live-monitor/live-monitor-utils');

const { 
    isPegoutRequestRejectedTx,
    isPegoutRequestReceivedTx,
    isPegoutCreatedTx,
    isPegoutConfirmedTx,
    isAddSignatureTx,
    isReleaseBtcTx,
    getBridgeStorageValueDecodedToNumber,
    bridgeStateKeysToStorageIndexMap,
    getBridgeStorageAtBlock,
} = require('../../utils');
const networkParser = require('../network-parser');

const {
    PEGOUT_TRACKER_EVENTS,
    NETWORK_REQUIRED_CONFIRMATIONS,
} = require('./pegout-tracker-utils');

const defaultLiveMonitorParamsValues = {
    pegout: true,
    network: 'https://public-node.rsk.co/',
    checkEveryMilliseconds: 100,
    retryOnError: true,
    retryOnErrorAttempts: 3,
};

const checkValidTransactionHash = (txHash) => {
    if(!(typeof txHash === 'string')) {
        throw new Error('The transaction hash is required and has to be a string.');
    }
    if(txHash.length !== 66 || !txHash.startsWith('0x')) {
        throw new Error(`The transaction hash has to be 66 characters long, including the 0x prefix. "${txHash}" given.`);
    }
};

const validateRequiredConfirmationsForCustomNetwork = (network, options) => {
    if(network.startsWith('http') && !options.requiredConfirmations) {
        throw new Error('The "requiredConfirmations" option is required for custom networks.');
    }
};

class PegoutTracker extends EventEmitter {

    constructor() {
        super();
        this.started = false;
    }

    /**
     * 
     * @param {string} pegoutTxHash 
     * @param {Network} network
     * @param {Options} options
     */
    async trackPegout(pegoutTxHash, network = 'mainnet', options = {}) {

        checkValidTransactionHash(pegoutTxHash);

        if(this.started) {
            console.warn(`Pegout tracker is already started. Stop before calling ${trackPegout.name} again. Ignoring...`);
            return;
        }

        this.started = true;

        pegoutTxHash = pegoutTxHash.toLowerCase();

        const pegoutInfo = [];

        const networkUrl = networkParser(network);

        validateRequiredConfirmationsForCustomNetwork(network, options);

        const rskClient = new Web3(networkUrl);

        const bridgeTransactionParser = new BridgeTransactionParser(rskClient);
        
        const rskTx = await bridgeTransactionParser.getBridgeTransactionByTxHash(pegoutTxHash);

        if(isPegoutRequestRejectedTx(rskTx)) {
            this.emit(PEGOUT_TRACKER_EVENTS.releaseRequestRejectedEventFound, rskTx);
            return;
        }

        if(!isPegoutRequestReceivedTx(rskTx)) {
            throw new Error(`Transaction ${pegoutTxHash} is not a release request received transaction`);
        }

        pegoutInfo.push(rskTx);

        this.emit(PEGOUT_TRACKER_EVENTS.releaseRequestReceivedEventFound, rskTx);

        const nextPegoutCreationHeightRlpEncoded = await getBridgeStorageAtBlock(rskClient, bridgeStateKeysToStorageIndexMap.nextPegoutHeight.bytes, rskTx.blockNumber);
        const nextPegoutCreationHeight = getBridgeStorageValueDecodedToNumber(nextPegoutCreationHeightRlpEncoded);

        const latestBlockNumber = await rskClient.eth.getBlockNumber();
        
        let blockToStartSearchingFrom = nextPegoutCreationHeight;
        if(nextPegoutCreationHeight > latestBlockNumber) {
            console.warn(`Next pegout creation height ${nextPegoutCreationHeight} is greater than latest block number ${latestBlockNumber}. Setting to latest block number.`);
            blockToStartSearchingFrom = latestBlockNumber;
        }

        const params = { ...defaultLiveMonitorParamsValues, network: networkUrl, fromBlock: blockToStartSearchingFrom };

        let stage = 2;

        const liveMonitor = new LiveMonitor(params);

        let stage2TxHash;
        let stage2BlockNumber;
        let stage2BtcTxHash;

        this.on('stop', () => {
            liveMonitor.stop();
            this.started = false;
        });

        liveMonitor.on(MONITOR_EVENTS.filterMatched, async bridgeTxDetails => {
            switch(stage) {
                case 2:
                    if(isPegoutCreatedTx(bridgeTxDetails)) {
                        const batchPegoutCreatedEventArguments = bridgeTxDetails.events[2].arguments;
                        if(batchPegoutCreatedEventArguments.releaseRskTxHashes.includes(pegoutTxHash.slice(2))) {
                            stage = 3;
                            pegoutInfo.push(bridgeTxDetails);
                            stage2TxHash = bridgeTxDetails.txHash;
                            stage2BlockNumber = bridgeTxDetails.blockNumber;
                            stage2BtcTxHash = batchPegoutCreatedEventArguments.btcTxHash;

                            const requiredConfirmations = options.requiredConfirmations ? options.requiredConfirmations : NETWORK_REQUIRED_CONFIRMATIONS[network];

                            const afterConfirmationBlock = stage2BlockNumber + requiredConfirmations;

                            const latestBlockNumber = await rskClient.eth.getBlockNumber();

                            let blockToStartSearchingFrom = afterConfirmationBlock;
                            if(afterConfirmationBlock > latestBlockNumber) {
                                console.warn(`Expected after confirmation height ${afterConfirmationBlock} is greater than latest block number ${latestBlockNumber}. Setting to latest block number.`);
                                blockToStartSearchingFrom = latestBlockNumber;
                            }

                            const newParams = { ...params, fromBlock: blockToStartSearchingFrom };
                            liveMonitor.reset(newParams);
                            this.emit(PEGOUT_TRACKER_EVENTS.releaseRequestedEventFound, bridgeTxDetails);
                        }
                    }
                    break;
                case 3:
                    if(isPegoutConfirmedTx(bridgeTxDetails)) {
                        const pegoutConfirmedEventArguments = bridgeTxDetails.events[1].arguments;
                        if(pegoutConfirmedEventArguments.btcTxHash === stage2BtcTxHash) {
                            stage = 4;
                            pegoutInfo.push(bridgeTxDetails);
                            this.emit(PEGOUT_TRACKER_EVENTS.pegoutConfirmedEventFound, bridgeTxDetails);
                        }
                    }
                    break;
                case 4:
                    if(isAddSignatureTx(bridgeTxDetails)) {
                        const pegoutAddSignatureEventArguments = bridgeTxDetails.events[0].arguments;
                        if(pegoutAddSignatureEventArguments.releaseRskTxHash === stage2TxHash) {
                            pegoutInfo.push(bridgeTxDetails);
                            this.emit(PEGOUT_TRACKER_EVENTS.addSignatureEventFound, bridgeTxDetails);
                        }
                    } else if(isReleaseBtcTx(bridgeTxDetails)) {
                        const pegoutReleaseBtcEventArguments = bridgeTxDetails.events[1].arguments;
                        if(pegoutReleaseBtcEventArguments.releaseRskTxHash === stage2TxHash) {
                            pegoutInfo.push(bridgeTxDetails);
                            this.emit(PEGOUT_TRACKER_EVENTS.releaseBtcEventFound, bridgeTxDetails);
                            this.emit(PEGOUT_TRACKER_EVENTS.pegoutStagesFound, pegoutInfo);
                            this.started = false;
                            liveMonitor.stop();
                        }
                    }
                    break;
            }
        });

        liveMonitor.start(params);

    }

    stop() {
        this.emit('stop');
    }

}

module.exports = PegoutTracker;
