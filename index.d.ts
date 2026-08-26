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

/**
 * Thrown when a payload is not a canonical ABI encoding of the parameters it
 * claims to carry — aliased, overlapping, misaligned or out-of-bounds dynamic
 * offsets, or a declared length that does not fit. Raised before any decoding
 * happens, so the payload costs one pass over its offset words.
 */
export declare class NonCanonicalCalldataError extends Error {
    readonly name: 'NonCanonicalCalldataError';
    readonly code: 'NON_CANONICAL_CALLDATA';
    readonly info?: unknown;
}

/**
 * Thrown when the Bridge ABI contains a construct the calldata guard cannot
 * walk. Depends only on the packaged ABI, never on the payload.
 */
export declare class UnsupportedAbiTypeError extends Error {
    readonly name: 'UnsupportedAbiTypeError';
    readonly code: 'UNSUPPORTED_ABI_TYPE';
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
    getBridgeTransactionsSinceThisBlock(startingBlockHashOrBlockNumber: string | number, blocksToSearch: number): Promise<Array<Transaction>>;

    /**
     * Gets a Single Bridge Transaction Via The Transaction Hash.
     * @param transactionHash The transaction hash.
     * @returns Object - A transaction object, or undefined if the transaction receipt is not found or the transaction is not a Bridge transaction
     * @throws NonCanonicalCalldataError if the transaction's calldata is not a canonical ABI encoding
     */
    getBridgeTransactionByTxHash(transactionHash: string): Promise<Transaction | undefined>;

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

