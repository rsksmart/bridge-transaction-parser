module.exports = class BridgeEvent {
    constructor(name, signature, args) {
        this.name = name;
        this.signature = signature;
        this.arguments = args;
    }
}
