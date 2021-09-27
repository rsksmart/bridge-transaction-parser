module.exports = class BridgeTx {
    constructor(txHash, method, event) {
        this.txHash = txHash
        this.method = method
        this.event = event
    }
}