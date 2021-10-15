module.exports = class BridgeTx {
    constructor(txHash, method, events, blockNumber) {
        this.txHash = txHash;
        this.method = method;
        this.events = events;
        this.blockNumber = blockNumber;
    }
}
