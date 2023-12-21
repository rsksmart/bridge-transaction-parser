export interface LiveMonitorParam {
    fromBlock: string | number;
    methods: string[];
    events: string[];
    pegout: boolean;
    pegin: boolean;
    network: string;
    checkEveryMilliseconds: number;
    retryOnError: boolean;
    retryOnErrorAttempts: number;
    toBlock: string | number;
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
    timestamp: number;
}

export default class LiveMonitor {
    constructor(params?: LiveMonitorParam);
    on(event: 'checkingBlock', listener: (blockNumber: number) => void): this;
    on(event: 'filterMatched', listener: (bridgeTx: BridgeTxDetails) => void): this;
    on(event: 'latestBlockReached', listener: (message: string) => void): this;
    on(event: 'started', listener: (message: string) => void): this;
    on(event: 'error', listener: (errorMessage: string) => void): this;
    on(event: 'stopped', listener: (message: string) => void): this;
    setParams(params: LiveMonitorParam): this;
    setNetwork(network: string): this;
    start(params?: LiveMonitorParam): this;
    stop(): this;
    reset(params?: LiveMonitorParam): this;
    check(): Promise<void>;
    isStarted: boolean;
}
