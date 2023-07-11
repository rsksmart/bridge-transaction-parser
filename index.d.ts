import Web3 from "web3";
import {TransactionReceipt, Transaction as Web3Transaction} from "web3-core";

interface Transaction {
    txHash: string,
    method: BridgeMethod,
    events: BridgeEvent[],
    blockNumber: number
}

interface BridgeMethod {
    name: string,
    signature: string,
    arguments: {}
}

interface BridgeEvent {
    name: string,
    signature: string,
    arguments: {}
}

export class BridgeTransactionParser {

    /**
     * 
     * @param web3Client Web3 Instance
     */
    constructor(web3Client: Web3);

    /**
     * Gets Bridge Transactions In a Specified Block Hash Or Block Number
     * @param blockHashOrBlockNumber The block hash or block number.
     * @returns Array - Array of transaction objects
     */
    getBridgeTransactionsInThisBlock(blockHashOrBlockNumber: string | number): Promise<Array<Transaction>>;

    /**
     * Gets Bridge Transactions In a Specified Range of Blocks
     * @param startingBlockHashOrBlockNumber The block hash or block number.
     * @param blocksToSearch Number/Amount of blocks to search
     * @returns Array - Array of transaction objects
     */
    getBridgeTransactionsSinceThisBlock(startingBlockHashOrBlockNumber: string | number, blocksToSearch: string): Promise<Array<Transaction>>;

    /**
     * Gets a Single Bridge Transaction Via The Transaction Hash.
     * @param transactionHash The transaction hash.
     * @returns Object - A transaction object
     */
    getBridgeTransactionByTxHash(transactionHash: string): Promise<Transaction>;

    /**
     * Gets a Bridge Transaction given a bridgeTx: web3TransactionObject and a bridgeTxReceipt: TransactionReceipt.
     * @param bridgeTx The bridgeTx web3TransactionObject.
     * @param bridgeTxReceipt The bridgeTxReceipt: web3TransactionReceiptObject.
     * @returns Object - A transaction object
     */
     decodeBridgeTransaction(bridgeTx: Web3Transaction, bridgeTxReceipt: TransactionReceipt): Promise<Transaction>;

}

