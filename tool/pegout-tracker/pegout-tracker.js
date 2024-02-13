
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

class PegoutTracker extends EventEmitter {

    constructor() {
        super();
        this.started = false;
    }

    /**
     * 
     * @param {string} pegoutTxHash 
     * @param {mainnet | testnet} network 
     */
    async trackPegout(pegoutTxHash, network = 'mainnet') {

        if(!pegoutTxHash) {
            throw new Error('pegoutTxHash is required');
        }

        if(this.started) {
            console.warn(`Pegout tracker is already started. Stop before calling ${trackPegout.name} again. Ignoring...`);
            return;
        }

        this.started = true;

        pegoutTxHash = pegoutTxHash.toLowerCase();

        const pegoutInfo = [];

        const networkUrl = networkParser(network);

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

        if(nextPegoutCreationHeight > latestBlockNumber) {
            throw new Error(`Next pegout creation height ${nextPegoutCreationHeight} is greater than latest block number ${latestBlockNumber}`);
        }

        const params = { ...defaultLiveMonitorParamsValues, network: networkUrl, fromBlock: nextPegoutCreationHeight };

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

                            const afterConfirmationBlock = stage2BlockNumber + NETWORK_REQUIRED_CONFIRMATIONS[network];

                            const latestBlockNumber = await rskClient.eth.getBlockNumber();

                            if(afterConfirmationBlock > latestBlockNumber) {
                                throw new Error(`Expected after confirmation height ${afterConfirmationBlock} is greater than latest block number ${latestBlockNumber}`);
                            }

                            const newParams = { ...params, fromBlock: stage2BlockNumber + NETWORK_REQUIRED_CONFIRMATIONS[network] };
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
