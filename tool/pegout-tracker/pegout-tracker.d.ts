type Options = {
    regtestRequiredConfirmations: number;
};

type Network = 'mainnet' | 'testnet' | 'regtest';

export default class PegoutTracker {
    trackPegout(pegoutTxHash: string, network?: Network, options?: Options): Promise<void>;
    stop(): void;
}
