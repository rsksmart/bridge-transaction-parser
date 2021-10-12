const chai = require('chai')
const assert = chai.assert
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const {expect} = chai

const sinon = require('sinon');
const rewire = require('rewire');

const bridgeInstanceStub = {
    _address: '0x0000000000000000000000000000000001000006',
    _jsonInterface:
        [
            {
                name: 'updateCollections',
                type: 'function',
                constant: false,
                inputs: [],
                outputs: [],
                signature: '0x0c5a9990'
            },
            {
                anonymous: false,
                inputs: [{indexed: false, name: 'sender', type: 'address'}],
                name: 'update_collections',
                type: 'event',
                signature: '0x1069152f4f916cbf155ee32a695d92258481944edb5b6fd649718fc1b43e515e'
            }
        ]
};

const bridgeStub = {
    build: () => {
        return bridgeInstanceStub
    },
    address: "0x0000000000000000000000000000000001000006"
}

const txReceipt = {
    transactionHash: '0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7',
    transactionIndex: 4,
    blockHash: '0x74cdc98cd3f98fa85cecc749ce832f9f89bfb5ed9aacccea8fc4aa1d2792ec35',
    blockNumber: 3701647,
    logs: [
        {
            logIndex: 0,
            blockNumber: 3701647,
            blockHash: '0x74cdc98cd3f98fa85cecc749ce832f9f89bfb5ed9aacccea8fc4aa1d2792ec35',
            transactionHash: '0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7',
            transactionIndex: 4,
            address: '0x0000000000000000000000000000000001000006',
            data: '0x000000000000000000000000fe90f02331ddf62cb50f5650dca554b47b37c471',
            topics: ['0x1069152f4f916cbf155ee32a695d92258481944edb5b6fd649718fc1b43e515e'],
            id: 'log_ed85b806'
        },
        {
            logIndex: 1,
            blockNumber: 3701647,
            blockHash: '0x74cdc98cd3f98fa85cecc749ce832f9f89bfb5ed9aacccea8fc4aa1d2792ec35',
            transactionHash: '0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7',
            transactionIndex: 4,
            address: '0x0000000000000000000000000000000001000006',
            data: '0x00000000000000000000000000000000000000000000000000000000000f6f9a',
            topics: ['0x7a7c29481528ac8c2b2e93aee658fddd4dc15304fa723a5c2b88514557bcc790',
                '0x6b735fe7af1819082404d3d05133ceaba3ebfc400cdfd621261285e6b092371f',
                '0x7cbbf9d911d8e76b2a3a4b02a430b39b0b5c3b95f3ee2ca5df1483980d960e0b'],
            id: 'log_4410149c'
        }
    ],
    from: '0xfe90f02331ddf62cb50f5650dca554b47b37c471',
    to: '0x0000000000000000000000000000000001000006'
};

const dataDecodedResult = {
    '0': '0xFE90f02331DdF62cb50F5650Dca554b47B37c471',
    "__length__": 1,
    "sender": '0xFE90f02331DdF62cb50F5650Dca554b47B37c471'
};

const web3ClientStub = {
    eth: ({
        getTransactionReceipt: () => {
            return txReceipt;
        },
        getTransaction: () => {
            return {input: "0x0c5a9990"};
        },
        getBlock: () => {
            return block;
        },
        abi: ({
            decodeParameter: () => {
                return "0x6b735fe7af1819082404d3d05133ceaba3ebfc400cdfd621261285e6b092371f";
            },
            decodeParameters: () => {
                return dataDecodedResult;
            }
        })
    })
};

const block = {
    number: 3701647,
    hash: '0x74cdc98cd3f98fa85cecc749ce832f9f89bfb5ed9aacccea8fc4aa1d2792ec35',
    parentHash: '0x1d4c35928726683dc8317067f526fa3accb11f7b1175d9f6cb3269e7da20e8f7',
    transactions: ['0x79d196f45e9d4c37c43e7482c667710e857fc2c2c79cf55ed955e89c5dcf085e',
        '0x454273e4a18690119e92a020cccae82f2c35b218cc63420e14eb144a7bc90e68']
}

let transactionParser;
let sandbox;

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

        await expect(transactionParser.getBridgeTransactionByTxHash(web3ClientStub, transactionHash))
            .to.be.rejectedWith('Hash must be of length 66 starting with "0x"');
    });

    it('Should Verify And Return Bridge Transaction From TX Hash', async () => {
        const transactionHash = "0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7";
        let result = await transactionParser.getBridgeTransactionByTxHash(web3ClientStub, transactionHash);

        assert.equal(result.txHash, transactionHash)
        assert.equal(result.method.name, "updateCollections")
        assert.equal(result.method.signature, "0x0c5a9990")
        assert.lengthOf(result.events, 1)
        assert.equal(result.events[0].name, "update_collections")
        assert.equal(result.events[0].signature, "0x1069152f4f916cbf155ee32a695d92258481944edb5b6fd649718fc1b43e515e")
        assert.lengthOf(result.events[0].arguments, 1)
        assert.deepEqual(result.events[0].arguments, ['sender: 0xFE90f02331DdF62cb50F5650Dca554b47B37c471'])
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

        await expect(transactionParser.getBridgeTransactionsInThisBlock(web3ClientStub, blockNumber))
            .to.be.rejectedWith('Block number must be greater than 0');

    });

    it('Should Verify And Return Bridge Transactions From Block', async () => {
        const expectedTxHash = "0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7";
        const blockNumber = 3701647;
        let result = await transactionParser.getBridgeTransactionsInThisBlock(web3ClientStub, blockNumber);
        assert.lengthOf(result, 2)
        assert.equal(result[0].txHash, expectedTxHash);
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
        await expect(transactionParser.getBridgeTransactionsSinceThisBlock(web3ClientStub, startingBlock, blocksToSearch))
            .to.be.rejectedWith('Block number must be greater than 0');

        startingBlock = 3701647;
        blocksToSearch = 101;
        await expect(transactionParser.getBridgeTransactionsSinceThisBlock(web3ClientStub, startingBlock, blocksToSearch))
            .to.be.rejectedWith('blocksToSearch must be greater than 0 or less than 100');

    });

    it('Should Verify And Return Bridge Transactions From Blocks', async () => {
        const expectedTxHash = "0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7";
        const startingBlockHash = "0x74cdc98cd3f98fa85cecc749ce832f9f89bfb5ed9aacccea8fc4aa1d2792ec35";
        const blocksToSearch = 5;
        let result = await transactionParser.getBridgeTransactionsSinceThisBlock(web3ClientStub, startingBlockHash, blocksToSearch);
        assert.lengthOf(result, 5)
        assert.lengthOf(result[0], 2)
        assert.equal(result[0][1].txHash, expectedTxHash);
    });

})
