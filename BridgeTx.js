module.exports = class BridgeTx {
    constructor(txHash, method, events, sender, blockNumber, blockTimestamp) {
        this.txHash = txHash;
        this.method = method;
        this.events = events;
        this.sender = sender;
        this.blockNumber = blockNumber;
        this.blockTimestamp = blockTimestamp;
    }
}
