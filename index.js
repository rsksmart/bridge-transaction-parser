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
        this.bridge = new web3Client.eth.Contract(Bridge.abi, Bridge.address);
        this.jsonInterfaceMap = this.bridge._jsonInterface.reduce((map, item) => {
            map[item.signature] = item;
            return map;
        }, {});
    }

    getBridgeTransactionByTxHash = async (transactionHash) => {
        utils.verifyHashOrBlockNumber(transactionHash);
    
        let transaction;
        const txReceipt = await this.web3Client.eth.getTransactionReceipt(transactionHash);
        const unionBridgeAddress = await this.bridge.methods.getUnionBridgeContractAddress().call();
        if (txReceipt?.to === Bridge.address || txReceipt?.to === unionBridgeAddress.toLowerCase()) {
            const tx = await this.web3Client.eth.getTransaction(txReceipt.transactionHash);
            transaction = await this.createBridgeTx(tx, txReceipt);
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
    
        return this.createBridgeTx(bridgeTx, bridgeTxReceipt);
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
    
    createBridgeTx = async (tx, txReceipt) => {
        const txData = tx.input;
        const method =  this.jsonInterfaceMap[txData.substring(0, 10)];
        const events = this.decodeLogs(txReceipt);
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
    
    decodeLogs = (txReceipt) => {
        const events = [];
        for (let log of txReceipt.logs) {
            const abiElement = this.jsonInterfaceMap[log.topics[0]];
            if(!abiElement) {
                continue;
            }
            const event = this.decodeLog(log, abiElement);
            events.push(event);
        }
        return events;
    }

    decodeLog = (log, abiElement) => {
        const args = {};
        const dataDecoded = this.web3Client.eth.abi.decodeParameters(abiElement.inputs.filter(i => !i.indexed), log.data);
        let topicIndex = 1;
        for (let input of abiElement.inputs) {
            let value;
            if (input.indexed) {
                value = this.web3Client.eth.abi.decodeParameter(input.type, log.topics[topicIndex]);
                topicIndex++;
            } else {
                value = dataDecoded[input.name];
            }
            args[input.name] = value;
        }
        return new BridgeEvent(abiElement.name, abiElement.signature, args);
    }

}

module.exports = BridgeTransactionParser;
