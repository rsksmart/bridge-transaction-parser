const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;
const BridgeTx = require("./BridgeTx");
const Block = require("./Block");

const getBridgeTransactionsInThisBlock = async (web3Client, blockHashOrBlockNumber) => {

    verifyBlockHashOrBlockNumber(blockHashOrBlockNumber);

    const block = await web3Client.eth.getBlock(blockHashOrBlockNumber);
    if (!block) {
        throw new Error(`Block ${blockHashOrBlockNumber} not found`);
    }

    return await processBlock(block, web3Client);
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
        let block = await web3Client.eth.getBlock(blockNumber);
        if (!block) {
            throw new Error(`Block ${blockNumber} not found`);
        }
        let bridgeTxs = await processBlock(block, web3Client);
        result.push(new Block(block.number, block.transactions.length, bridgeTxs))
    }
    return result;

}

const getBridgeTransactionsByTxHash = async (web3Client, transactionHash) => {
    return await web3Client.eth.getTransactionReceipt(transactionHash);
}

const processBlock = async (block, web3Client) => {
    const bridgeTxs = [];
    const bridge = Bridge.build(web3Client);
    for (let txHash of block.transactions) {
        let tx = await getBridgeTransactionsByTxHash(web3Client, txHash);

        if (tx.to === Bridge.address) {
            let txData = (await web3Client.eth.getTransaction(txHash)).input;
            let method = bridge._jsonInterface.filter(i => i.signature === txData.substr(0, 10));

            let eventLog = decodeLogs(tx, bridge);

            if (method.length) {
                bridgeTxs.push(new BridgeTx(txHash, {name: method[0].name, signature: method[0].signature}, eventLog));
            } else {
                bridgeTxs.push(new BridgeTx(txHash, {}, eventLog));
            }
        }
    }
    return bridgeTxs;
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
            eventLogs.push({name: log.name, signature: log.signature})
        }
    }
    return eventLogs;
}

const verifyBlockHashOrBlockNumber = (blockHashOrBlockNumber) => {
    if (blockHashOrBlockNumber.indexOf('0x') === 0 && blockHashOrBlockNumber.length !== 66) {
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
