const {blocksStub, txReceiptsStub, transactionsStub, dataDecodedResults} = require("./blockchain-stubs.util");

class InterfaceStub {
    constructor(abi) {
        this.abi = abi;
        this.functions = {};
        this.events = {};

        if (abi) {
            abi.forEach(item => {
                if (item.type === 'function') {
                    this.functions[item.name] = {
                        name: item.name,
                        type: 'function',
                        inputs: item.inputs || [],
                        outputs: item.outputs || [],
                        stateMutability: item.stateMutability || 'nonpayable'
                    };
                } else if (item.type === 'event') {
                    this.events[item.name] = {
                        name: item.name,
                        type: 'event',
                        inputs: item.inputs || []
                    };
                }
            });
        }
    }

    getFunction(nameOrSignature) {
        if (nameOrSignature.startsWith('0x')) {
            return Object.values(this.functions).find(f => this.getSighash(f.name) === nameOrSignature);
        }
        return this.functions[nameOrSignature];
    }

    getSighash(functionName) {
        return `0x${functionName.slice(0, 8).padEnd(8, '0')}`;
    }

    getEvent(nameOrSignature) {
        if (nameOrSignature.startsWith('0x')) {
            return Object.values(this.events).find(e => this.getEventTopic(e.name) === nameOrSignature);
        }
        return this.events[nameOrSignature];
    }

    getEventTopic(eventName) {
        return `0x${eventName.slice(0, 8).padEnd(64, '0')}`;
    }

    decodeFunctionData(functionFragment, data) {
        return dataDecodedResults.find(result => result.data === data)?.decoded || {};
    }

    parseLog(log) {
        const eventSignature = log.topics[0];
        const event = Object.values(this.events).find(e => this.getEventTopic(e.name) === eventSignature);

        if (!event) return null;

        return {
            name: event.name,
            signature: eventSignature,
            topic: eventSignature,
            args: dataDecodedResults.find(result => result.data === log.data)?.decoded || {}
        };
    }
}

class ContractStub {
    constructor(address, abi, provider) {
        this.address = address;
        this.interface = new InterfaceStub(abi);
        this.provider = provider;

        if (abi) {
            abi.forEach(item => {
                if (item.type === 'function') {
                    this[item.name] = async (...args) => {
                        return `Result of ${item.name}(${args.join(', ')})`;
                    };
                }
            });
        }
    }
}

const rskClient = {
    getBlock: async (blockHashOrBlockNumber) => {
        const block = blocksStub.find(
            block => block.number === blockHashOrBlockNumber ||
                block.hash === blockHashOrBlockNumber
        );

        if (block) {
            return {
                ...block,
                timestamp: BigInt(block.timestamp || 0),
                _difficulty: block.difficulty ? BigInt(block.difficulty) : undefined
            };
        }
        return null;
    },

    getTransaction: async (txHash) => {
        const tx = transactionsStub.find(tx => tx.hash === txHash);
        if (tx) {
            return {
                ...tx,
                data: tx.input || tx.data,
                value: BigInt(tx.value || 0),
                gasLimit: BigInt(tx.gas || 0)
            };
        }
        return null;
    },

    getTransactionReceipt: async (txHash) => {
        const receipt = txReceiptsStub.find(receipt => receipt.hash === txHash);
        if (receipt) {

            return {
                ...receipt,
                gasUsed: receipt.gasUsed || 0,
                blockNumber: receipt.blockNumber || 0
            };
        }
        return null;
    },

    getLogs: async (filter) => {
        return [];
    },

    call: async (transaction, blockTag) => {
        return "0x";
    }
};

const ethersStub = {
    Contract: ContractStub,
    Interface: InterfaceStub
};

module.exports = {
    rskClient,
    ethersStub,
    ContractStub,
    InterfaceStub
};
