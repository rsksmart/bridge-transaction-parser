const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;

class BridgeTx {
    constructor(txHash, method, event) {
        this.txHash = txHash
        this.method = method
        this.event = event
    }
}

const verifyInputs = (...arguments) => {
    const startingBlock = parseInt(arguments[0]);
    if (isNaN(startingBlock) || startingBlock < 0) {
        throw reject();
    }

    let blocksToSearch;
    if (arguments.length === 2) {
        blocksToSearch = parseInt(arguments[1]);
    }

    if (isNaN(blocksToSearch) || blocksToSearch > 100 || blocksToSearch <= 0) {
        blocksToSearch = 10;
        console.log(`Setting Default for blocksToSearch to ${blocksToSearch}`);
    }

    return {startingBlock, blocksToSearch};
}

const reject = () => {
    return `
    Please provide the following parameters:
     - startingBlock(number) [must be bigger than 0] (REQUIRED)
     - blocksToSearch(number) [must be smaller than or equals 100] (DEFAULT: 10)
    `;
};

const processBlock = async (block, web3Client) => {
    const bridgeTxs = []
    const bridge = Bridge.build(web3Client);
    for (let txHash of block.transactions) {
        let tx = await web3Client.eth.getTransactionReceipt(txHash);
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

module.exports = {
    verifyInputs,
    processBlock
}
