const {verifyInputs, processBlock} = require('./block-processor');

class BlockObj {
    constructor(blockNumber, blockTxSize, bridgeTxs) {
        this.blockNumber = blockNumber
        this.blockTxSize = blockTxSize
        this.bridgeTxs = bridgeTxs
    }
}

module.exports = async (web3Client, ...input) => {
    try {
        console.log('Bridge Event Checker Is Starting...\n');

        const {startingBlock, blocksToSearch} = verifyInputs(...input)

        console.log(`Starting from block number ${startingBlock}\n`);
        const result = []
        for (let i = 0; i < blocksToSearch; i++) {
            let blockNumber = startingBlock + i;
            let block = await web3Client.eth.getBlock(blockNumber);
            if (!block) {
                console.log(`Block ${blockNumber} not found`);
                return;
            }
            let bridgeTxs = await processBlock(block, web3Client);
            result.push(new BlockObj(block.number, block.transactions.length, bridgeTxs))
        }

        console.log('Bridge Event Checker Is Done.')
        return result;
    } catch (error) {
        console.log(error);
    }
};
