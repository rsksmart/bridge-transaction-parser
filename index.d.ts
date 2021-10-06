import Web3 from "web3";

interface Transaction {
    blockNumber: number,
    bridgeTxs: BridgeTx[]
}

interface BridgeTx {
    txHash: string,
    method: Method,
    event: string
}

interface Method {
    name: string,
    signature: string,
    data: string
}

/**
 * Gets Bridge Transactions In a Specified Block Hash Or Block Number
 * @param web3Client Web3 Instance
 * @param blockHashOrBlockNumber The block hash or block number.
 * @returns Array - Array of transaction objects
 */
export function getBridgeTransactionsInThisBlock(web3Client: Web3, blockHashOrBlockNumber: string | number): Promise<Array<Transaction>>;

/**
 * Gets Bridge Transactions In a Specified Range of Blocks
 * @param web3Client Web3 Instance
 * @param startingBlockHashOrBlockNumber The block hash or block number.
 * @param blocksToSearch Number/Amount of blocks to search
 * @returns Array - Array of transaction objects
 */
export function getBridgeTransactionsSinceThisBlock(web3Client: Web3, startingBlockHashOrBlockNumber: string | number, blocksToSearch: string): Promise<Array<Transaction>>;

/**
 * Gets a Single Bridge Transaction Via The Transaction Hash.
 * @param web3Client Web3 Instance
 * @param transactionHash The transaction hash.
 * @returns Object - A transaction object
 */
export function getBridgeTransactionsByTxHash(web3Client: Web3, transactionHash: string): Promise<Transaction>;
