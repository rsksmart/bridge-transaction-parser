module.exports = class Block {
    constructor(blockNumber, blockTxSize, bridgeTxs) {
        this.blockNumber = blockNumber
        this.blockTxSize = blockTxSize
        this.bridgeTxs = bridgeTxs
    }
}
