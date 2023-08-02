const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;
const BridgeTx = require("./BridgeTx");
const BridgeMethod = require("./BridgeMethod");
const BridgeEvent = require("./BridgeEvent");
const utils = require("./utils");

class BridgeTransactionParser {

    constructor(web3Client) {
        if (!web3Client) {
            throw new Error(`web3Client is required`);
        }
        this.web3Client = web3Client;
    }

    getBridgeTransactionByTxHash = async (transactionHash) => {
        utils.verifyHashOrBlockNumber(transactionHash);
    
        let transaction;
        const txReceipt = await this.web3Client.eth.getTransactionReceipt(transactionHash);
        
        if (txReceipt?.to === Bridge.address) {
            const bridge = Bridge.build(this.web3Client);
            const tx = await this.web3Client.eth.getTransaction(txReceipt.transactionHash);
            transaction = await this.createBridgeTx(bridge, tx, txReceipt);
        }
        
        return transaction;
    }

    getBridgeTransactionsInThisBlock = async (blockHashOrBlockNumber) => {
        utils.verifyHashOrBlockNumber(blockHashOrBlockNumber);
    
        const block = await this.web3Client.eth.getBlock(blockHashOrBlockNumber);
        if (!block) {
            throw new Error(`Block ${blockHashOrBlockNumber} not found`);
        }
    
        const bridgeTxs = [];
        for (let txHash of block.transactions) {
            const transaction = await this.getBridgeTransactionByTxHash(txHash);
            if (transaction) {
                bridgeTxs.push(transaction);
            }
        }
        return bridgeTxs;
    }
    
    getBridgeTransactionsSinceThisBlock = async (startingBlockHashOrBlockNumber, blocksToSearch) => {
        utils.verifyHashOrBlockNumber(startingBlockHashOrBlockNumber);
    
        if (isNaN(blocksToSearch) || blocksToSearch > 100 || blocksToSearch <= 0) {
            throw new Error('blocksToSearch must be greater than 0 or less than 100');
        }
    
        const startingBlockNumber = typeof startingBlockHashOrBlockNumber === 'string' && startingBlockHashOrBlockNumber.indexOf('0x') === 0 ?
            (await this.web3Client.eth.getBlock(startingBlockHashOrBlockNumber)).number : startingBlockHashOrBlockNumber;

        const bridgeTxs = [];
        for (let i = 0; i < blocksToSearch; i++) {
            const blockNumber = parseInt(startingBlockNumber) + i;
            const blockBridgeTxs = await this.getBridgeTransactionsInThisBlock(blockNumber);
            if (blockBridgeTxs.length) {
                bridgeTxs.push(...blockBridgeTxs);
            }
        }
        return bridgeTxs;
    
    }
    
    decodeBridgeTransaction = async (bridgeTx, bridgeTxReceipt) => {
        if (bridgeTx.hash !== bridgeTxReceipt.transactionHash) {
            throw new Error(`Given bridgeTx(${bridgeTx.hash}) and bridgeTxReceipt(${bridgeTxReceipt.transactionHash}) should belong to the same transaction.`);
        }
        if (bridgeTxReceipt.to !== Bridge.address) {
            throw new Error(`Given bridgeTxReceipt is not a bridge transaction`);
        }
    
        const bridge = Bridge.build(this.web3Client);
        return this.createBridgeTx(bridge, bridgeTx, bridgeTxReceipt);
    }
    
    decodeBridgeMethodParameters = (methodName, data) => {
        const abi = Bridge.abi.find(m => m.name === methodName);
        if (!abi) {
            throw new Error(`${methodName} does not exist in Bridge abi`);
        }
    
        const argumentsData = data.substring(10); // Remove the signature bits from the data
        const dataDecoded = this.web3Client.eth.abi.decodeParameters(abi.inputs, argumentsData);
    
        // TODO: the parsing of the arguments is not tested
        const args = {};
        for (let input of abi.inputs) {
            args[input.name] = dataDecoded[input.name];
        }
        return args;
    }
    
    createBridgeTx = async (bridge, tx, txReceipt) => {
        const txData = tx.input;
        const method = bridge._jsonInterface.find(i => i.signature === txData.substr(0, 10));
        const events = this.decodeLogs(txReceipt, bridge);
        const block = await this.web3Client.eth.getBlock(txReceipt.blockNumber);
    
        let bridgeMethod = '';
        if (method) {
            const args = await this.decodeBridgeMethodParameters(method.name, txData);
            bridgeMethod = new BridgeMethod(method.name, method.signature, args);
        }
        return new BridgeTx(
            txReceipt.transactionHash, 
            bridgeMethod, 
            events, 
            txReceipt.from, 
            txReceipt.blockNumber,
            block.timestamp
        );
    };
    
    decodeLogs = (tx, bridge) => {
        const events = [];
        for (let txLog of tx.logs) {
            const bridgeEvent = bridge._jsonInterface.find(i => i.signature === txLog.topics[0]);
            
            if (bridgeEvent) {
                const args = {};
                const dataDecoded = this.web3Client.eth.abi.decodeParameters(bridgeEvent.inputs.filter(i => !i.indexed), txLog.data);
                let topicIndex = 1;
                for (let input of bridgeEvent.inputs) {
                    let value;
                    if (input.indexed) {
                        value = this.web3Client.eth.abi.decodeParameter(input.type, txLog.topics[topicIndex]);
                        topicIndex++;
                    } else {
                        value = dataDecoded[input.name];
                    }
                    args[input.name] = value;
                }
                events.push(new BridgeEvent(bridgeEvent.name, bridgeEvent.signature, args));
            }
        }
    
        return events;
    }

}

module.exports = BridgeTransactionParser;
