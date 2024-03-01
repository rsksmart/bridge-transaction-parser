const RLP = require('rlp');
const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const verifyHashOrBlockNumber = (blockHashOrBlockNumber) => {
    if (typeof blockHashOrBlockNumber === 'string' &&
        blockHashOrBlockNumber.indexOf('0x') === 0 &&
        blockHashOrBlockNumber.length !== 66) {
        throw new Error('Hash must be of length 66 starting with "0x"');
    } else if (isNaN(blockHashOrBlockNumber) || blockHashOrBlockNumber <= 0) {
        throw new Error('Block number must be greater than 0');
    }
};

const bridgeStateKeysToStorageIndexMap = {
    newFederationBtcUTXOs: { label: 'newFederationBtcUTXOs', bytes: '0x00000000000000000000006e657746656465726174696f6e4274635554584f73' },
    oldFederationBtcUTXOs: { label: 'oldFederationBtcUTXOs', bytes: '0x00000000000000000000006f6c6446656465726174696f6e4274635554584f73' },
    releaseRequestQueue: { label: 'pegoutRequests', bytes: '0x0000000000000000000000000072656c65617365526571756573745175657565'},
    releaseRequestQueueWithTxHash: { label: 'pegoutRequests', bytes: '0x00000072656c6561736552657175657374517565756557697468547848617368'},
    releaseTransactionSet: { label: 'pegoutsWaitingForConfirmations', bytes: '0x000000000000000000000072656c656173655472616e73616374696f6e536574' }, // 
    releaseTransactionSetWithTxHash: { label: 'pegoutsWaitingForConfirmations', bytes: '0x0072656c656173655472616e73616374696f6e53657457697468547848617368' },
    rskTxsWaitingFS: { label: 'pegoutsWaitingForSignatures', bytes: '0x000000000000000000000000000000000072736b54787357616974696e674653'},
    lockingCap: { label: 'lockingCap', bytes: '0x000000000000000000000000000000000000000000006c6f636b696e67436170' },
    nextPegoutHeight: { label: 'nextPegoutHeight', bytes: '0x000000000000000000000000000000006e6578745065676f7574486569676874' },
    newFederation: { label: 'newFederation', bytes: '0x000000000000000000000000000000000000006e657746656465726174696f6e' },
};

const PEGOUT_EVENTS = {
    release_request_rejected: 'release_request_rejected',
    release_request_received: 'release_request_received',
    release_requested: 'release_requested',
    batch_pegout_created: 'batch_pegout_created',
    pegout_confirmed: 'pegout_confirmed',
    add_signature: 'add_signature',
    release_btc: 'release_btc',
};

const removeEmptyLeftBytes = (storageValue) => {
    return `0x${storageValue.replaceAll(/^0x0+/g, '')}`;
};

const bytesToHexString = (bytes) => {
    return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
};

const decodeRlp = (rlpEncoded) => {
    const uint8ArrayDecoded = RLP.decode(rlpEncoded);
    const bytesStr = bytesToHexString(uint8ArrayDecoded);
    return bytesStr;
};

const bytesStrToNumber = (bytesStr) => {
    return parseInt(bytesStr, 16);
};

const  getBridgeStorageValueDecodedHexString = (bridgeStorageValueEncodedAsRlp, append0xPrefix = true) => {
    const rlpBytesWithoutEmptyBytes = removeEmptyLeftBytes(bridgeStorageValueEncodedAsRlp);
    const decodedHexFromRlp = decodeRlp(rlpBytesWithoutEmptyBytes);
    return append0xPrefix ? `0x${decodedHexFromRlp}` : decodedHexFromRlp;
};

const getBridgeStorageValueDecodedToNumber = (bridgeStorageValueEncodedAsRlp) => {
    const rlpBytesWithoutEmptyBytes = removeEmptyLeftBytes(bridgeStorageValueEncodedAsRlp);
    const decodedHexFromRlp = decodeRlp(rlpBytesWithoutEmptyBytes);
    return bytesStrToNumber(decodedHexFromRlp);
};

const isPegoutRequestRejectedTx = (tx) => {
    return tx && (tx.method === '' || tx.method.name === 'releaseBtc') && tx.events.length === 1 && tx.events[0].name === PEGOUT_EVENTS.release_request_rejected;
};

const isPegoutRequestReceivedTx = (tx) => {
    return tx && (tx.method === '' || tx.method.name === 'releaseBtc') && tx.events.length === 1 && tx.events[0].name === PEGOUT_EVENTS.release_request_received;
};

const isPegoutCreatedTx = (tx) => {
    return tx && tx.method.name === 'updateCollections' && tx.events.length === 3 && tx.events[1].name === PEGOUT_EVENTS.release_requested;
};

const isPegoutConfirmedTx = (tx) => {
    return tx && tx.method.name === 'updateCollections' && tx.events.length === 2 && tx.events[1].name === PEGOUT_EVENTS.pegout_confirmed;
};

const isAddSignatureTx = (tx) => {
    return tx && tx.method.name === 'addSignature' && tx.events.length === 1 && tx.events[0].name === PEGOUT_EVENTS.add_signature;
};

const isReleaseBtcTx = (tx) => {
    return tx && tx.method.name === 'addSignature' && tx.events.length === 2 && tx.events[1].name === PEGOUT_EVENTS.release_btc;
};

const getBridgeStorageAtBlock = async (web3, storageKey, atBlock) => {
    const result = await web3.eth.getStorageAt(Bridge.address, storageKey, atBlock);
    return result;
};

module.exports = {
    verifyHashOrBlockNumber,
    removeEmptyLeftBytes,
    bytesToHexString,
    decodeRlp,
    bytesStrToNumber,
    getBridgeStorageValueDecodedHexString,
    getBridgeStorageValueDecodedToNumber,
    isPegoutRequestRejectedTx,
    isPegoutRequestReceivedTx,
    isPegoutCreatedTx,
    isPegoutConfirmedTx,
    isAddSignatureTx,
    isReleaseBtcTx,
    bridgeStateKeysToStorageIndexMap,
    getBridgeStorageAtBlock,
    wait,
};
