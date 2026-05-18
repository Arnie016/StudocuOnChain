export const DAPP_NAME = process.env.REACT_APP_DAPP_NAME || "Studio Unchained";
export const DAPP_LEGACY_NAME = "StudocuOnChain";

export const NETWORKS = {
    "0x1": {
        chainId: "0x1",
        chainName: "Ethereum Mainnet",
        shortName: "Mainnet",
        explorerUrl: "https://etherscan.io"
    },
    "0xaa36a7": {
        chainId: "0xaa36a7",
        chainName: "Sepolia Test Network",
        shortName: "Sepolia",
        nativeCurrency: {
            name: "Sepolia ETH",
            symbol: "ETH",
            decimals: 18
        },
        rpcUrls: ["https://rpc.sepolia.org"],
        blockExplorerUrls: ["https://sepolia.etherscan.io"],
        explorerUrl: "https://sepolia.etherscan.io"
    },
    "0x1d83d": {
        chainId: "0x1d83d",
        chainName: "Sova Network",
        shortName: "Sova",
        nativeCurrency: {
            name: "SOVA",
            symbol: "SOVA",
            decimals: 18
        },
        rpcUrls: ["https://rpc.testnet.sova.io"],
        blockExplorerUrls: ["https://explorer.testnet.sova.io"],
        explorerUrl: "https://explorer.testnet.sova.io"
    }
};

const normalizeChainId = (chainId) => {
    if (!chainId) {
        return null;
    }
    if (typeof chainId === "number") {
        return `0x${chainId.toString(16)}`;
    }
    const value = chainId.toString().trim().toLowerCase();
    if (value.startsWith("0x")) {
        return value;
    }
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
        return value;
    }
    return `0x${numericValue.toString(16)}`;
};

export const SUPPORTED_CHAIN_ID = normalizeChainId(process.env.REACT_APP_SUPPORTED_CHAIN_ID || "0xaa36a7");
export const SUPPORTED_NETWORK = NETWORKS[SUPPORTED_CHAIN_ID] || {
    chainId: SUPPORTED_CHAIN_ID,
    chainName: process.env.REACT_APP_SUPPORTED_NETWORK_NAME || "Configured Network",
    shortName: process.env.REACT_APP_SUPPORTED_NETWORK_SHORT_NAME || process.env.REACT_APP_SUPPORTED_NETWORK_NAME || "Configured",
    nativeCurrency: {
        name: process.env.REACT_APP_SUPPORTED_NETWORK_CURRENCY_NAME || "Ether",
        symbol: process.env.REACT_APP_SUPPORTED_NETWORK_CURRENCY_SYMBOL || "ETH",
        decimals: Number(process.env.REACT_APP_SUPPORTED_NETWORK_CURRENCY_DECIMALS || 18)
    },
    rpcUrls: process.env.REACT_APP_SUPPORTED_NETWORK_RPC_URL ? [process.env.REACT_APP_SUPPORTED_NETWORK_RPC_URL] : undefined,
    blockExplorerUrls: process.env.REACT_APP_SUPPORTED_NETWORK_EXPLORER_URL ? [process.env.REACT_APP_SUPPORTED_NETWORK_EXPLORER_URL] : undefined,
    explorerUrl: process.env.REACT_APP_SUPPORTED_NETWORK_EXPLORER_URL
};

export const resolveNetworkLabel = (chainId) => {
    const normalized = normalizeChainId(chainId);
    return NETWORKS[normalized]?.chainName || "Unsupported Network";
};

export const isSupportedChain = (chainId) => normalizeChainId(chainId) === SUPPORTED_CHAIN_ID;

export const shortAddress = (value) => {
    if (!value || value.length < 10) {
        return value || "";
    }
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
};
