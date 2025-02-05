const { ethers, AbiCoder } = require("ethers");
const { bridge: Bridge } = require("@rsksmart/rsk-precompiled-abis");
const BridgeTx = require("./BridgeTx");
const BridgeMethod = require("./BridgeMethod");
const BridgeEvent = require("./BridgeEvent");
const utils = require("./utils");

class BridgeTransactionParser {
    constructor(networkUrl) {
        this.provider = new ethers.JsonRpcProvider(networkUrl);
        this.bridge = new ethers.Contract(Bridge.address, Bridge.abi, this.provider );
        this.abiCoder = new AbiCoder();
    }

    getBridgeTransactionByTxHash = async (transactionHash) => {
        utils.verifyHashOrBlockNumber(transactionHash);

        let transaction;
        const txReceipt = await this.provider.getTransactionReceipt(transactionHash);
        
        if (txReceipt?.to === Bridge.address) {
            const tx = await this.provider.getTransaction(txReceipt.hash);
            transaction = await this.createBridgeTx(tx, txReceipt);
        }

        return transaction;
    };

    getBridgeTransactionsInThisBlock = async (blockHashOrBlockNumber) => {
        utils.verifyHashOrBlockNumber(blockHashOrBlockNumber);

        const block = await this.provider.getBlock(blockHashOrBlockNumber);
        if (!block) {
            throw new Error(`Block ${blockHashOrBlockNumber} not found`);
        }
        const transactions = await Promise.all(block.transactions.map(txHash => this.provider.getTransaction(txHash)));

        const bridgeTxs = [];
        for (let tx of transactions) {
            const transaction = await this.getBridgeTransactionByTxHash(tx.hash);
            if (transaction) {
                bridgeTxs.push(transaction);
            }
        }
        return bridgeTxs;
    };

    getBridgeTransactionsSinceThisBlock = async (startingBlockHashOrBlockNumber, blocksToSearch) => {
        utils.verifyHashOrBlockNumber(startingBlockHashOrBlockNumber);

        if (isNaN(blocksToSearch) || blocksToSearch > 100 || blocksToSearch <= 0) {
            throw new Error("blocksToSearch must be greater than 0 or less than 100");
        }

        const startingBlock = await this.provider.getBlock(startingBlockHashOrBlockNumber);
        if (!startingBlock) {
            throw new Error(`Block ${startingBlockHashOrBlockNumber} not found`);
        }
        const startingBlockNumber = startingBlock.number;

        const bridgeTxs = [];
        for (let i = 0; i < blocksToSearch; i++) {
            const blockNumber = startingBlockNumber + i;
            const blockBridgeTxs = await this.getBridgeTransactionsInThisBlock(blockNumber);
            if (blockBridgeTxs.length) {
                bridgeTxs.push(...blockBridgeTxs);
            }
        }
        return bridgeTxs;
    };

    decodeBridgeTransaction = async (bridgeTx, bridgeTxReceipt) => {
        if (bridgeTx.hash !== bridgeTxReceipt.hash) {
            throw new Error(`Given bridgeTx(${bridgeTx.hash}) and bridgeTxReceipt(${bridgeTxReceipt.hash}) should belong to the same transaction.`);
        }
        if (bridgeTxReceipt.to !== Bridge.address) {
            throw new Error(`Given bridgeTxReceipt is not a bridge transaction`);
        }

        return this.createBridgeTx(bridgeTx, bridgeTxReceipt);
    };

    decodeBridgeMethodParameters = (methodName, data) => {
        const abi = Bridge.abi.find(m => m.name === methodName);
        if (!abi) {
            throw new Error(`${methodName} does not exist in Bridge ABI`);
        }

        const argumentsData = data.substring(10); // Remove the signature bits from the data
        const decodedArgs = this.abiCoder.decode(abi.inputs.map(i => i.type), `0x${argumentsData}`);

        const args = {};
        abi.inputs.forEach((input, index) => {
            args[input.name] = decodedArgs[index];
        });

        return args;
    };

    createBridgeTx = async (tx, txReceipt) => {
        const txData = tx.data;
        const method = this.bridge.interface.getFunction(txData.substring(0, 10));
        const events = this.decodeLogs(txReceipt);
        const block = await this.provider.getBlock(txReceipt.blockNumber);

        let bridgeMethod = "";
        if (method) {
            const args = await this.decodeBridgeMethodParameters(method.name, txData);

            const methodSignature = `${method.name}(${method.inputs.map(i => i.type).join(',')})`;
            const methodSelector = ethers.id(methodSignature).substring(0, 10);

            bridgeMethod = new BridgeMethod(method.name, methodSelector, args);
        }
        return new BridgeTx(
            txReceipt.hash,
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
            const eventFragment = this.bridge.interface.getEvent(log.topics[0]);
            if (!eventFragment) {
                continue;
            }
            const event = this.decodeLog(log, eventFragment);
            events.push(event);
        }
        return events;
    };

    decodeLog = (log, eventFragment) => {
        console.log('eventFragment: ', eventFragment)
        const args = this.bridge.interface.decodeEventLog(eventFragment, log.data, log.topics);
        
        const reducedArgs = args.reduce((acc, arg, index) => {
            acc[eventFragment.inputs[index].name] = arg;
            return acc;
        }, {});

        const eventSignature = `${eventFragment.name}(${eventFragment.inputs.map(i => i.type).join(',')})`;
        const eventTopic = ethers.id(eventSignature);

        return new BridgeEvent(eventFragment.name, eventTopic, reducedArgs);
    };
}

module.exports = BridgeTransactionParser;
