const stripPrefix = (value = '') => {
    let result = `${value}`.trim();
    if (!result) {
        return '';
    }

    // Remove ipfs:// prefix
    result = result.replace(/^ipfs:\/\//i, '');

    // Remove leading /ipfs/ segments
    if (/^\/?ipfs\//i.test(result)) {
        result = result.replace(/^\/?ipfs\//i, '');
    }

    // If this is an HTTP(S) URL that contains /ipfs/, extract the path after it
    if (/^https?:\/\//i.test(result)) {
        const lower = result.toLowerCase();
        const idx = lower.indexOf('/ipfs/');
        if (idx !== -1) {
            result = result.slice(idx + 6);
        } else {
            // No /ipfs/ segment, treat as direct URL (e.g. https://example.com/file.pdf)
            return result;
        }
    }

    return result.replace(/^\/+/, '');
};

export const normalizeIpfsInput = (value) => {
    if (value === null || value === undefined) {
        return '';
    }
    return stripPrefix(value);
};

export const buildIpfsUrl = (value, gatewayBase = 'https://ipfs.io/ipfs/') => {
    const normalized = normalizeIpfsInput(value);
    if (!normalized) {
        return '';
    }

    if (/^https?:\/\//i.test(normalized)) {
        return normalized;
    }

    const base = gatewayBase.endsWith('/') ? gatewayBase : `${gatewayBase}/`;
    return `${base}${normalized}`;
};

export const DEFAULT_IPFS_GATEWAYS = [
    { name: 'IPFS.io', base: 'https://ipfs.io/ipfs/' },
    { name: 'Pinata', base: 'https://gateway.pinata.cloud/ipfs/' },
    { name: 'Cloudflare', base: 'https://cloudflare-ipfs.com/ipfs/' },
    { name: 'dweb.link', base: 'https://dweb.link/ipfs/' },
    { name: 'Infura', base: 'https://ipfs.infura.io/ipfs/' }
];

export const buildGatewayUrls = (value, gateways = DEFAULT_IPFS_GATEWAYS) => {
    const normalized = normalizeIpfsInput(value);
    if (!normalized) {
        return [];
    }

    if (/^https?:\/\//i.test(normalized) && !normalized.toLowerCase().includes('/ipfs/')) {
        return [{ name: 'Direct link', url: normalized }];
    }

    return gateways.map(({ name, base }) => ({
        name,
        url: buildIpfsUrl(normalized, base)
    }));
};

export const shortIpfsHash = (value, start = 20, end = 10) => {
    const normalized = normalizeIpfsInput(value);
    if (!normalized) {
        return '';
    }

    if (normalized.length <= start + end + 3) {
        return normalized;
    }

    return `${normalized.substring(0, start)}...${normalized.substring(normalized.length - end)}`;
};


