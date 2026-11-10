const chai = require('chai');
const BridgeTransactionParser = require('../index');
const {txReceiptsStub, blocksStub} = require("./blockchain-stubs.util");
const { rskClient } = require("./ethers-js-stub.util");
const { assert, expect } = chai;

describe('Constructor', () => {

    it('Should fail for invalid rsk client', async () => {
        const rskClient = null;
        expect(() => new BridgeTransactionParser(rskClient))
            .to.throw('rskClient is required');
    });

    it('Should create instance', async () => {
        const bridgeTransactionParser = new BridgeTransactionParser(rskClient);
        assert.equal(bridgeTransactionParser.rskClient, rskClient);
    });

});

describe('Get Bridge transaction by tx hash', () => {

    let bridgeTransactionParser;

    beforeEach(() => {
        bridgeTransactionParser = new BridgeTransactionParser(rskClient);
    });

    it('Should fail for invalid transaction hash', async () => {
        const transactionHash = "0x12345";

        await expect(bridgeTransactionParser.getBridgeTransactionByTxHash(transactionHash))
            .to.be.rejectedWith('Hash must be of length 66 starting with "0x"');
    });

    it('Should return empty for non Bridge transaction hash', async () => {
        const txReceipt = txReceiptsStub[0];

        await expect(bridgeTransactionParser.getBridgeTransactionByTxHash(txReceipt.hash)).to.be.empty;
    });

    it('Should return empty when transaction receipt is not found', async () => {
        const transactionHash = '0x0000000000000000000000000000000000000000000000000000000000000001';

        await expect(bridgeTransactionParser.getBridgeTransactionByTxHash(transactionHash)).to.be.empty;
    });

    it('Should verify and return Bridge transaction from tx hash', async () => {
        const txReceipt = txReceiptsStub[4];
        const block = await rskClient.getBlock(txReceipt.blockNumber);
        const result = await bridgeTransactionParser.getBridgeTransactionByTxHash(
            txReceipt.hash
        );

        assert.equal(result.txHash, txReceipt.hash);
        assert.equal(result.sender, txReceipt.from);
        assert.equal(result.blockNumber, txReceipt.blockNumber);
        assert.equal(result.blockNumber, block.number);
        assert.equal(result.blockTimestamp, block.timestamp);

        assert.equal(result.method.name, "updateCollections");
        assert.equal(result.method.signature, "0x0c5a9990");

        assert.lengthOf(result.events, 4);
        assert.equal(result.events[0].name, "update_collections");
        assert.equal(result.events[0].signature, "0x1069152f4f916cbf155ee32a695d92258481944edb5b6fd649718fc1b43e515e");
        assert.equal(result.events[0].arguments.sender, '0x2CCA2fd0357eA3d37DBf22AA1926073B0aEf470e');

        assert.equal(result.events[1].name, "release_requested");
        assert.equal(result.events[1].signature, "0x7a7c29481528ac8c2b2e93aee658fddd4dc15304fa723a5c2b88514557bcc790");
        assert.equal(result.events[1].arguments.rskTxHash, "0x95aacdc901a82814f387d0b2ecb70bbc8479947c7420baccff421873c7f9d061");
        assert.equal(result.events[1].arguments.btcTxHash, "0x4e89c19c81fa6d99a623108ff91d205ec09ef80cf45764390533018ba81935a9");
        assert.equal(result.events[1].arguments.amount, "500000");

        assert.equal(result.events[2].name, "pegout_transaction_created");
        assert.equal(result.events[2].signature, "0x9ee5d520fd5e6eaea3fd2e3ae4e35e9a9c0fb05c9d8f84b507f287da84b5117c");
        assert.equal(result.events[2].arguments.btcTxHash, "0x4e89c19c81fa6d99a623108ff91d205ec09ef80cf45764390533018ba81935a9");
        assert.equal(result.events[2].arguments.utxoOutpointValues, "0xfda8f7fe20a10700");

        assert.equal(result.events[3].name, "batch_pegout_created");
        assert.equal(result.events[3].signature, "0x483d0191cc4e784b04a41f6c4801a0766b43b1fdd0b9e3e6bfdca74e5b05c2eb");
        assert.equal(result.events[3].arguments.btcTxHash, "0x4e89c19c81fa6d99a623108ff91d205ec09ef80cf45764390533018ba81935a9");
        assert.equal(result.events[3].arguments.releaseRskTxHashes, "0xdde4dd54901569f5e0ca993f7158c676e02e61a550af73c5e83a95fcefde4671");
    });
})

describe('Get Bridge transactions from single block', () => {

    let bridgeTransactionParser;

    beforeEach(() => {
        bridgeTransactionParser = new BridgeTransactionParser(rskClient);
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
        bridgeTransactionParser = new BridgeTransactionParser(rskClient);
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

    it('Should retry RPC calls that time out and return Bridge transactions from blocks', async () => {
        const timeoutOnFirstCall = method => {
            let called = false;
            return async (...args) => {
                if (!called) {
                    called = true;
                    throw Object.assign(new Error('request timeout'), {code: 'TIMEOUT'});
                }
                return method(...args);
            };
        };
        const flakyRskClient = {
            ...rskClient,
            getBlock: timeoutOnFirstCall(rskClient.getBlock),
            getTransactionReceipt: timeoutOnFirstCall(rskClient.getTransactionReceipt),
            getTransaction: timeoutOnFirstCall(rskClient.getTransaction)
        };
        const flakyParser = new BridgeTransactionParser(flakyRskClient);

        const result = await flakyParser.getBridgeTransactionsSinceThisBlock(1001, 3);

        assert.lengthOf(result, 3);
        assert.equal(result[0].txHash, blocksStub[0].transactions[0]);
        assert.equal(result[1].txHash, blocksStub[0].transactions[3]);
        assert.equal(result[2].txHash, blocksStub[2].transactions[0]);
    });
});

describe('Gets a Bridge Transaction given a transaction: TransactionRequest and a bridgeTxReceipt: TransactionReceipt', () => {

    let bridgeTransactionParser;

    beforeEach(() => {
        bridgeTransactionParser = new BridgeTransactionParser(rskClient);
    });

    it('Should fail when BridgeTx and BridgeTxReceipt have different transaction hashes', async () => {
        const bridgeTx = await rskClient.getTransaction("0x7a3c39f59e1f2c624602c9b54c28155a251963ec878049c0f78a7d281b2e3b87");
        const bridgeTxReceipt = await rskClient.getTransactionReceipt("0x112439355294e02096078c3b77cb12546fe79d284f46d478b3584873c2bacb8b");
        await expect(bridgeTransactionParser.decodeBridgeTransaction(bridgeTx, bridgeTxReceipt))
          .to.be.rejectedWith(`Given bridgeTx(${bridgeTx.hash}) and bridgeTxReceipt(${bridgeTxReceipt.hash}) should belong to the same transaction.`);
    });

    it('Should fail when passing a non bridgeTxReceipt', async () => {
        const bridgeTx = rskClient.getTransaction("0x6547e88a30d1b43c6fbea07fa7443dfeb697d076495c3e4fc56ebf40228e0431");
        const nonBridgeTxReceipt = rskClient.getTransactionReceipt("0x6547e88a30d1b43c6fbea07fa7443dfeb697d076495c3e4fc56ebf40228e0431");

        await expect(bridgeTransactionParser.decodeBridgeTransaction(bridgeTx, nonBridgeTxReceipt))
          .to.be.rejectedWith(`Given bridgeTxReceipt is not a bridge transaction`);
    });

    it('Should decode a bridge transaction from a bridgeTx and a bridgeTxReceipt into a Transaction object', async () => {
        const bridgeTx = await rskClient.getTransaction("0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7");
        const bridgeTxReceipt = await rskClient.getTransactionReceipt("0x73a4d1592c5e922c2c6820985982d2715538717e4b4b52502685bc4c924300b7");

        const transaction = await bridgeTransactionParser.decodeBridgeTransaction(bridgeTx, bridgeTxReceipt);

        assert.equal(transaction.txHash, bridgeTxReceipt.hash);
        assert.equal(transaction.blockNumber, bridgeTxReceipt.blockNumber);

        assert.equal(transaction.method.name, "updateCollections");
        assert.equal(transaction.method.signature, "0x0c5a9990");

        assert.lengthOf(transaction.events, 4);
        assert.equal(transaction.events[0].name, "update_collections");
        assert.equal(transaction.events[0].signature, "0x1069152f4f916cbf155ee32a695d92258481944edb5b6fd649718fc1b43e515e");
        assert.equal(transaction.events[0].arguments.sender, '0x2CCA2fd0357eA3d37DBf22AA1926073B0aEf470e');

        assert.equal(transaction.events[1].name, "release_requested");
        assert.equal(transaction.events[1].signature, "0x7a7c29481528ac8c2b2e93aee658fddd4dc15304fa723a5c2b88514557bcc790");
        assert.equal(transaction.events[1].arguments.rskTxHash, "0x95aacdc901a82814f387d0b2ecb70bbc8479947c7420baccff421873c7f9d061");
        assert.equal(transaction.events[1].arguments.btcTxHash, "0x4e89c19c81fa6d99a623108ff91d205ec09ef80cf45764390533018ba81935a9");
        assert.equal(transaction.events[1].arguments.amount, "500000");

        assert.equal(transaction.events[2].name, "pegout_transaction_created");
        assert.equal(transaction.events[2].signature, "0x9ee5d520fd5e6eaea3fd2e3ae4e35e9a9c0fb05c9d8f84b507f287da84b5117c");
        assert.equal(transaction.events[2].arguments.btcTxHash, "0x4e89c19c81fa6d99a623108ff91d205ec09ef80cf45764390533018ba81935a9");
        assert.equal(transaction.events[2].arguments.utxoOutpointValues, "0xfda8f7fe20a10700");

        assert.equal(transaction.events[3].name, "batch_pegout_created");
        assert.equal(transaction.events[3].signature, "0x483d0191cc4e784b04a41f6c4801a0766b43b1fdd0b9e3e6bfdca74e5b05c2eb");
        assert.equal(transaction.events[3].arguments.btcTxHash, "0x4e89c19c81fa6d99a623108ff91d205ec09ef80cf45764390533018ba81935a9");
        assert.equal(transaction.events[3].arguments.releaseRskTxHashes, "0xdde4dd54901569f5e0ca993f7158c676e02e61a550af73c5e83a95fcefde4671");
    });

    it('Should decode registerPegoutTransaction with utxos_registered and flyover_utxos_registered events', async () => {
        const btcTxHash = "0x1f789f91cb5cb6f76b63ea7c9f5b6f3e2c6b0b3c1a5f1c0d3c3c1e4f0c2b7a91";
        const federationBtcAddress = "2N5muMepJizJE1gR7FbHJU6CD18V3BpNF9p";
        const txReceipt = txReceiptsStub.find(r => r.blockNumber === 1007);

        const result = await bridgeTransactionParser.getBridgeTransactionByTxHash(txReceipt.hash);

        assert.equal(result.txHash, txReceipt.hash);
        assert.equal(result.blockNumber, 1007);

        assert.equal(result.method.name, "registerPegoutTransaction");
        assert.equal(result.method.signature, "0x0659b289");
        assert.equal(result.method.arguments.btcTxHash, btcTxHash);
        assert.equal(result.method.arguments.height, "4900123");
        assert.equal(result.method.arguments.pmt, "0x03000000014f2c");

        assert.lengthOf(result.events, 2);

        assert.equal(result.events[0].name, "utxos_registered");
        assert.equal(result.events[0].signature, "0x40f138c58f8f169ae233157af32d9cdc98f3a8cd01ceec7a73e6f0d6595faeb2");
        assert.equal(result.events[0].arguments.btcTxHash, btcTxHash);
        assert.equal(result.events[0].arguments.outputValues, "0x80969800");
        assert.equal(result.events[0].arguments.outputIndexes, "0x01");
        assert.equal(result.events[0].arguments.federationBtcAddress, federationBtcAddress);

        assert.equal(result.events[1].name, "flyover_utxos_registered");
        assert.equal(result.events[1].signature, "0xc6f7277a987c9b19fe10535b804eeee9da1cba3eb7944ea6714b371c62e3f023");
        assert.equal(result.events[1].arguments.btcTxHash, btcTxHash);
        assert.equal(result.events[1].arguments.outputValues, "0x40420f00");
        assert.equal(result.events[1].arguments.outputIndexes, "0x02");
        assert.equal(result.events[1].arguments.federationBtcAddress, federationBtcAddress);
        assert.equal(result.events[1].arguments.flyoverDerivationHash, "0x4c3d8b2a1e6f7c9d0b5a4e3f2d1c0b9a8f7e6d5c4b3a29180f1e2d3c4b5a6978");
    });
})
