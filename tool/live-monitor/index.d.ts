import Web3 from 'web3';

export interface LiveMonitorParam {
    fromBlock: string | number;
    methods: string[];
    events: string[];
    pegout: boolean;
    pegin: boolean;
    network: string;
    checkEveryMilliseconds: number;
}

export interface BridgeMethod {
    name: string;
    signature: string;
    arguments: {[key: string]: string | number};
}

export interface BridgeEvent {
    name: string,
    signature: string,
    arguments: {[key: string]: string | number},
}

export interface BridgeTxDetails {
    txHash: string;
    blockHash: string;
    blockNumber: number;
    from: string;
    to: string;
    method: BridgeMethod;
    events: BridgeEvent[];
    keepTryingOnError: boolean;
    timestamp: number;
}

export default class LiveMonitor {
    constructor(params: LiveMonitorParam, rskClient: Web3);
    on(event: 'checkingBlock', listener: (blockNumber: number) => void): this;
    on(event: 'filterMatched', listener: (bridgeTx: BridgeTxDetails) => void): this;
    on(event: 'latestBlockReached', listener: (message: string) => void): this;
    on(event: 'started', listener: (message: string) => void): this;
    on(event: 'error', listener: (errorMessage: string) => void): this;
    on(event: 'stopped', listener: (message: string) => void): this;
    setParams(params: LiveMonitorParam): this;
    setWeb3Client(rskClient: Web3): this;
    start(): this;
    stop(): this;
    reset(): this;
    check(): this;
    isStarted: boolean;
    isStopped: boolean;
    isReset: boolean;
}
