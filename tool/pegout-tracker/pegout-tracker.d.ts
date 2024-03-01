type Network = 'mainnet' | 'testnet' | 'regtest';

export default class PegoutTracker {
    trackPegout(pegoutTxHash: string, network?: Network): Promise<void>;
    stop(): void;
}
