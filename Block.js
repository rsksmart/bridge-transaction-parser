module.exports = class Block {
    constructor(blockNumber, bridgeTxs) {
        this.blockNumber = blockNumber
        this.bridgeTxs = bridgeTxs
    }
}
