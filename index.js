const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;
const BridgeTx = require("./BridgeTx");
const BridgeMethod = require("./BridgeMethod");
const BridgeEvent = require("./BridgeEvent");
const utils = require("./utils");
const {ethers} = require('ethers');
const {formatBigIntForJson} = require("./utils");

class BridgeTransactionParser {

    constructor(rskClient) {
        if (!rskClient) {
            throw new Error(`rskClient is required`);
        }
        this.rskClient = rskClient;
        this.bridge = new ethers.Contract(Bridge.address, Bridge.abi, rskClient);
    }

    getBridgeTransactionByTxHash = async (transactionHash) => {
        utils.verifyHashOrBlockNumber(transactionHash);

        let transaction;
        const txReceipt = await this.rskClient.getTransactionReceipt(
            transactionHash);
        if (txReceipt?.to === Bridge.address) {
            const tx = await this.rskClient.getTransaction(
                txReceipt.hash);
            transaction = await this.createBridgeTx(tx, txReceipt);
        }

        return transaction;
    }

    getBridgeTransactionsInThisBlock = async (blockHashOrBlockNumber) => {
        utils.verifyHashOrBlockNumber(blockHashOrBlockNumber);

        // block in number should be parsed as a Number in order to call the getBlock method
        const blockTag = this.#parseBlockTag(blockHashOrBlockNumber);
        const block = await this.rskClient.getBlock(blockTag);
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

    #parseBlockTag = (blockHashOrBlockNumber) => {
        return typeof blockHashOrBlockNumber === 'string' && blockHashOrBlockNumber.indexOf('0x') === 0 ?
            blockHashOrBlockNumber : Number(blockHashOrBlockNumber);
    }

    getBridgeTransactionsSinceThisBlock = async (startingBlockHashOrBlockNumber,
        blocksToSearch) => {
        utils.verifyHashOrBlockNumber(startingBlockHashOrBlockNumber);

        if (isNaN(blocksToSearch) || blocksToSearch > 100 || blocksToSearch
            <= 0) {
            throw new Error(
                'blocksToSearch must be greater than 0 or less than 100');
        }

        const startingBlockTag = this.#parseBlockTag(startingBlockHashOrBlockNumber);
        const startingBlock = await this.rskClient.getBlock(
            startingBlockTag);
        const startingBlockNumber = startingBlock.number;

        const bridgeTxs = [];
        for (let i = 0; i < blocksToSearch; i++) {
            const blockNumber = parseInt(startingBlockNumber) + i;
            const blockBridgeTxs = await this.getBridgeTransactionsInThisBlock(
                blockNumber);
            if (blockBridgeTxs.length) {
                bridgeTxs.push(...blockBridgeTxs);
            }
        }
        return bridgeTxs;
    }

    decodeBridgeTransaction = async (bridgeTx, bridgeTxReceipt) => {
        if (bridgeTx.hash !== bridgeTxReceipt.hash) {
            throw new Error(
                `Given bridgeTx(${bridgeTx.hash}) and bridgeTxReceipt(${bridgeTxReceipt.hash}) should belong to the same transaction.`);
        }
        if (bridgeTxReceipt.to !== Bridge.address) {
            throw new Error(
                `Given bridgeTxReceipt is not a bridge transaction`);
        }

        return this.createBridgeTx(bridgeTx, bridgeTxReceipt);
    }

    decodeBridgeMethodParameters = (methodName, data) => {
        const abi = Bridge.abi.find(m => m.name === methodName);
        if (!abi) {
            throw new Error(`${methodName} does not exist in Bridge abi`);
        }

        const functionFragment = this.bridge.interface.getFunction(methodName);
        const dataDecoded = this.bridge.interface.decodeFunctionData(functionFragment,
            data);

        // TODO: the parsing of the arguments is not tested
        const args = {};
        for (let input of abi.inputs) {
            args[input.name] = dataDecoded[input.name];
        }
        return args;
    }

    createBridgeTx = async (tx, txReceipt) => {
        const txData = tx.data;
        const functionSignature = txData.substring(0, 10);
        const method = this.bridge.interface.getFunction(functionSignature);
        const events = this.decodeLogs(txReceipt);
        const block = await this.rskClient.getBlock(txReceipt.blockNumber);

        let bridgeMethod = '';
        if (method) {
            const args = await this.decodeBridgeMethodParameters(method.name,
                txData);
            bridgeMethod = new BridgeMethod(method.name, functionSignature,
                args);
        }
        let bridgeTx = new BridgeTx(
            txReceipt.hash,
            bridgeMethod,
            events,
            txReceipt.from,
            txReceipt.blockNumber,
            block.timestamp
        );

        // Format any BigInt values in the bridgeTx
        return formatBigIntForJson(bridgeTx);
    };

    decodeLogs = (txReceipt) => {
        const events = [];
        for (let log of txReceipt.logs) {
            if (log.topics.length === 0) {
                continue;
            }

            const eventSignature = log.topics[0];
            const abiElement = this.bridge.interface.getEvent(eventSignature)
            if (!abiElement) {
                continue;
            }
            const event = this.decodeLog(log, abiElement);
            events.push(event);
        }
        return events;
    }

    decodeLog = (log, abiElement) => {
        const parsedLog = this.bridge.interface.parseLog(log);

        const args = {};
        for (let i = 0; i < abiElement.inputs.length; i++) {
            const input = abiElement.inputs[i];
            args[input.name] = parsedLog.args[i];
        }

        return new BridgeEvent(abiElement.name, log.topics[0], args);
    }
}

module.exports = BridgeTransactionParser;
