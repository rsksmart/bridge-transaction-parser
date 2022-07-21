const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;
const BridgeTx = require("./BridgeTx");
const BridgeMethod = require("./BridgeMethod");
const BridgeEvent = require("./BridgeEvent");
const utils = require("./utils");

const getBridgeTransactionByTxHash = async (web3Client, transactionHash) => {
    utils.verifyHashOrBlockNumber(transactionHash);

    let transaction;
    const txReceipt = await web3Client.eth.getTransactionReceipt(transactionHash);
    
    if (txReceipt?.to === Bridge.address) {
        const bridge = Bridge.build(web3Client);
        const tx = await web3Client.eth.getTransaction(txReceipt.transactionHash);
        transaction = await createBridgeTx(web3Client, bridge, tx, txReceipt);
    }
    
    return transaction;
}

const getBridgeTransactionsInThisBlock = async (web3Client, blockHashOrBlockNumber) => {
    utils.verifyHashOrBlockNumber(blockHashOrBlockNumber);

    const block = await web3Client.eth.getBlock(blockHashOrBlockNumber);
    if (!block) {
        throw new Error(`Block ${blockHashOrBlockNumber} not found`);
    }

    const bridgeTxs = [];
    for (let txHash of block.transactions) {
        let transaction = await getBridgeTransactionByTxHash(web3Client, txHash);
        if (transaction) {
            bridgeTxs.push(transaction);
        }
    }
    return bridgeTxs;
}

// TODO: Add test case to verify that a search going beyond the best block should fail
const getBridgeTransactionsSinceThisBlock = async (web3Client, startingBlockHashOrBlockNumber, blocksToSearch) => {
    utils.verifyHashOrBlockNumber(startingBlockHashOrBlockNumber);

    if (isNaN(blocksToSearch) || blocksToSearch > 100 || blocksToSearch <= 0) {
        throw new Error('blocksToSearch must be greater than 0 or less than 100');
    }

    const startingBlockNumber = typeof startingBlockHashOrBlockNumber === 'string' && startingBlockHashOrBlockNumber.indexOf('0x') === 0 ?
        (await web3Client.eth.getBlock(startingBlockHashOrBlockNumber)).number : startingBlockHashOrBlockNumber;
    
    const bridgeTxs = [];
    for (let i = 0; i < blocksToSearch; i++) {
        let blockNumber = parseInt(startingBlockNumber) + i;
        let blockBridgeTxs = await getBridgeTransactionsInThisBlock(web3Client, blockNumber);
        if (blockBridgeTxs.length) {
            bridgeTxs.push(...blockBridgeTxs);
        }
    }
    return bridgeTxs;

}

const decodeBridgeTransaction = async (web3Client, bridgeTx, bridgeTxReceipt) => {
    if (bridgeTx.hash !== bridgeTxReceipt.transactionHash) {
        throw new Error(`Given bridgeTx(${bridgeTx.hash}) and bridgeTxReceipt(${bridgeTxReceipt.transactionHash}) 
        should belong to the same transaction.`);
    }

    if (bridgeTxReceipt?.to !== Bridge.address) {
        throw new Error(`Given bridgeTxReceipt is not a bridge transaction`);
    }

    const bridge = Bridge.build(web3Client);
    return createBridgeTx(web3Client, bridge, bridgeTx, bridgeTxReceipt);
}

const decodeBridgeMethodParameters = (web3Client, methodName, data) => {
    const abi = Bridge.abi.find(m => m.name === methodName);
    if (!abi) {
        throw new Error(`${methodName} does not exist in Bridge abi`);
    }

    let argumentsData = data.substring(10); // Remove the signature bits from the data
    let dataDecoded = web3Client.eth.abi.decodeParameters(abi.inputs, argumentsData);

    // TODO: the parsing of the arguments is not tested
    let args = new Map();
    for (let input of abi.inputs) {
        args.set(input.name, dataDecoded[input.name]);
    }

    return args;
}

const createBridgeTx = async (web3Client, bridge, tx, txReceipt) => {
    const txData = tx.input;
    const method = bridge._jsonInterface.find(i => i.signature === txData.substr(0, 10));
    const events = decodeLogs(web3Client, txReceipt, bridge);

    let bridgeMethod = '';
    if (method) {
        let args = await decodeBridgeMethodParameters(web3Client, method.name, txData);
        bridgeMethod = new BridgeMethod(method.name, method.signature, args);
    }
    return new BridgeTx(txReceipt.transactionHash, bridgeMethod, events, txReceipt.blockNumber);
};

const decodeLogs = (web3Client, tx, bridge) => {
    const events = [];
    for (let txLog of tx.logs) {
        let bridgeEvent = bridge._jsonInterface.find(i => i.signature === txLog.topics[0]);
        
        if (bridgeEvent) {
            let args = new Map();
            let dataDecoded = web3Client.eth.abi.decodeParameters(bridgeEvent.inputs.filter(i => !i.indexed), txLog.data);

            let topicIndex = 1;
            for (let input of bridgeEvent.inputs) {
                let value;
                if (input.indexed) {
                    value = web3Client.eth.abi.decodeParameter(input.type, txLog.topics[topicIndex]);
                    topicIndex++;
                } else {
                    value = dataDecoded[input.name];
                }
                args.set(input.name, value);
            }
            events.push(new BridgeEvent(bridgeEvent.name, bridgeEvent.signature, args));
        }
    }

    return events;
}

module.exports = {
    getBridgeTransactionsInThisBlock,
    getBridgeTransactionsSinceThisBlock,
    getBridgeTransactionByTxHash,
    decodeBridgeTransaction
};
