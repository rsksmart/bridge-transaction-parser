const { getBridgeTransactionByTxHash } = require('../../index');
const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;
const EventEmitter = require('node:events');
const { MONITOR_EVENTS, defaultParamsValues } = require('./live-monitor-utils');

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

const isAPegoutRelatedTransactionData = (data) => {
    const methodSignature = data.slice(0, 10);
    return Object.values(PEGOUT_METHOD_SIGNATURES)
            .includes(methodSignature);
};

const isAPeginRelatedTransactionData = (data) => {
    const methodSignature = data.slice(0, 10);
    return Object.values(PEGIN_METHOD_SIGNATURES)
            .includes(methodSignature);
};

class LiveMonitor extends EventEmitter {
    constructor(params, rskClient) {
        super();
        this.params = { ...defaultParamsValues, ...params };
        this.rskClient = rskClient;
        this.currentBlockNumber = params.fromBlock;
        this.notified = false;
        this.timer = null;
        this.latestBlockNumber = null;
        this.isStarted = false;
        this.isStopped = false;
        this.isReset = false;
    }

    async check() {

        try {

            if(this.latestBlockNumber < this.currentBlockNumber) {
                if(!this.notified) {
                    this.emit(MONITOR_EVENTS.latestBlockReached, 'Latest block reached');
                    this.notified = true;
                }
                return;
            }
    
            this.notified = false;
    
            const block = await this.rskClient.eth.getBlock(this.currentBlockNumber, true);
    
            this.emit(MONITOR_EVENTS.checkingBlock, block.number);
    
            this.currentBlockNumber++;
    
            for(const transaction of block.transactions) {
                
                if(transaction.to === Bridge.address) {
    
                    const isPeginRelated = isAPeginRelatedTransactionData(transaction.input);
                    const isPegoutRelated = isAPegoutRelatedTransactionData(transaction.input);
    
                    // Requested only pegouts, if tx is not a pegout then continue
                    if(!this.params.pegin && (this.params.pegout && !isPegoutRelated)) {
                        continue;
                    // Requested only pegins, if tx is not a pegin then return
                    } else if(!this.params.pegout && (this.params.pegin && !isPeginRelated)) {
                        continue;
                    // Requested only pegins and pegouts, if tx is not a pegin or pegout then return
                    } else if((this.params.pegin && this.params.pegout) && (!isPeginRelated && !isPegoutRelated)) {
                        continue;
                    }
    
                    // Showing all bridge events by default if params.pegin and params.pegout where not specified
            
                    const rskTx = await getBridgeTransactionByTxHash(this.rskClient, transaction.hash);
    
                    if(this.params.methods.length > 0 && !this.params.methods.includes(rskTx.method.name)) {
                        continue;
                    }
    
                    const containsAtLeast1RequestedEvent = rskTx.events.some(event => this.params.events.includes(event.name));
                    if(this.params.events.length > 0 && !containsAtLeast1RequestedEvent) {
                        continue;
                    }
    
                    const bridgeTxDetails = {
                        txHash: transaction.hash,
                        blockHash: transaction.blockHash,
                        blockNumber: transaction.blockNumber,
                        from: transaction.from,
                        to: transaction.to,
                        method: rskTx.method,
                        events: rskTx.events,
                        timestamp: block.timestamp,
                    };
    
                    this.emit(MONITOR_EVENTS.filterMatched, bridgeTxDetails);
    
                }
    
            }
    
        } catch(error) {
            const errorMessages = `There was an error trying to get the tx data/events in block: ${this.currentBlockNumber - 1}`;
            this.emit(MONITOR_EVENTS.error, `${errorMessages}: ${error.message}\nMoving forward...`);
            console.error(errorMessages, error);
        }
    }

    start() {
        if(this.timer) {
            this.emit(MONITOR_EVENTS.error, 'Live monitor already started');
            return;
        }
       
        const setup = async () => {
            this.latestBlockNumber = await this.rskClient.eth.getBlockNumber();

            if(this.currentBlockNumber === 'latest') {
                this.currentBlockNumber = this.latestBlockNumber;
            } else if(this.currentBlockNumber < 0) {
                // If the block number is negative, it will be interpreted as the number of blocks before the latest block
                this.currentBlockNumber = this.latestBlockNumber - currentBlockNumber;
            }
            this.isStarted = true;
            this.isStopped = false;
            this.emit(MONITOR_EVENTS.started, 'Live monitor started');
            this.timer = setInterval(async () => {
                // If the current block number is greater than the latest block number, then we need to update the latest block number
                if(this.currentBlockNumber > this.latestBlockNumber) {
                    this.latestBlockNumber = await this.rskClient.eth.getBlockNumber();
                }
                this.check();
            }, this.params.checkEveryMilliseconds);
        }

        setup();

        return this;
    }

    stop() {
        if(this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.isStarted = false;
        this.hasStopped = true;
        this.emit(MONITOR_EVENTS.stopped, 'Live monitor stopped');
        return this;
    }

    reset() {
        this.stop();
        this.currentBlockNumber = this.params.fromBlock;
        this.start();
        this.emit(MONITOR_EVENTS.reset, 'Live monitor reset');
        this.hasReset = true;
        return this;
    }

    setParams(params) {
        this.stop();
        this.params = { ...this.params, ...params };
        this.start();
        return this;
    }

    setWeb3Client(rskClient) {
        this.stop();
        this.rskClient = rskClient;
        this.start();
        return this;
    }

}

module.exports = LiveMonitor;
