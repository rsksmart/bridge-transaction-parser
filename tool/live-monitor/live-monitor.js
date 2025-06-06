const BridgeTransactionParser = require('../../index');
const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;
const EventEmitter = require('node:events');
const { MONITOR_EVENTS, defaultParamsValues } = require('./live-monitor-utils');
const { ethers } = require("ethers");
const networkParser = require("../network-parser");

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

let attempts = 0;

class LiveMonitor extends EventEmitter {
    constructor(params = {}) {
        super();
        this.params = { ...defaultParamsValues, ...params };
        this.currentBlockNumber = params.fromBlock;
        this.notified = false;
        this.timer = null;
        this.latestBlockNumber = null;
        this.isStarted = false;
        this.toBlock = params.toBlock;

        if(params.network) {
            this.rskClient = new ethers.JsonRpcProvider(params.network);
            this.bridgeTransactionParser = new BridgeTransactionParser(this.rskClient);
        }
    }

    async check() {

        if(!this.isStarted) {
            return;
        }

        try {

            attempts++;
            
            this.latestBlockNumber = (await this.rskClient.getBlock('latest')).number;

            if(this.latestBlockNumber < this.currentBlockNumber) {
                if(!this.notified) {
                    this.emit(MONITOR_EVENTS.latestBlockReached, 'Latest block reached');
                    this.notified = true;
                }
                return;
            }
    
            this.notified = false;
    
            const block = await this.rskClient.getBlock(this.currentBlockNumber, true);
    
            this.emit(MONITOR_EVENTS.checkingBlock, block.number);
    
            for(const transactionHash of block.transactions) {

                const transaction = await this.rskClient.getTransaction(transactionHash);
                if(transaction.to === Bridge.address) {

                    const isPeginRelated = isAPeginRelatedTransactionData(transaction.data);
                    const isPegoutRelated = isAPegoutRelatedTransactionData(transaction.data);
    
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
            
                    const rskTx = await this.bridgeTransactionParser.getBridgeTransactionByTxHash(transaction.hash);

                    if(!rskTx) {
                        console.error(`Tx ${transaction.hash} not found.`);
                        continue;
                    }
    
                    if(this.params.methods && this.params.methods.length > 0 && !this.params.methods.includes(rskTx.method.name)) {
                        continue;
                    }
    
                    const containsAtLeast1RequestedEvent = rskTx.events.some(event => this.params.events.includes(event.name));
                    if(this.params.events && this.params.events.length > 0 && !containsAtLeast1RequestedEvent) {
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

            if(this.toBlock && this.toBlock !== -1 && this.currentBlockNumber >= this.toBlock) {
                this.emit(MONITOR_EVENTS.toBlockReached, 'To block number reached. Stopping monitor...');
                this.stop();
                return;
            }

            this.currentBlockNumber++;

            attempts = 0;

        } catch(error) {
            const shouldRetryToProcessSameBlock = this.params.retryOnError && attempts < this.params.retryOnErrorAttempts;
            if(shouldRetryToProcessSameBlock) {
                console.error(`There was an error trying to get the tx data/events in block: ${this.currentBlockNumber}. Attempt ${attempts} of ${this.params.retryOnErrorAttempts}.`);
            } else {
                const errorMessages = `There was an error trying to get the tx data/events in block: ${this.currentBlockNumber}`;
                this.emit(MONITOR_EVENTS.error, `${errorMessages}: ${error.message}\nMoving forward with the next block ${this.currentBlockNumber + 1}...`);
                console.error(errorMessages, error);
                this.currentBlockNumber++;
            }
        } finally {
            if(this.isStarted) {
                this.timer = setTimeout(() => {
                    if(this.isStarted) {
                        this.check();
                    }
                }, this.params.checkEveryMilliseconds);
            }
        }
    }

    start(params) {

        if(!params) {
            params = this.params;
        }

        try {
            if(this.timer || this.isStarted) {
                this.emit(MONITOR_EVENTS.error, 'Live monitor already started.');
                return;
            }
            
            if(params && params.network) {
                this.rskClient = new ethers.JsonRpcProvider(networkParser(params.network));
            }

            if(!params.events) {
                params.events = [];
            }

            if(!params.methods) {
                params.methods = [];
            }
    
            this.setParams(params);
    
            if(!this.params) {
                this.emit(MONITOR_EVENTS.error, 'Params not provided. Exiting...');
                return;
            }
    
            if(!this.params.network) {
                this.emit(MONITOR_EVENTS.error, 'Network not provided. Exiting...');
                return;
            }

            this.setNetwork(this.params.network);
    
            const setup = async () => {
                try {
                    this.latestBlockNumber = (await this.rskClient.getBlock(
                        'latest')).number;
    
                    if(this.currentBlockNumber === 'latest') {
                        this.currentBlockNumber = this.latestBlockNumber;
                    } else {
                        this.currentBlockNumber = parseInt(this.currentBlockNumber);
                    }

                    if(this.params.toBlock) {
                        if(this.params.toBlock === 'latest') {
                            this.toBlock = this.latestBlockNumber;
                        } else {
                            this.toBlock = Number(this.params.toBlock);
                        }
                    }
                    
                    if(this.currentBlockNumber < 0) {
                        // If the block number is negative, it will be interpreted as the number of blocks before the latest block
                        this.currentBlockNumber = this.latestBlockNumber + this.currentBlockNumber;
                    }
        
                    this.isStarted = true;
                    this.notified = false;
                    this.emit(MONITOR_EVENTS.started, 'Live monitor started');
                    this.check();
                } catch(error) {
                    const message = `There was an error trying to setup the live monitor`;
                    this.emit(MONITOR_EVENTS.error, `${message}: ${error.message}`);
                    this.emit(MONITOR_EVENTS.stopped, 'Live monitor stopped due to error while setting up the monitor');
                    console.error(message, error);
                    this.isStarted = false;
                }
            };
    
            setup();
    
        } catch(error) {
            const errorMessages = `There was an error trying to start the live monitor`;
            this.emit(MONITOR_EVENTS.error, `There was an error trying to start the live monitor: ${error.message}. Stopping...`);
            this.emit(MONITOR_EVENTS.stopped, 'Live monitor stopped due to error while starting the monitor');
            console.error(errorMessages);
            this.isStarted = false;
        }

        return this;
    }

    stop() {
        try {
            if(this.isStarted || this.timer !== null) {
                this.isStarted = false;
                clearTimeout(this.timer);
                this.timer = null;
                this.emit(MONITOR_EVENTS.stopped, 'Live monitor stopped');
            }
        } catch(error) {
            this.emit(MONITOR_EVENTS.error, `There was an error trying to stop the live monitor: ${error.message}`);
            console.error(error);
        }
        return this;
    }

    reset(params) {
        if(!params) {
            params = this.params;
        }
        attempts = 0;
        this.stop();
        this.currentBlockNumber = params.fromBlock;
        this.start(params);
        this.emit(MONITOR_EVENTS.reset, 'Live monitor reset');
        return this;
    }

    setParams(params = {}) {
        this.params = { ...this.params, ...params };
        return this;
    }

    setNetwork(network) {
        this.params.network = network;
        this.rskClient = new ethers.JsonRpcProvider(network);
        this.bridgeTransactionParser = new BridgeTransactionParser(this.rskClient);
        return this;
    }

    setEmitterMaxListeners(maxListeners) {
        this.setMaxListeners(maxListeners);
    }

}

module.exports = LiveMonitor;
