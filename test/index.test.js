const chai = require('chai')
const chaiAsPromised = require('chai-as-promised');
const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;
const BridgeTransactionParser = require('../index');

const assert = chai.assert;
chai.use(chaiAsPromised);
const {expect} = chai;

const bridgeInstanceStub = {
    _address: Bridge.address,
    _jsonInterface: [
        {
            name: 'updateCollections',
            type: 'function',
            signature: '0x0c5a9990'
        },
        {
            inputs: [{indexed: false, name: 'sender', type: 'address'}],
            name: 'update_collections',
            type: 'event',
            signature: '0x1069152f4f916cbf155ee32a695d92258481944edb5b6fd649718fc1b43e515e'
        },
        {
            name: 'commitFederation',
            type: 'function',
            signature: '0x1533330f'
        },
        {
            inputs: [
                {indexed: true, name: 'rskTxHash', type: 'bytes32'},
                {indexed: true, name: 'btcTxHash', type: 'bytes32'},
                {indexed: false, name: 'amount', type: 'uint256'}
            ],
            name: 'release_requested',
            type: 'event',
            signature: '0x7a7c29481528ac8c2b2e93aee658fddd4dc15304fa723a5c2b88514557bcc790'
        },
        {
            inputs: [
                {
                    indexed: false,
                    name: 'oldFederationBtcPublicKeys',
                    type: 'bytes'
                },
                {indexed: false, name: 'oldFederationBtcAddress', type: 'string'},
                {
                    indexed: false,
                    name: 'newFederationBtcPublicKeys',
                    type: 'bytes'
                },
                {indexed: false, name: 'newFederationBtcAddress', type: 'string'},
                {indexed: false, name: 'activationHeight', type: 'int256'}
            ],
            name: 'commit_federation',
            type: 'event',
            signature: '0x5b9466a0b50d1cab12eeb0b3b5d387ece7659afcc56bb15704535e6954de8c4e'
        },
        {
            inputs: [
                {indexed: true, name: 'sender', type: 'address'},
                {indexed: false, name: 'btcDestinationAddress', type: 'bytes'},
                {indexed: false, name: 'amount', type: 'uint256'}
            ],
            name: 'release_request_received',
            type: 'event',
            signature: '0x8e04e2f2c246a91202761c435d6a4971bdc7af0617f0c739d900ecd12a6d7266'
        }
    ]
};

const txReceiptsStub = [
    // Non Bridge transactions
    {
        transactionHash: '0x6547e88a30d1b43c6fbea07fa7443dfeb697d076495c3e4fc56ebf40228e0431',
        blockNumber: 1001,
        logs: [
            {
                data: '0x00000000000000000000000017f9fbb707fa50eb98d7ec32cfeda33d0924f1a1000000000000000000000000000000000000000000000b78141d4d3f296d0000000000000000000000000000f813c5dfe9602fb4b76ad71305788e9ca1649f310000000000000000000000000000000000000000000000000000000000221ac1',
                topics: [
                    '0x3a383add96d332943cbe603b4dc1055154e63668959b8d8517ae06c46be46218'
                ]
            }
        ],
        from: '0x4495768e683423a4299d6a7f02a0689a6ff5a0a4',
        to: '0x39192498fcf1dbe11653040bb49308e09a1056ac'
    },
    {
        transactionHash: '0x7f6c029fba670f1ee14729e5531c672e813ac1ef4c86dec313b090119c14fa78',
        blockNumber: 1002,
        logs: [],
        from: '0x4495768e683423a4299d6a7f02a0689a6ff5a0a4',
        to: '0x39192498fcf1dbe11653040bb49308e09a1056ac'
    },
    {
        transactionHash: '0x719715d6dc0617b6495d74aa4aa21b0755057ef6ad7cdcb71bdffcc2b3af4b24',
        blockNumber: 1003,
        logs: [
            {
                data: '0x00000000000000000000000090fb63563b8e425dd3419f85cd7581c42fbcd4cc000000000000000000000000000000000000000000000b78141d4d3f296d0000000000000000000000000000ff49426ee621fcf9928ffdbd163fbc13fa36f4650000000000000000000000000000000000000000000000000000000000221ac2',
                topics: [
                    '0x3a383add96d332943cbe603b4dc1055154e63668959b8d8517ae06c46be46218'
                ]
            }
        ],
        from: '0x6aff5f3d80744d84a4e4033b27de2ac1d6a49f34',
        to: '0x8bf2f24afbb9dbe4f2a54fd72748fc797bb91f81'
    },
    // Bridge transactions
    {
        transactionHash: '0x112439355294e02096078c3b77cb12546fe79d284f46d478b3584873c2bacb8b',
        blockNumber: 1004,
        logs: [
            {
                data: '0x00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002c00000000000000000000000000000000000000000000000000000000000221b0000000000000000000000000000000000000000000000000000000000000000a5023f0283519167f1603ba92b060146baa054712b938a61f35605ba08773142f4da02afc230c2d355b1a577682b07bc2646041b5d0177af0f98395a46018da699b6da031174d64db12dc2dcdc8064a53a4981fa60f4ee649a954e01bcae221fc60777a20344a3c38cd59afcba3edcebe143e025574594b001700dec41e59409bdbd0f2a09039a060badbeb24bee49eb2063f616c0f0f0765d4ca646b20a88ce828f259fcdb90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000023324e31474d4238677848595235484c505352676639434a394c756e6a623943546e4b42000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a50208f40073a9e43b3e9103acec79767a6de9b0409749884e989960fee578012fce0225e892391625854128c5c4ea4340de0c2a70570f33db53426fc9c746597a03f402afc230c2d355b1a577682b07bc2646041b5d0177af0f98395a46018da699b6da0344a3c38cd59afcba3edcebe143e025574594b001700dec41e59409bdbd0f2a09039a060badbeb24bee49eb2063f616c0f0f0765d4ca646b20a88ce828f259fcdb90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000023324d77364b4d36343266626b7970547a626746693644546754465052575a55443442410000000000000000000000000000000000000000000000000000000000',
                topics: [
                    '0x5b9466a0b50d1cab12eeb0b3b5d387ece7659afcc56bb15704535e6954de8c4e'
                ]
            }
        ],
        from: '0xfe90f02331ddf62cb50f5650dca554b47b37c471',
        to: '0x0000000000000000000000000000000001000006'
    },
    {
        transactionHash: '0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7',
        blockNumber: 1005,
        logs: [
            {
                data: '0x000000000000000000000000fe90f02331ddf62cb50f5650dca554b47b37c471',
                topics: [
                    '0x1069152f4f916cbf155ee32a695d92258481944edb5b6fd649718fc1b43e515e'
                ]
            },
            {
                data: '0x00000000000000000000000000000000000000000000000000000000000f6f9a',
                topics: [
                    '0x7a7c29481528ac8c2b2e93aee658fddd4dc15304fa723a5c2b88514557bcc790',
                    '0x6b735fe7af1819082404d3d05133ceaba3ebfc400cdfd621261285e6b092371f',
                    '0x7cbbf9d911d8e76b2a3a4b02a430b39b0b5c3b95f3ee2ca5df1483980d960e0b'
                ]
            },
            {
                data: '0x0000000000000000000000000000000000000000000000000000000000000040',
                topics: [
                    '0x8e04e2f2c246a91202761c435d6a4971bdc7af0617f0c739d900ecd12a6d7266',
                    '0x00000000000000000000000075d7b75612ed7a0edc70ceced86a9701e8d07d6a'
                ]
            }
        ],
        from: '0xde7cfc6aa19c7ddea05bb50de9b4e1ff461b972f',
        to: '0x0000000000000000000000000000000001000006'
    },
    {
        transactionHash: '0x7a3c39f59e1f2c624602c9b54c28155a251963ec878049c0f78a7d281b2e3b87',
        blockNumber: 1006,
        logs: [],
        to: '0x0000000000000000000000000000000001000006'
    }
]

const transactionsStub = [
    {
        hash: '0x6547e88a30d1b43c6fbea07fa7443dfeb697d076495c3e4fc56ebf40228e0431',
        input: ''
    },
    {
        hash: '0x112439355294e02096078c3b77cb12546fe79d284f46d478b3584873c2bacb8b',
        input: '0x1533330f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002046a7b0b12a6a01f08f738aca89682278e439c6f122febd0e8f86659f594f43ae'
    },
    {
        hash: '0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7',
        input: '0x0c5a9990'
    },
    {
        hash: '0x7a3c39f59e1f2c624602c9b54c28155a251963ec878049c0f78a7d281b2e3b87',
        input: '0xe5400e7b000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000005000000020072f3cd0fb1f55b05fc2022dfcffe2ab3f5f35eb661c22520b00000000000000ff3adfeb1f20aa198d665620a7d77e4d3d1ffdc44c1cbf8ca1ef13c9309d5a7bb1c36161ffff001dd6870fb600000000000000000000000000000000'
    }
]

const blocksStub = [
    {
        number: 1001,
        hash: '0x74cdc98cd3f98fa85cecc749ce832f9f89bfb5ed9aacccea8fc4aa1d2792ec35',
        transactions: [
            '0x112439355294e02096078c3b77cb12546fe79d284f46d478b3584873c2bacb8b', // Bridge transaction
            '0x6547e88a30d1b43c6fbea07fa7443dfeb697d076495c3e4fc56ebf40228e0431', // Not bridge transaction
            '0x7f6c029fba670f1ee14729e5531c672e813ac1ef4c86dec313b090119c14fa78', // Not bridge transaction
            '0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7' // Bridge transaction
        ],
        timestamp: 1683234772
    },
    {
        number: 1002,
        hash: '0xcdc8e7d4d5417ae5a36c6c246fa34df2ec0ebc9056055eeea401dc95e85e98f1',
        transactions: [
            '0x719715d6dc0617b6495d74aa4aa21b0755057ef6ad7cdcb71bdffcc2b3af4b24' // Not bridge transaction
        ],
        timestamp: 1688764372
    },
    {
        number: 1003,
        hash: '0x5f4da1a8bc0f04fd1bca304cbfca19bbf618307a8855bfd71841428a83474f20',
        transactions: [
            '0x7a3c39f59e1f2c624602c9b54c28155a251963ec878049c0f78a7d281b2e3b87' // Bridge transaction
        ],
        timestamp: 1694023972
    },
    {
        number: 1004,
        hash: '0x3c57396af7db18317efa29a3e4de1c4b66fe3f0e49b6236f62d30927d107d030',
        transactions: [
            '0x112439355294e02096078c3b77cb12546fe79d284f46d478b3584873c2bacb8b' // Bridge transaction
        ],
        timestamp: 1697289052
    },
    {
        number: 1005,
        hash: '0xa2ee5fddb10d16e9b1bf0e9e8afdf5cb4efd9e84d4d308ef4949da6068cd9d16',
        transactions: [
            '0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7', // Bridge transaction
            '0x6de85c65973ade9993a6f5c02603e979ac3c09dc18a3206421c2931d559b64ed' // Not bridge transaction
        ],
        timestamp: 1710421852
    },
    {
        number: 1006,
        hash: '0x3411a34eaf3c239595642db1225c34c137833672460d45afc4140e4d4aeaa390',
        transactions: [
            '0x7a3c39f59e1f2c624602c9b54c28155a251963ec878049c0f78a7d281b2e3b87', // Bridge transaction
            '0xfd9012ec6b585186fabb8b48e75dca559be5e197ea776139cbf35816914a2dfa' // Not bridge transaction
        ],
        timestamp: 1754170133
    }
]

const dataDecodedResults = [
    {
        data: '0x000000000000000000000000fe90f02331ddf62cb50f5650dca554b47b37c471',
        decoded: {
            sender: '0xfe90f02331ddf62cb50f5650dca554b47b37c471'
        }
    },
    {
        data: '0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002046a7b0b12a6a01f08f738aca89682278e439c6f122febd0e8f86659f594f43ae',
        decoded: {
            hash: '0x46a7b0b12a6a01f08f738aca89682278e439c6f122febd0e8f86659f594f43ae'
        }
    },
    {
        data: '000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000005000000020072f3cd0fb1f55b05fc2022dfcffe2ab3f5f35eb661c22520b00000000000000ff3adfeb1f20aa198d665620a7d77e4d3d1ffdc44c1cbf8ca1ef13c9309d5a7bb1c36161ffff001dd6870fb600000000000000000000000000000000',
        decoded: {
            blocks: [
                '0x00000020072f3cd0fb1f55b05fc2022dfcffe2ab3f5f35eb661c22520b00000000000000ff3adfeb1f20aa198d665620a7d77e4d3d1ffdc44c1cbf8ca1ef13c9309d5a7bb1c36161ffff001dd6870fb6'
            ]
        }
    },
    {
        data: '0x00000000000000000000000000000000000000000000000000000000000f6f9a',
        decoded: {
            amount: '1011610'
        }
    },
    {
        data: '0x00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002c00000000000000000000000000000000000000000000000000000000000221b0000000000000000000000000000000000000000000000000000000000000000a5023f0283519167f1603ba92b060146baa054712b938a61f35605ba08773142f4da02afc230c2d355b1a577682b07bc2646041b5d0177af0f98395a46018da699b6da031174d64db12dc2dcdc8064a53a4981fa60f4ee649a954e01bcae221fc60777a20344a3c38cd59afcba3edcebe143e025574594b001700dec41e59409bdbd0f2a09039a060badbeb24bee49eb2063f616c0f0f0765d4ca646b20a88ce828f259fcdb90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000023324e31474d4238677848595235484c505352676639434a394c756e6a623943546e4b42000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a50208f40073a9e43b3e9103acec79767a6de9b0409749884e989960fee578012fce0225e892391625854128c5c4ea4340de0c2a70570f33db53426fc9c746597a03f402afc230c2d355b1a577682b07bc2646041b5d0177af0f98395a46018da699b6da0344a3c38cd59afcba3edcebe143e025574594b001700dec41e59409bdbd0f2a09039a060badbeb24bee49eb2063f616c0f0f0765d4ca646b20a88ce828f259fcdb90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000023324d77364b4d36343266626b7970547a626746693644546754465052575a55443442410000000000000000000000000000000000000000000000000000000000',
        decoded: {
            oldFederationBtcPublicKeys: '0x023f0283519167f1603ba92b060146baa054712b938a61f35605ba08773142f4da02afc230c2d355b1a577682b07bc2646041b5d0177af0f98395a46018da699b6da031174d64db12dc2dcdc8064a53a4981fa60f4ee649a954e01bcae221fc60777a20344a3c38cd59afcba3edcebe143e025574594b001700dec41e59409bdbd0f2a09039a060badbeb24bee49eb2063f616c0f0f0765d4ca646b20a88ce828f259fcdb9',
            oldFederationBtcAddress: '2N1GMB8gxHYR5HLPSRgf9CJ9Lunjb9CTnKB',
            newFederationBtcPublicKeys: '0x0208f40073a9e43b3e9103acec79767a6de9b0409749884e989960fee578012fce0225e892391625854128c5c4ea4340de0c2a70570f33db53426fc9c746597a03f402afc230c2d355b1a577682b07bc2646041b5d0177af0f98395a46018da699b6da0344a3c38cd59afcba3edcebe143e025574594b001700dec41e59409bdbd0f2a09039a060badbeb24bee49eb2063f616c0f0f0765d4ca646b20a88ce828f259fcdb9',
            newFederationBtcAddress: '2Mw6KM642fbkypTzbgFi6DTgTFPRWZUD4BA',
            activationHeight: '2235136'
        }
    },
    {
        data: '0x6b735fe7af1819082404d3d05133ceaba3ebfc400cdfd621261285e6b092371f',
        decoded: '0x6b735fe7af1819082404d3d05133ceaba3ebfc400cdfd621261285e6b092371f'
    },
    {
        data: '0x7cbbf9d911d8e76b2a3a4b02a430b39b0b5c3b95f3ee2ca5df1483980d960e0b',
        decoded: '0x7cbbf9d911d8e76b2a3a4b02a430b39b0b5c3b95f3ee2ca5df1483980d960e0b'
    },
    {
        data: '0x0000000000000000000000000000000000000000000000000000000000000040',
        decoded: {
            btcDestinationAddress: 'mhmWxtqj4oAgLkkyZs3impteLcn7csDuMq',
            amount: '1000000'
        }
    },
    {
        data: '0x00000000000000000000000075d7b75612ed7a0edc70ceced86a9701e8d07d6a',
        decoded: '0x75d7B75612Ed7A0eDc70ceCED86A9701E8D07D6a'
    }
];

function Contract (abi, address) {
    expect(abi).to.deep.equal(Bridge.abi);
    expect(address).to.equal(Bridge.address);
    return bridgeInstanceStub;
}

const web3ClientStub = {
    eth: ({
        getTransactionReceipt: (txHash) => {
            return txReceiptsStub.find(txReceipt => txReceipt.transactionHash === txHash);
        },
        getTransaction: (txHash) => {
            return transactionsStub.find(tx => tx.hash === txHash);
        },
        getBlock: (blockHashOrBlockNumber) => {
            return blocksStub.find(block => block.number === blockHashOrBlockNumber || block.hash === blockHashOrBlockNumber);
        },
        abi: ({
            decodeParameter: (type, data) => {
                return dataDecodedResults.find(result => result.data === data)?.decoded;
            },
            decodeParameters: (inputs, data) => {
                return dataDecodedResults.find(result => result.data === data)?.decoded;
            }
        }),
        Contract,
    })
};

describe('Constructor', () => {

    it('Should fail for invalid web3 client', async () => {
        const web3Client = null;
        expect(() => new BridgeTransactionParser(web3Client))
            .to.throw('web3Client is required');
    });

    it('Should create instance', async () => {
        const bridgeTransactionParser = new BridgeTransactionParser(web3ClientStub);
        assert.equal(bridgeTransactionParser.web3Client, web3ClientStub);
    });

});

describe('Get Bridge transaction by tx hash', () => {

    let bridgeTransactionParser;

    beforeEach(() => {
        bridgeTransactionParser = new BridgeTransactionParser(web3ClientStub);
    });

    it('Should fail for invalid transaction hash', async () => {
        const transactionHash = "0x12345";

        await expect(bridgeTransactionParser.getBridgeTransactionByTxHash(transactionHash))
            .to.be.rejectedWith('Hash must be of length 66 starting with "0x"');
    });

    it('Should return empty for non Bridge transaction hash', async () => {
        const txReceipt = txReceiptsStub[0];

        await expect(bridgeTransactionParser.getBridgeTransactionByTxHash(txReceipt.transactionHash)).to.be.empty;
    });

    it('Should verify and return Bridge transaction from tx hash', async () => {
        const txReceipt = txReceiptsStub[4];
        const block = web3ClientStub.eth.getBlock(txReceipt.blockNumber);
        const result = await bridgeTransactionParser.getBridgeTransactionByTxHash(
            txReceipt.transactionHash
        );

        assert.equal(result.txHash, txReceipt.transactionHash);
        assert.equal(result.sender, txReceipt.from);
        assert.equal(result.blockNumber, txReceipt.blockNumber);
        assert.equal(result.blockNumber, block.number);
        assert.equal(result.blockTimestamp, block.timestamp);

        assert.equal(result.method.name, "updateCollections");
        assert.equal(result.method.signature, "0x0c5a9990");

        assert.lengthOf(result.events, 3);
        assert.equal(result.events[0].name, "update_collections");
        assert.equal(result.events[0].signature, "0x1069152f4f916cbf155ee32a695d92258481944edb5b6fd649718fc1b43e515e");
        assert.equal(result.events[0].arguments.sender, '0xfe90f02331ddf62cb50f5650dca554b47b37c471');

        assert.equal(result.events[1].name, "release_requested");
        assert.equal(result.events[1].signature, "0x7a7c29481528ac8c2b2e93aee658fddd4dc15304fa723a5c2b88514557bcc790");
        assert.equal(result.events[1].arguments.rskTxHash, "0x6b735fe7af1819082404d3d05133ceaba3ebfc400cdfd621261285e6b092371f");
        assert.equal(result.events[1].arguments.btcTxHash, "0x7cbbf9d911d8e76b2a3a4b02a430b39b0b5c3b95f3ee2ca5df1483980d960e0b");
        assert.equal(result.events[1].arguments.amount, "1011610");

        assert.equal(result.events[2].name, "release_request_received");
        assert.equal(result.events[2].signature, "0x8e04e2f2c246a91202761c435d6a4971bdc7af0617f0c739d900ecd12a6d7266");
        assert.equal(result.events[2].arguments.sender, "0x75d7B75612Ed7A0eDc70ceCED86A9701E8D07D6a");
        assert.equal(result.events[2].arguments.btcDestinationAddress, "mhmWxtqj4oAgLkkyZs3impteLcn7csDuMq");
        assert.equal(result.events[2].arguments.amount, "1000000");
    });
})

describe('Get Bridge transactions from single block', () => {

    let bridgeTransactionParser;

    beforeEach(() => {
        bridgeTransactionParser = new BridgeTransactionParser(web3ClientStub);
    });

    it('Should fail for invalid block number', async () => {
        const blockNumber = 0;

        await expect(bridgeTransactionParser.getBridgeTransactionsInThisBlock(blockNumber))
            .to.be.rejectedWith('Block number must be greater than 0');
    });

    it('Should fail for inexisting block number', async () => {
        const blockNumber = 1000000;

        await expect(bridgeTransactionParser.getBridgeTransactionsInThisBlock(blockNumber))
            .to.be.rejectedWith(`Block ${blockNumber} not found`);
    });

    it('Should return empty for block without Bridge transactions', async () => {
        const block = blocksStub[1];
        const result = await bridgeTransactionParser.getBridgeTransactionsInThisBlock(block.number);

        assert.lengthOf(result, 0);
    });

    it('Should verify and return Bridge transactions from block', async () => {
        const block = blocksStub[0];
        const result = await bridgeTransactionParser.getBridgeTransactionsInThisBlock(
            block.number
        );

        assert.lengthOf(result, 2);
        assert.equal(result[0].txHash, block.transactions[0]);
        assert.equal(result[1].txHash, block.transactions[3]);
    });
})

describe('Get Bridge transactions from multiple blocks', () => {

    let bridgeTransactionParser;

    beforeEach(() => {
        bridgeTransactionParser = new BridgeTransactionParser(web3ClientStub);
    });

    it('Should fail for invalid start block number', async () => {
        const startingBlockNumber1 = 0;
        const blocksToSearch1 = 5;
        await expect(bridgeTransactionParser.getBridgeTransactionsSinceThisBlock(startingBlockNumber1, blocksToSearch1))
            .to.be.rejectedWith('Block number must be greater than 0');

        const startingBlockNumber2 = 3701647;
        const blocksToSearch2 = 101;
        await expect(bridgeTransactionParser.getBridgeTransactionsSinceThisBlock(startingBlockNumber2, blocksToSearch2))
            .to.be.rejectedWith('blocksToSearch must be greater than 0 or less than 100');
    });

    it('Should verify and return Bridge transactions from blocks', async () => {
        const startingBlockNumber = 1001;
        const blocksToSearch = 3;
        const result = await bridgeTransactionParser.getBridgeTransactionsSinceThisBlock(startingBlockNumber, blocksToSearch);

        assert.lengthOf(result, 3);
        assert.equal(result[0].txHash, blocksStub[0].transactions[0]);
        assert.equal(result[1].txHash, blocksStub[0].transactions[3]);
        assert.equal(result[2].txHash, blocksStub[2].transactions[0]);
    });
});

describe('Gets a Bridge Transaction given a web3 transaction: web3TransactionObject and a bridgeTxReceipt: TransactionReceipt', () => {

    let bridgeTransactionParser;

    beforeEach(() => {
        bridgeTransactionParser = new BridgeTransactionParser(web3ClientStub);
    });

    it('Should fail when BridgeTx and BridgeTxReceipt have different transaction hashes', async () => {
        const bridgeTx = web3ClientStub.eth.getTransaction("0x7a3c39f59e1f2c624602c9b54c28155a251963ec878049c0f78a7d281b2e3b87");
        const bridgeTxReceipt = web3ClientStub.eth.getTransactionReceipt("0x112439355294e02096078c3b77cb12546fe79d284f46d478b3584873c2bacb8b");
        await expect(bridgeTransactionParser.decodeBridgeTransaction(bridgeTx, bridgeTxReceipt))
          .to.be.rejectedWith(`Given bridgeTx(${bridgeTx.hash}) and bridgeTxReceipt(${bridgeTxReceipt.transactionHash}) should belong to the same transaction.`);
    });

    it('Should fail when passing a non bridgeTxReceipt', async () => {
        const bridgeTx = web3ClientStub.eth.getTransaction("0x6547e88a30d1b43c6fbea07fa7443dfeb697d076495c3e4fc56ebf40228e0431");
        const nonBridgeTxReceipt = web3ClientStub.eth.getTransactionReceipt("0x6547e88a30d1b43c6fbea07fa7443dfeb697d076495c3e4fc56ebf40228e0431");

        await expect(bridgeTransactionParser.decodeBridgeTransaction(bridgeTx, nonBridgeTxReceipt))
          .to.be.rejectedWith(`Given bridgeTxReceipt is not a bridge transaction`);
    });

    it('Should decode a bridge transaction from a bridgeTx web3Object and a bridgeTxReceipt as well as a web3Object' +
      'into a Transaction object', async () => {
        const bridgeTx = web3ClientStub.eth.getTransaction("0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7");
        const bridgeTxReceipt = web3ClientStub.eth.getTransactionReceipt("0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7");

        const transaction = await bridgeTransactionParser.decodeBridgeTransaction(bridgeTx, bridgeTxReceipt)

        assert.equal(transaction.txHash, bridgeTxReceipt.transactionHash);
        assert.equal(transaction.blockNumber, bridgeTxReceipt.blockNumber);

        assert.equal(transaction.method.name, "updateCollections");
        assert.equal(transaction.method.signature, "0x0c5a9990");

        assert.lengthOf(transaction.events, 3);
        assert.equal(transaction.events[0].name, "update_collections");
        assert.equal(transaction.events[0].signature, "0x1069152f4f916cbf155ee32a695d92258481944edb5b6fd649718fc1b43e515e");
        assert.equal(transaction.events[0].arguments.sender, '0xfe90f02331ddf62cb50f5650dca554b47b37c471');

        assert.equal(transaction.events[1].name, "release_requested");
        assert.equal(transaction.events[1].signature, "0x7a7c29481528ac8c2b2e93aee658fddd4dc15304fa723a5c2b88514557bcc790");
        assert.equal(transaction.events[1].arguments.rskTxHash, "0x6b735fe7af1819082404d3d05133ceaba3ebfc400cdfd621261285e6b092371f");
        assert.equal(transaction.events[1].arguments.btcTxHash, "0x7cbbf9d911d8e76b2a3a4b02a430b39b0b5c3b95f3ee2ca5df1483980d960e0b");
        assert.equal(transaction.events[1].arguments.amount, "1011610");

        assert.equal(transaction.events[2].name, "release_request_received");
        assert.equal(transaction.events[2].signature, "0x8e04e2f2c246a91202761c435d6a4971bdc7af0617f0c739d900ecd12a6d7266");
        assert.equal(transaction.events[2].arguments.sender, "0x75d7B75612Ed7A0eDc70ceCED86A9701E8D07D6a");
        assert.equal(transaction.events[2].arguments.btcDestinationAddress, "mhmWxtqj4oAgLkkyZs3impteLcn7csDuMq");
        assert.equal(transaction.events[2].arguments.amount, "1000000");
    });
})
