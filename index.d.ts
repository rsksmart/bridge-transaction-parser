import {JsonRpcApiProvider, TransactionReceipt, TransactionRequest} from "ethers";

interface Transaction {
    txHash: string,
    method: BridgeMethod,
    events: BridgeEvent[],
    sender: string,
    blockNumber: number,
    blockTimestamp: number
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

export interface Log {
    data: string;
    topics: string[];
}

export interface AbiElement {
    type: string;
    name: string;
    inputs: {name: string, type: string}[];
    outputs: {name: string, type: string}[];
    signature: string;
}

export default class BridgeTransactionParser {

    /**
     * 
     * @param rskClient JsonRpcApiProvider
     */
    constructor(rskClient: JsonRpcApiProvider);

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
     * Gets a Bridge Transaction given a transaction request: TransactionRequest and a bridgeTxReceipt: TransactionReceipt.
     * @param transactionRequest The transactionRequest.
     * @param bridgeTxReceipt The bridgeTxReceipt: TransactionReceipt.
     * @returns Object - A transaction object
     */
     decodeBridgeTransaction(transactionRequest: TransactionRequest, bridgeTxReceipt: TransactionReceipt): Promise<Transaction>;

     /**
      * Decodes logs from a transaction receipt
      * @param txReceipt 
      * @return {BridgeEvent[]}
      */
     decodeLogs(txReceipt: TransactionReceipt): BridgeEvent[];

     /**
     * Decodes a log data using the given abiElement
     * @param {Log} log
     * @param {AbiElement} abiElement 
     * @returns {BridgeEvent}
     */
     decodeLog(log: Log, abiElement: AbiElement): BridgeEvent;

}

