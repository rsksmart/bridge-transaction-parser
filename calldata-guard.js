const {getBytes} = require('ethers');

const WORD = 32;

/**
 * Ceiling on referenced bytes, expressed as a multiple of the payload length.
 *
 * Under the non-overlap rule enforced by `walkRegion` every counted region is a
 * disjoint sub-interval of the payload, so the true bound is 1x and this
 * assertion can never fire on any input. It is kept as a tripwire for a bug in
 * the cursor arithmetic, not as the primary defence. The worst legitimate ratio
 * measured across the Bridge's largest methods is 0.96
 * (`registerBtcTransaction` with a 3 KB tx and a 1 KB partial merkle tree), so
 * 4 leaves a wide margin over anything the Bridge can legitimately receive.
 */
const MAX_DECODE_EXPANSION = 4;

/**
 * The payload is not a canonical ABI encoding of the expected parameters.
 *
 * Thrown before any decoder runs, so the cost of the rejected payload is one
 * pass over its offset words. `code` is stable so consumers can branch on it
 * without `instanceof`, which fails across duplicated module instances.
 */
class NonCanonicalCalldataError extends Error {
    constructor(message, info) {
        super(message);
        this.name = 'NonCanonicalCalldataError';
        this.code = 'NON_CANONICAL_CALLDATA';
        this.info = info;
    }
}

/**
 * The ABI contains a construct this guard does not know how to walk.
 *
 * Depends only on the ABI shipped in the package, never on the payload, so it
 * is not attacker-triggerable: an ABI bump introducing an unwalkable type fails
 * loudly here instead of silently bypassing the guard. Never fall back to
 * decoding anyway.
 */
class UnsupportedAbiTypeError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnsupportedAbiTypeError';
        this.code = 'UNSUPPORTED_ABI_TYPE';
    }
}

const VALUE_TYPE = /^(?:u?int(?:8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?|bytes(?:[1-9]|[12][0-9]|3[0-2])|address|bool)$/;

/**
 * Turns one ethers `ParamType` into a walk plan node.
 *
 * Every parameter in the current Bridge ABI has a head width of exactly one
 * word, but the general rule is encoded anyway: static tuples and fixed-size
 * arrays occupy several head words, and getting that wrong would misread every
 * offset after them. Rather than guess, both are refused.
 *
 * @param paramType - Resolved ethers ParamType.
 * @returns Plan node: `{dynamic, kind, child?}`.
 * @throws {UnsupportedAbiTypeError} For tuples, fixed-size arrays, unknown types.
 */
const plan = (paramType) => {
    if (paramType.baseType === 'array') {
        if (paramType.arrayLength !== -1) {
            throw new UnsupportedAbiTypeError(`fixed-size array is not supported: ${paramType.type}`);
        }
        return {dynamic: true, kind: 'array', child: plan(paramType.arrayChildren)};
    }
    if (paramType.baseType === 'tuple') {
        throw new UnsupportedAbiTypeError(`tuple is not supported: ${paramType.type}`);
    }
    if (paramType.baseType === 'bytes' || paramType.baseType === 'string') {
        return {dynamic: true, kind: 'bytes'};
    }
    if (VALUE_TYPE.test(paramType.baseType)) {
        return {dynamic: false, kind: 'value'};
    }
    throw new UnsupportedAbiTypeError(`unsupported type: ${paramType.type}`);
};

// Plans are derived per fragment, lazily. Not in the constructor: an ABI bump
// introducing an unwalkable type would otherwise throw on construction and take
// down every consumer at import time, including for methods they never call.
const planCache = new WeakMap();

const planFor = (fragment, params) => {
    if (!fragment) {
        return params.map(plan);
    }
    let cached = planCache.get(fragment);
    if (!cached) {
        cached = params.map(plan);
        planCache.set(fragment, cached);
    }
    return cached;
};

/**
 * Reads one 32-byte word as an offset or length.
 *
 * The high 28 bytes must be zero, which is what refuses a 2^256-scale offset or
 * length outright; the payload-length bound after it is redundant against that
 * but kept, because it makes every later addition and multiplication small and
 * exact rather than merely representable.
 *
 * @param ctx - Walk context.
 * @param at - Absolute byte index of the word.
 * @returns The word's value.
 * @throws {NonCanonicalCalldataError} Out of bounds, or larger than the payload.
 */
const readIndex = (ctx, at) => {
    if (at < 0 || at + WORD > ctx.n) {
        throw new NonCanonicalCalldataError(
            `word read out of bounds at ${at} (payload is ${ctx.n} bytes)`, {at, length: ctx.n});
    }
    const bytes = ctx.b;
    for (let i = 0; i < WORD - 4; i++) {
        if (bytes[at + i] !== 0) {
            throw new NonCanonicalCalldataError(
                `offset or length at ${at} exceeds the ${ctx.n}-byte payload`, {at});
        }
    }
    let value = 0;
    for (let i = WORD - 4; i < WORD; i++) {
        value = value * 256 + bytes[at + i];
    }
    if (value > ctx.n) {
        throw new NonCanonicalCalldataError(
            `offset or length ${value} at ${at} exceeds the ${ctx.n}-byte payload`, {at, value});
    }
    return value;
};

const spend = (ctx, bytes) => {
    ctx.read += bytes;
    if (ctx.read > ctx.max) {
        throw new NonCanonicalCalldataError(
            `projected decode size ${ctx.read} exceeds ${ctx.max} bytes ` +
            `(${MAX_DECODE_EXPANSION}x the ${ctx.n}-byte payload)`,
            {projected: ctx.read, limit: ctx.max});
    }
};

/**
 * Walks one head/tail region.
 *
 * The load-bearing rule is the cursor: a tail may not begin before the end of
 * the previous tail, and the cursor starts at the end of the head area so no
 * tail may point back into it. That makes every counted region a disjoint
 * sub-interval of the payload, which is what bounds the decoder's work.
 *
 * Strictly increasing offsets are *not* enough on their own: offsets climbing by
 * one word into a run of large length words are monotonic, in bounds, and still
 * make the decoder materialize the same payload region hundreds of times.
 *
 * Canonical encodings satisfy the rule with equality at every step, and the rule
 * itself only requires `>=`, so gaps left by a non-ethers encoder are tolerated.
 *
 * @param ctx - Walk context.
 * @param base - Absolute index the region's offsets are measured from.
 * @param nodes - Plan nodes for this region, in head order.
 * @returns Absolute end of the last tail.
 */
const walkRegion = (ctx, base, nodes) => {
    const headWidth = nodes.length * WORD;
    if (base + headWidth > ctx.n) {
        throw new NonCanonicalCalldataError(
            `head area out of bounds: ${nodes.length} parameters need ${headWidth} bytes at ${base}, ` +
            `payload is ${ctx.n} bytes`, {base, headWidth, length: ctx.n});
    }
    let cursor = base + headWidth;
    let head = base;
    for (const node of nodes) {
        if (node.dynamic) {
            const offset = readIndex(ctx, head);
            if (offset % WORD !== 0) {
                throw new NonCanonicalCalldataError(
                    `offset is not word-aligned: ${offset} at ${head}`, {at: head, offset});
            }
            const at = base + offset;
            if (at < cursor) {
                throw new NonCanonicalCalldataError(
                    `overlapping or backwards tail: offset ${offset} resolves to ${at}, ` +
                    `before the end of the previous region at ${cursor}`,
                    {at, cursor, offset});
            }
            cursor = walkTail(ctx, at, node);
        }
        head += WORD;
    }
    return cursor;
};

/**
 * Walks one dynamic tail: a length prefix followed by its payload or elements.
 *
 * @param ctx - Walk context.
 * @param at - Absolute index of the tail's length word.
 * @param node - Plan node describing the tail.
 * @returns Absolute end of the tail.
 */
const walkTail = (ctx, at, node) => {
    const length = readIndex(ctx, at);

    if (node.kind === 'bytes') {
        if (at + WORD + length > ctx.n) {
            throw new NonCanonicalCalldataError(
                `bytes payload out of bounds: length ${length} at ${at}`, {at, declared: length});
        }
        spend(ctx, length);
        // ethers decodes the final tail loose, so a missing last pad word is legal.
        return Math.min(at + WORD + Math.ceil(length / WORD) * WORD, ctx.n);
    }

    const elementBase = at + WORD;
    // Checked before iterating: without this the walk itself would loop on an
    // absurd declared length. Measured from after the length word, which is
    // tighter than the decoder's own check against the remainder of the payload.
    if (length * WORD > ctx.n - elementBase) {
        throw new NonCanonicalCalldataError(
            `declared array length ${length} needs ${length * WORD} bytes, ` +
            `only ${ctx.n - elementBase} remain`, {at, declared: length});
    }
    spend(ctx, length * WORD);
    if (!node.child.dynamic) {
        return elementBase + length * WORD;
    }
    const children = new Array(length).fill(node.child);
    return walkRegion(ctx, elementBase, children);
};

/**
 * Asserts that `data` is a canonical ABI encoding of `params`.
 *
 * Reads only 32-byte words; never copies, slices or hexifies a tail, so a
 * hostile payload costs one pass over its offsets instead of the hundreds of
 * megabytes a decoder would spend on it.
 *
 * @param params - Resolved ethers ParamType list, in head order.
 * @param data - Hex payload (calldata including its selector, or event data).
 * @param options - `base` bytes to skip (4 for a selector), `requireWordMultiple`
 *   (false for event data, which ethers decodes loose), `fragment` to memoize the plan.
 * @returns Projected referenced-byte count, for tests and metrics.
 * @throws {NonCanonicalCalldataError} If the layout is not canonical.
 * @throws {UnsupportedAbiTypeError} If the ABI contains an unwalkable construct.
 */
const assertCanonicalAbiRegion = (params, data, options = {}) => {
    const {base = 0, requireWordMultiple = true, fragment = null} = options;
    const bytes = getBytes(data);
    if (bytes.length < base) {
        throw new NonCanonicalCalldataError(
            `payload is shorter than its ${base}-byte prefix`, {length: bytes.length});
    }
    if (requireWordMultiple && (bytes.length - base) % WORD !== 0) {
        throw new NonCanonicalCalldataError(
            `argument block length ${bytes.length - base} is not a multiple of ${WORD}`,
            {length: bytes.length - base});
    }
    const nodes = planFor(fragment, params);
    const ctx = {b: bytes, n: bytes.length, read: 0, max: MAX_DECODE_EXPANSION * bytes.length};
    walkRegion(ctx, base, nodes);
    return ctx.read;
};

/**
 * Asserts that function calldata is canonical, selector included.
 *
 * @param fragment - Resolved ethers FunctionFragment.
 * @param data - Calldata hex, starting with the 4-byte selector.
 * @returns Projected referenced-byte count.
 */
const assertCanonicalCalldata = (fragment, data) => assertCanonicalAbiRegion(
    fragment.inputs, data, {base: 4, requireWordMultiple: true, fragment});

/**
 * Can this guard walk these parameters? Used by the ABI conformance tests so an
 * ABI bump that introduces an unwalkable construct fails the build.
 *
 * @param params - ethers ParamType list.
 * @returns `true` when every parameter is walkable.
 */
const isWalkable = (params) => {
    try {
        params.map(plan);
        return true;
    } catch (error) {
        if (error instanceof UnsupportedAbiTypeError) {
            return false;
        }
        throw error;
    }
};

module.exports = {
    assertCanonicalCalldata,
    assertCanonicalAbiRegion,
    isWalkable,
    NonCanonicalCalldataError,
    UnsupportedAbiTypeError,
    MAX_DECODE_EXPANSION,
    WORD,
};
