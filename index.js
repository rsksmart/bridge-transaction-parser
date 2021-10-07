const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;
const BridgeTx = require("./BridgeTx");
const Block = require("./Block");
const BridgeMethod = require("./BridgeMethod");
const LogData = require("./LogData");

const getBridgeTransactionsInThisBlock = async (web3Client, blockHashOrBlockNumber) => {

    verifyBlockHashOrBlockNumber(blockHashOrBlockNumber);

    const block = await web3Client.eth.getBlock(blockHashOrBlockNumber);
    if (!block) {
        throw new Error(`Block ${blockHashOrBlockNumber} not found`);
    }

    return processBlock(block, web3Client);
}

const getBridgeTransactionsSinceThisBlock = async (web3Client, startingBlockHashOrBlockNumber, blocksToSearch) => {

    verifyBlockHashOrBlockNumber(startingBlockHashOrBlockNumber);

    if (isNaN(blocksToSearch) || blocksToSearch > 100 || blocksToSearch <= 0) {
        throw new Error('blocksToSearch [must be greater than 0 or less than 100]');
    }

    const startingBlockNumber = startingBlockHashOrBlockNumber.indexOf('0x') === 0 ?
        (await web3Client.eth.getBlock(startingBlockHashOrBlockNumber)).number : startingBlockHashOrBlockNumber;
    
    const result = []
    for (let i = 0; i < blocksToSearch; i++) {
        let blockNumber = parseInt(startingBlockNumber) + i;
        let bridgeTxs = await getBridgeTransactionsInThisBlock(web3Client, blockNumber)
        result.push(bridgeTxs);
    }
    return result;

}

const getBridgeTransactionsByTxHash = async (web3Client, transactionHash) => {
    let transaction = null;
    const tx = await web3Client.eth.getTransactionReceipt(transactionHash);
    if (tx.to === Bridge.address) {
        const bridge = Bridge.build(web3Client);

        const txData = (await web3Client.eth.getTransaction(tx.transactionHash)).input;
        const method = bridge._jsonInterface.filter(i => i.signature === txData.substr(0, 10));

        const eventLog = decodeLogs(tx, bridge);

        if (method.length) {
            // await decodeBridgeMethodParameters(web3Client, method[0].name, method[0].data)
            transaction = new BridgeTx(tx.transactionHash, new BridgeMethod(method[0].name, method[0].signature, method[0].data), eventLog);
        } else {
            transaction = new BridgeTx(tx.transactionHash, null, eventLog);
        }
    }
    return transaction;
}

const decodeBridgeMethodParameters = (web3Client, methodName, data) => {
    const abi = Bridge.abi.find(m => m.name === methodName);
    if (!abi) {
        console.log(methodName, " does not exist in Bridge abi");
    }
    return web3Client.eth.abi.decodeParameters(abi.inputs, data);
}

const processBlock = async (block, web3Client) => {
    const bridgeTxs = [];
    for (let txHash of block.transactions) {
        let transaction = await getBridgeTransactionsByTxHash(web3Client, txHash)
        if (transaction) bridgeTxs.push(transaction);
    }
    return new Block(block.number, bridgeTxs);
}

const decodeLogs = (tx, bridge) => {
    if (!tx.logs.length) {
        return null;
    }
    const eventLogs = []
    for (let log of tx.logs) {
        let foundLog = bridge._jsonInterface.filter(i => i.signature === log.topics[0]);
        if (foundLog.length) {
            let log = foundLog[0];
            eventLogs.push(new LogData(log.name, log.signature, log.topic, log.data))
        }
    }
    return eventLogs;
}

const verifyBlockHashOrBlockNumber = (blockHashOrBlockNumber) => {
    if (typeof blockHashOrBlockNumber === 'string' 
        && blockHashOrBlockNumber.indexOf('0x') === 0 
        && blockHashOrBlockNumber.length !== 66) {
        throw new Error('BlockHash [must be of length 66 starting with "0x"]');
    } else if (isNaN(blockHashOrBlockNumber) || blockHashOrBlockNumber < 0) {
        throw new Error('BlockNumber [must be greater than 0]');
    } 
}

module.exports = {
    getBridgeTransactionsInThisBlock,
    getBridgeTransactionsSinceThisBlock,
    getBridgeTransactionsByTxHash
};
