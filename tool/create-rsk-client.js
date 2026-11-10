const {ethers} = require("ethers");

// ethers waits 5 minutes by default. A shorter timeout lets the parser retry a stuck request sooner.
const REQUEST_TIMEOUT_MS = 30000;

const createRskClient = (url) => {
    const fetchRequest = new ethers.FetchRequest(url);
    fetchRequest.timeout = REQUEST_TIMEOUT_MS;
    // Detect the chain ID once instead of sending eth_chainId with every request.
    return new ethers.JsonRpcProvider(fetchRequest, undefined, {staticNetwork: true});
};

module.exports = createRskClient;
