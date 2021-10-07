module.exports = class BridgeTx {
    constructor(txHash, method, events) {
        this.txHash = txHash
        this.method = method
        this.events = events
    }
}