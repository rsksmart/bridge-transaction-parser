import Web3 from "web3";

interface Transaction {
    txHash: string,
    method: BridgeMethod,
    events: BridgeEvent[],
    blockNumber: number
}

interface BridgeMethod {
    name: string,
    signature: string,
    arguments: []
}

interface BridgeEvent {
    name: string,
    signature: string,
    arguments: []
}

/**
 * Gets Bridge Transactions In a Specified Block Hash Or Block Number
 * @param web3Client Web3 Instance
 * @param blockHashOrBlockNumber The block hash or block number.
 * @param network The network.
 * @returns Array - Array of transaction objects
 */
export function getBridgeTransactionsInThisBlock(web3Client: Web3, blockHashOrBlockNumber: string | number, network: string): Promise<Array<Transaction>>;

/**
 * Gets Bridge Transactions In a Specified Range of Blocks
 * @param web3Client Web3 Instance
 * @param startingBlockHashOrBlockNumber The block hash or block number.
 * @param blocksToSearch Number/Amount of blocks to search
 * @param network The network.
 * @returns Array - Array of transaction objects
 */
export function getBridgeTransactionsSinceThisBlock(web3Client: Web3, startingBlockHashOrBlockNumber: string | number, blocksToSearch: string, network: string): Promise<Array<Transaction>>;

/**
 * Gets a Single Bridge Transaction Via The Transaction Hash.
 * @param web3Client Web3 Instance
 * @param transactionHash The transaction hash.
 * @param network The network.
 * @returns Object - A transaction object
 */
export function getBridgeTransactionsByTxHash(web3Client: Web3, transactionHash: string, network: string): Promise<Transaction>;
