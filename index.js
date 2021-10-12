const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;
const BridgeTx = require("./BridgeTx");
const BridgeMethod = require("./BridgeMethod");
const BridgeEvent = require("./BridgeEvent");

const getBridgeTransactionByTxHash = async (web3Client, transactionHash) => {
    verifyHashOrBlockNumber(transactionHash);

    let transaction;
    const txReceipt = await web3Client.eth.getTransactionReceipt(transactionHash);
    
    if (txReceipt?.to === Bridge.address) {
        const bridge = Bridge.build(web3Client);

        const txData = (await web3Client.eth.getTransaction(txReceipt.transactionHash)).input;
        const method = bridge._jsonInterface.filter(i => i.signature === txData.substr(0, 10));
        const events = decodeLogs(web3Client, txReceipt, bridge);

        let bridgeMethod = '';
        if (method.length) {
            let args = await decodeBridgeMethodParameters(web3Client, method[0].name, txData);
            bridgeMethod = new BridgeMethod(method[0].name, method[0].signature, args);
        }
        transaction = new BridgeTx(txReceipt.transactionHash, bridgeMethod, events, txReceipt.blockNumber);
    }
    return transaction;
}

const getBridgeTransactionsInThisBlock = async (web3Client, blockHashOrBlockNumber) => {
    verifyHashOrBlockNumber(blockHashOrBlockNumber);

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

const getBridgeTransactionsSinceThisBlock = async (web3Client, startingBlockHashOrBlockNumber, blocksToSearch) => {
    verifyHashOrBlockNumber(startingBlockHashOrBlockNumber);

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
            bridgeTxs.push(blockBridgeTxs);
        }
    }
    return bridgeTxs;

}

const decodeBridgeMethodParameters = (web3Client, methodName, data) => {
    const abi = Bridge.abi.find(m => m.name === methodName);
    if (!abi) {
        throw new Error(methodName, " does not exist in Bridge abi");
    }

    let argumentsData = data.substring(10); // Remove the signature bits from the data
    let dataDecoded = web3Client.eth.abi.decodeParameters(abi.inputs, argumentsData);

    let args = [];
    for (let input of abi.inputs) {
        args.push(input.name + ": " + dataDecoded[input.name]);
    }

    return args;
}

const decodeLogs = (web3Client, tx, bridge) => {
    const events = [];
    for (let txLog of tx.logs) {
        let bridgeEventSearch = bridge._jsonInterface.filter(i => i.signature === txLog.topics[0]);
        
        if (bridgeEventSearch.length) {
            let bridgeEvent = bridgeEventSearch[0];
            let args = [];
            let dataDecoded = web3Client.eth.abi.decodeParameters(bridgeEvent.inputs.filter(i => !i.indexed), txLog.data);

            let topicIndex = 1;
            for (let input of bridgeEvent.inputs) {
                let value;
                if (input.indexed) {
                    value = web3Client.eth.abi.decodeParameter(input.type, txLog.topics[topicIndex]);
                    topicIndex ++;
                } else {
                    value = dataDecoded[input.name];
                }
                
                args.push(input.name + ": " + value);
            }
            events.push(new BridgeEvent(bridgeEvent.name, bridgeEvent.signature, args));
        }
    }

    return events;
}

const verifyHashOrBlockNumber = (blockHashOrBlockNumber) => {
    if (typeof blockHashOrBlockNumber === 'string' && 
        blockHashOrBlockNumber.indexOf('0x') === 0 && 
        blockHashOrBlockNumber.length !== 66) {
        throw new Error('Hash must be of length 66 starting with "0x"');
    } else if (isNaN(blockHashOrBlockNumber) || blockHashOrBlockNumber <= 0) {
        throw new Error('Block number must be greater than 0');
    } 
}

module.exports = {
    getBridgeTransactionsInThisBlock,
    getBridgeTransactionsSinceThisBlock,
    getBridgeTransactionByTxHash
};
