const chai = require('chai')
const assert = chai.assert;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const {expect} = chai;

const sinon = require('sinon');
const rewire = require('rewire');

const bridgeInstanceStub = {
    _address: '0x0000000000000000000000000000000001000006',
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

const bridgeStub = {
    build: () => {
        return bridgeInstanceStub
    },
    address: '0x0000000000000000000000000000000001000006',
    abi: [
        {
            name: 'updateCollections',
            inputs: [],
            signature: '0x0c5a9990'
        },
        {
            name: 'commitFederation',
            inputs: [
                {
                    name: 'hash',
                    type: 'bytes'
                }
            ],
            signature: '0x1533330f'
        }
    ]
}

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
        to: '0x39192498fcf1dbe11653040bb49308e09a1056ac'
    },
    {
        transactionHash: '0x7f6c029fba670f1ee14729e5531c672e813ac1ef4c86dec313b090119c14fa78',
        blockNumber: 1002,
        logs: [],
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
        transactionHash: '0x112439355294e02096078c3b77cb12546fe79d284f46d478b3584873c2bacb8b',
        input: '0x1533330f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002046a7b0b12a6a01f08f738aca89682278e439c6f122febd0e8f86659f594f43ae'
    },
    {
        transactionHash: '0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7',
        input: '0x0c5a9990'
    },
    {
        transactionHash: '0x7a3c39f59e1f2c624602c9b54c28155a251963ec878049c0f78a7d281b2e3b87',
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
        ]
    },
    {
        number: 1002,
        hash: '0xcdc8e7d4d5417ae5a36c6c246fa34df2ec0ebc9056055eeea401dc95e85e98f1',
        transactions: [
            '0x719715d6dc0617b6495d74aa4aa21b0755057ef6ad7cdcb71bdffcc2b3af4b24' // Not bridge transaction
        ]
    },
    {
        number: 1003,
        hash: '0x5f4da1a8bc0f04fd1bca304cbfca19bbf618307a8855bfd71841428a83474f20',
        transactions: [
            '0x7a3c39f59e1f2c624602c9b54c28155a251963ec878049c0f78a7d281b2e3b87' // Bridge transaction
        ]
    }
]

const dataDecodedResults = [
    {
        data: '0x000000000000000000000000fe90f02331ddf62cb50f5650dca554b47b37c471',
        decoded: {
            sender: '0xFE90f02331DdF62cb50F5650Dca554b47B37c471'
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
            btcDestinationAddress: '0x18b158a6d893d72092ac9b9f8bbb5bf2c22acf76',
            amount: '1000000'
        }
    },
    {
        data: '0x00000000000000000000000075d7b75612ed7a0edc70ceced86a9701e8d07d6a',
        decoded: '0x75d7B75612Ed7A0eDc70ceCED86A9701E8D07D6a'
    }
]

const web3ClientStub = {
    eth: ({
        getTransactionReceipt: (txHash) => {
            return txReceiptsStub.find(txReceipt => txReceipt.transactionHash === txHash);
        },
        getTransaction: (txHash) => {
            return transactionsStub.find(tx => tx.transactionHash === txHash);
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
        })
    })
};

let transactionParser;
let sandbox;
const network = "testnet";

describe('Get Bridge Transaction By Tx Hash', () => {

    beforeEach((done) => {
        transactionParser = rewire('../index');
        transactionParser.__set__({
            'Bridge': bridgeStub
        });
        sandbox = sinon.createSandbox();
        done();
    });

    afterEach((done) => {
        sandbox.restore();
        done();
    });

    it('Should Fail For Invalid Transaction Hash', async () => {
        const transactionHash = "0x12345";

        await expect(transactionParser.getBridgeTransactionByTxHash(web3ClientStub, transactionHash, network))
            .to.be.rejectedWith('Hash must be of length 66 starting with "0x"');
    });

    it('Should return empty for non Bridge transaction hash', async () => {
        const txReceipt = txReceiptsStub[0];

        await expect(transactionParser.getBridgeTransactionByTxHash(web3ClientStub, txReceipt.transactionHash, network)).to.be.empty;
    });

    it('Should Verify And Return Bridge Transaction From Tx Hash', async () => {
        let txReceipt = txReceiptsStub[4];
        let result = await transactionParser.getBridgeTransactionByTxHash(web3ClientStub, txReceipt.transactionHash, network);

        assert.equal(result.txHash, txReceipt.transactionHash);
        assert.equal(result.blockNumber, txReceipt.blockNumber);

        assert.equal(result.method.name, "updateCollections");
        assert.equal(result.method.signature, "0x0c5a9990");

        assert.lengthOf(result.events, 3);
        assert.equal(result.events[0].name, "update_collections");
        assert.equal(result.events[0].signature, "0x1069152f4f916cbf155ee32a695d92258481944edb5b6fd649718fc1b43e515e");
        assert.equal(result.events[0].arguments.get('sender'), '0xFE90f02331DdF62cb50F5650Dca554b47B37c471');

        assert.equal(result.events[1].name, "release_requested");
        assert.equal(result.events[1].signature, "0x7a7c29481528ac8c2b2e93aee658fddd4dc15304fa723a5c2b88514557bcc790");
        assert.equal(result.events[1].arguments.get('rskTxHash'), "0x6b735fe7af1819082404d3d05133ceaba3ebfc400cdfd621261285e6b092371f");
        assert.equal(result.events[1].arguments.get('btcTxHash'), "0x7cbbf9d911d8e76b2a3a4b02a430b39b0b5c3b95f3ee2ca5df1483980d960e0b");
        assert.equal(result.events[1].arguments.get('amount'), "1011610");

        assert.equal(result.events[2].name, "release_request_received");
        assert.equal(result.events[2].signature, "0x8e04e2f2c246a91202761c435d6a4971bdc7af0617f0c739d900ecd12a6d7266");
        assert.equal(result.events[2].arguments.get('sender'), "0x75d7B75612Ed7A0eDc70ceCED86A9701E8D07D6a");
        assert.equal(result.events[2].arguments.get('btcDestinationAddress'), "mhmWxtqj4oAgLkkyZs3impteLcn7csDuMq");
        assert.equal(result.events[2].arguments.get('amount'), "1000000");
    });
})

describe('Get Bridge Transactions From Single Block', () => {

    beforeEach((done) => {
        transactionParser = rewire('../index');
        transactionParser.__set__({
            'Bridge': bridgeStub
        });
        sandbox = sinon.createSandbox();
        done();
    });

    afterEach((done) => {
        sandbox.restore();
        done();
    });

    it('Should Fail For Invalid Block Number', async () => {
        const blockNumber = 0;

        await expect(transactionParser.getBridgeTransactionsInThisBlock(web3ClientStub, blockNumber, network))
            .to.be.rejectedWith('Block number must be greater than 0');
    });

    it('Should fail for inexisting block number', async () => {
        const blockNumber = 1000000;

        await expect(transactionParser.getBridgeTransactionsInThisBlock(web3ClientStub, blockNumber, network))
            .to.be.rejectedWith(`Block ${blockNumber} not found`);
    });

    it('Should return empty for block without Bridge transactions', async () => {
        let block = blocksStub[1];
        let result = await transactionParser.getBridgeTransactionsInThisBlock(web3ClientStub, block.number, network);

        assert.lengthOf(result, 0);
    });

    it('Should Verify And Return Bridge Transactions From Block', async () => {
        let block = blocksStub[0];
        let result = await transactionParser.getBridgeTransactionsInThisBlock(web3ClientStub, block.number, network);

        assert.lengthOf(result, 2);
        assert.equal(result[0].txHash, block.transactions[0]);
        assert.equal(result[1].txHash, block.transactions[3]);
    });
})

describe('Get Bridge Transactions From Multiple Blocks', () => {

    beforeEach((done) => {
        transactionParser = rewire('../index');
        transactionParser.__set__({
            'Bridge': bridgeStub
        });
        sandbox = sinon.createSandbox();
        done();
    });

    afterEach((done) => {
        sandbox.restore();
        done();
    });

    it('Should Fail For Invalid Start Block Number', async () => {
        let startingBlock = 0;
        let blocksToSearch = 5;
        await expect(transactionParser.getBridgeTransactionsSinceThisBlock(web3ClientStub, startingBlock, blocksToSearch, network))
            .to.be.rejectedWith('Block number must be greater than 0');

        startingBlock = 3701647;
        blocksToSearch = 101;
        await expect(transactionParser.getBridgeTransactionsSinceThisBlock(web3ClientStub, startingBlock, blocksToSearch, network))
            .to.be.rejectedWith('blocksToSearch must be greater than 0 or less than 100');
    });

    it('Should Verify And Return Bridge Transactions From Blocks', async () => {
        const startingBlockNumber = 1001;
        const blocksToSearch = 3;
        let result = await transactionParser.getBridgeTransactionsSinceThisBlock(web3ClientStub, startingBlockNumber, blocksToSearch, network);

        assert.lengthOf(result, 3);
        assert.equal(result[0].txHash, blocksStub[0].transactions[0]);
        assert.equal(result[1].txHash, blocksStub[0].transactions[3]);
        assert.equal(result[2].txHash, blocksStub[2].transactions[0]);
    });
});
