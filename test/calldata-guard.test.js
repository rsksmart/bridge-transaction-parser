const chai = require('chai');
const {ethers} = require('ethers');
const Bridge = require('@rsksmart/rsk-precompiled-abis').bridge;
const {
    assertCanonicalCalldata,
    assertCanonicalAbiRegion,
    isWalkable,
    NonCanonicalCalldataError,
    UnsupportedAbiTypeError,
    MAX_DECODE_EXPANSION,
} = require('../calldata-guard');
const {
    ALIASED_RECEIVE_HEADERS_DATA,
    SLIDING_RECEIVE_HEADERS_DATA,
    CANONICAL_RECEIVE_HEADERS_DATA,
    CANONICAL_HEADERS,
} = require('./blockchain-stubs.util');

const {assert, expect} = chai;

const bridgeInterface = new ethers.Interface(Bridge.abi);
const functions = Bridge.abi.filter(entry => entry.type === 'function');
const events = Bridge.abi.filter(entry => entry.type === 'event');

const bytes = length => '0x' + '11'.repeat(length);
const hash32 = '0x' + 'ab'.repeat(32);
const word = value => BigInt(value).toString(16).padStart(64, '0');
const byteLength = data => (data.length - 2) / 2;
const selectorOf = name => bridgeInterface.getFunction(name).selector.slice(2);

describe('Calldata guard — ABI conformance', () => {

    // These three tests are the tripwire for a @rsksmart/rsk-precompiled-abis
    // bump. The guard walks the ABI's head/tail layout, so a new construct it
    // cannot walk must fail the build rather than silently bypass the guard.

    it('Should walk the inputs of every Bridge function', () => {
        const unwalkable = functions
            .map(entry => bridgeInterface.getFunction(entry.name))
            .filter(fragment => !isWalkable(fragment.inputs))
            .map(fragment => fragment.format());

        assert.deepEqual(unwalkable, [], `unwalkable function inputs: ${unwalkable.join(', ')}`);
    });

    it('Should walk the non-indexed inputs of every Bridge event', () => {
        const unwalkable = events
            .map(entry => bridgeInterface.getEvent(entry.name))
            .filter(fragment => !isWalkable(fragment.inputs.filter(input => !input.indexed)))
            .map(fragment => fragment.format());

        assert.deepEqual(unwalkable, [], `unwalkable event data: ${unwalkable.join(', ')}`);
    });

    it('Should keep the Bridge ABI type surface unchanged', () => {
        // Walkability alone would pass silently if a bump added a type that
        // happens to be walkable but changes the amplification arithmetic this
        // guard's constants were derived from. Pinning the inventory forces a
        // human to re-derive it.
        const inventory = {};
        for (const entry of functions) {
            for (const input of entry.inputs) {
                inventory[input.type] = (inventory[input.type] || 0) + 1;
            }
        }

        assert.equal(functions.length, 82, 'function count changed — re-derive the guard analysis');
        assert.equal(events.length, 19, 'event count changed — re-derive the guard analysis');
        assert.deepEqual(inventory, {
            'address': 2,
            'bool': 3,
            'bytes': 18,
            'bytes32': 9,
            'bytes32[]': 1,
            'bytes[]': 2,
            'int256': 15,
            'string': 11,
            'uint256': 6,
        }, 'ABI input type surface changed — re-derive the guard analysis');
    });

    it('Should refuse constructs it cannot walk instead of waving them through', () => {
        const tupleInterface = new ethers.Interface(['function f((uint256,bytes) arg)']);
        const fixedArrayInterface = new ethers.Interface(['function g(bytes32[4] arg)']);

        expect(() => assertCanonicalCalldata(tupleInterface.getFunction('f'), '0x00000000'))
            .to.throw(UnsupportedAbiTypeError);
        expect(() => assertCanonicalCalldata(fixedArrayInterface.getFunction('g'), '0x00000000'))
            .to.throw(UnsupportedAbiTypeError);
    });

});

describe('Calldata guard — canonical calldata is accepted', () => {

    // The false-positive side of the guard, and the reason it is written as a
    // non-overlap rule rather than something stricter: a legitimate mined Bridge
    // transaction that this rejected would stop real pegin/pegout data from being
    // indexed. Every vector must also still decode, and must project fewer bytes
    // than the calldata contains.
    const vectors = [
        ['receiveHeaders', [[bytes(80)]]],
        ['receiveHeaders', [[bytes(80), bytes(80), bytes(80)]]],
        ['receiveHeaders', [Array.from({length: 500}, () => bytes(80))]],
        ['receiveHeaders', [[]]],
        ['receiveHeaders', [['0x', '0x', '0x']]],
        ['receiveHeaders', [['0x', bytes(80), '0x', bytes(81)]]],
        ['receiveHeader', [bytes(80)]],
        ['addSignature', [bytes(33), [], bytes(32)]],
        ['addSignature', [bytes(33), [bytes(71), bytes(72), bytes(71)], bytes(32)]],
        ['addSignature', [bytes(33), Array.from({length: 20}, () => bytes(71)), bytes(32)]],
        ['registerBtcTransaction', [bytes(3000), 900000, bytes(1000)]],
        ['registerBtcTransaction', ['0x', 1, '0x']],
        ['registerBtcCoinbaseTransaction', [bytes(500), hash32, bytes(300), hash32, hash32]],
        ['getBtcTransactionConfirmations', [hash32, hash32, 5, Array.from({length: 12}, () => hash32)]],
        ['getBtcTransactionConfirmations', [hash32, hash32, 5, []]],
        ['commitFederation', [bytes(33)]],
        ['addFederatorPublicKeyMultikey', [bytes(33), bytes(33), bytes(33)]],
        ['addLockWhitelistAddress', ['mfWxJ45yp2SFn7UciZyNpvDKrzbhyfKrY8', 100000]],
        ['updateCollections', []],
    ];

    for (const [name, args] of vectors) {
        const label = `${name}(${args.map(arg => Array.isArray(arg) ? `[${arg.length}]` : typeof arg).join(', ')})`;

        it(`Should accept and still decode canonical ${label}`, () => {
            const fragment = bridgeInterface.getFunction(name);
            const data = bridgeInterface.encodeFunctionData(name, args);

            const projected = assertCanonicalCalldata(fragment, data);

            assert.isBelow(projected, byteLength(data) + 1,
                'a canonical encoding can never reference more bytes than it contains');
            assert.doesNotThrow(() => bridgeInterface.decodeFunctionData(fragment, data));
        });
    }

    it('Should accept the aliasing-free fixture used by the end-to-end tests', () => {
        const fragment = bridgeInterface.getFunction('receiveHeaders');

        assertCanonicalCalldata(fragment, CANONICAL_RECEIVE_HEADERS_DATA);

        const decoded = bridgeInterface.decodeFunctionData(fragment, CANONICAL_RECEIVE_HEADERS_DATA);
        assert.deepEqual([...decoded[0]], CANONICAL_HEADERS);
    });

    it('Should accept calldata with a trailing extra word', () => {
        // The rule only needs the last tail to end at or before the payload's end,
        // so padding a canonical encoding is not an attack and is not rejected.
        const fragment = bridgeInterface.getFunction('receiveHeaders');
        const data = bridgeInterface.encodeFunctionData('receiveHeaders', [[bytes(80)]]) + '00'.repeat(32);

        assert.doesNotThrow(() => assertCanonicalCalldata(fragment, data));
    });

    it('Should accept the calldata of every existing transaction fixture', () => {
        const {transactionsStub} = require('./blockchain-stubs.util');
        const canonical = transactionsStub
            .filter(tx => tx.data && tx.data.length >= 10)
            .filter(tx => bridgeInterface.getFunction(tx.data.substring(0, 10)))
            .filter(tx => tx.data !== ALIASED_RECEIVE_HEADERS_DATA);

        assert.isAtLeast(canonical.length, 3);
        for (const tx of canonical) {
            const fragment = bridgeInterface.getFunction(tx.data.substring(0, 10));
            assert.doesNotThrow(() => assertCanonicalCalldata(fragment, tx.data),
                `fixture ${tx.hash} (${fragment.name}) was rejected`);
        }
    });

});

describe('Calldata guard — hostile calldata is rejected', () => {

    const receiveHeaders = () => bridgeInterface.getFunction('receiveHeaders');

    it('Should reject an aliased receiveHeaders payload, cheaply', () => {
        // NOTE: this test must never call decodeFunctionData on this payload. The
        // resulting out-of-memory abort happens inside native code, so it would
        // kill the mocha process instead of failing the test. Constructing the
        // payload is harmless; decoding it is not.
        assert.equal(byteLength(ALIASED_RECEIVE_HEADERS_DATA), 130916,
            'the fixture should stay the size the timing and heap bounds were derived from');

        const heapBefore = process.memoryUsage().heapUsed;
        const startedAt = process.hrtime.bigint();

        expect(() => assertCanonicalCalldata(receiveHeaders(), ALIASED_RECEIVE_HEADERS_DATA))
            .to.throw(NonCanonicalCalldataError, /overlapping or backwards tail/);

        const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        const heapGrowthMb = (process.memoryUsage().heapUsed - heapBefore) / 1048576;

        assert.isBelow(elapsedMs, 100, `rejection took ${elapsedMs.toFixed(1)} ms`);
        assert.isBelow(heapGrowthMb, 32, `rejection grew the heap by ${heapGrowthMb.toFixed(1)} MB`);
    });

    it('Should reject the sliding-window variant, which has strictly increasing offsets', () => {
        // The regression test that keeps the rule from being weakened back to
        // "offsets must increase": these do increase, by one word each, and each
        // lands on a different large length word whose windows overlap. Same
        // amplification, same unrecoverable abort.
        expect(() => assertCanonicalCalldata(receiveHeaders(), SLIDING_RECEIVE_HEADERS_DATA))
            .to.throw(NonCanonicalCalldataError, /overlapping or backwards tail/);
    });

    it('Should reject an element offset pointing back into its own head area', () => {
        const data = '0x' + selectorOf('receiveHeaders')
            + word(32) + word(2) + word(0) + word(32);

        expect(() => assertCanonicalCalldata(receiveHeaders(), data))
            .to.throw(NonCanonicalCalldataError, /overlapping or backwards tail/);
    });

    it('Should reject a misaligned offset', () => {
        const data = '0x' + selectorOf('receiveHeaders') + word(33) + word(1);

        expect(() => assertCanonicalCalldata(receiveHeaders(), data))
            .to.throw(NonCanonicalCalldataError, /not word-aligned/);
    });

    it('Should reject an out-of-bounds offset', () => {
        const data = '0x' + selectorOf('receiveHeaders') + word(32);

        expect(() => assertCanonicalCalldata(receiveHeaders(), data))
            .to.throw(NonCanonicalCalldataError, /out of bounds/);
    });

    it('Should reject an absurd declared array length without iterating it', () => {
        const data = '0x' + selectorOf('receiveHeaders') + word(32) + 'f'.repeat(64);

        const startedAt = process.hrtime.bigint();
        expect(() => assertCanonicalCalldata(receiveHeaders(), data))
            .to.throw(NonCanonicalCalldataError, /exceeds the/);
        assert.isBelow(Number(process.hrtime.bigint() - startedAt) / 1e6, 100);
    });

    it('Should reject a declared array length that does not fit the remaining bytes', () => {
        const data = '0x' + selectorOf('receiveHeaders') + word(32) + word(64);

        expect(() => assertCanonicalCalldata(receiveHeaders(), data))
            .to.throw(NonCanonicalCalldataError, /only \d+ remain/);
    });

    it('Should reject a bytes length running past the end of the payload', () => {
        const data = '0x' + selectorOf('receiveHeader') + word(32) + word(96) + '11'.repeat(32);

        expect(() => assertCanonicalCalldata(bridgeInterface.getFunction('receiveHeader'), data))
            .to.throw(NonCanonicalCalldataError);
    });

    it('Should reject an argument block that is not a whole number of words', () => {
        const data = '0x' + selectorOf('receiveHeaders') + word(32).slice(4);

        expect(() => assertCanonicalCalldata(receiveHeaders(), data))
            .to.throw(NonCanonicalCalldataError, /not a multiple of 32/);
    });

    it('Should reject calldata shorter than its selector', () => {
        expect(() => assertCanonicalCalldata(receiveHeaders(), '0xe540'))
            .to.throw(NonCanonicalCalldataError, /shorter than/);
    });

});

describe('Calldata guard — event data', () => {

    const commitFederation = () => bridgeInterface.getEvent('commit_federation');
    const nonIndexedInputs = fragment => fragment.inputs.filter(input => !input.indexed);
    const eventOptions = fragment => ({base: 0, requireWordMultiple: false, fragment});

    it('Should accept canonical commit_federation data', () => {
        const fragment = commitFederation();
        const inputs = nonIndexedInputs(fragment);
        const data = ethers.AbiCoder.defaultAbiCoder().encode(
            inputs.map(input => input.type),
            [bytes(33), 'mfWxJ45yp2SFn7UciZyNpvDKrzbhyfKrY8', bytes(33), 'mvbnrCX3bg1cDRUu8pkecrvP6vQkSLDSou', 5]);

        assert.doesNotThrow(() => assertCanonicalAbiRegion(inputs, data, eventOptions(fragment)));
    });

    it('Should reject aliased offsets in event data', () => {
        const fragment = commitFederation();
        const inputs = nonIndexedInputs(fragment);
        const shared = 8192;
        const data = '0x'
            + word(160).repeat(4)   // four dynamic heads, all aliasing one tail
            + word(5)
            + word(shared) + '43'.repeat(shared);

        expect(() => assertCanonicalAbiRegion(inputs, data, eventOptions(fragment)))
            .to.throw(NonCanonicalCalldataError, /overlapping or backwards tail/);
    });

    it('Should accept event data whose final tail is not padded to a word', () => {
        // ethers decodes event data loosely on purpose, for tightly-packed data
        // from older emitters. The guard must not be stricter than the decoder.
        const fragment = commitFederation();
        const inputs = nonIndexedInputs(fragment);
        const trailingString = 'mvbnrCX3bg1cDRUu8pkecrvP6vQkSLDSou';   // 34 bytes
        const data = ethers.AbiCoder.defaultAbiCoder().encode(
            inputs.map(input => input.type),
            [bytes(33), 'mfWxJ45yp2SFn7UciZyNpvDKrzbhyfKrY8', bytes(33), trailingString, 5]);

        const padding = 32 - (trailingString.length % 32);
        const loose = data.slice(0, data.length - padding * 2);

        assert.doesNotThrow(() => assertCanonicalAbiRegion(inputs, loose, eventOptions(fragment)));
        assert.doesNotThrow(() => ethers.AbiCoder.defaultAbiCoder().decode(
            inputs.map(input => input.type), loose, true),
            'the decoder accepts this shape, so the guard must too');
    });

});

describe('Calldata guard — projected size budget', () => {

    it('Should keep the budget above every legitimate encoding', () => {
        // Under the non-overlap rule the projected count can never exceed the
        // payload length, so this budget is a tripwire for a bug in the cursor
        // arithmetic rather than the primary defence. Pinned so nobody lowers it
        // into the range real Bridge calls occupy (worst measured ratio 0.96).
        const data = bridgeInterface.encodeFunctionData(
            'registerBtcTransaction', [bytes(3000), 900000, bytes(1000)]);
        const projected = assertCanonicalCalldata(
            bridgeInterface.getFunction('registerBtcTransaction'), data);

        assert.isAbove(MAX_DECODE_EXPANSION, projected / byteLength(data));
        assert.isAtLeast(MAX_DECODE_EXPANSION, 2);
    });

});
