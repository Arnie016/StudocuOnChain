/**
 * Generate a deterministic avatar URL from an Ethereum address or DID
 * Uses a simple hash-based approach to create consistent avatars
 */

// Simple hash function
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Generate avatar URL from address/DID
 * @param {string} identifier - Ethereum address or DID
 * @param {number} size - Avatar size in pixels (default: 40)
 * @returns {string} Avatar URL
 */
export function generateAvatar(identifier, size = 40) {
    if (!identifier) {
        return null;
    }

    // Extract address from DID if needed
    let address = identifier;
    if (identifier.startsWith('did:key:')) {
        // Use the DID key part for hashing
        address = identifier.replace('did:key:', '');
    } else if (identifier.startsWith('0x')) {
        // Use Ethereum address as-is
        address = identifier.toLowerCase();
    }

    // Generate hash from address
    const hash = hashString(address);
    
    // Use DiceBear API for consistent avatars (free, no API key needed)
    // Options: avataaars, identicon, bottts, fun-emoji, etc.
    const style = 'identicon'; // identicon is good for addresses
    const seed = address.substring(0, 16); // Use first 16 chars as seed
    
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
}

/**
 * Generate avatar with custom style
 */
export function generateAvatarWithStyle(identifier, style = 'identicon', size = 40) {
    if (!identifier) return null;
    
    let address = identifier;
    if (identifier.startsWith('did:key:')) {
        address = identifier.replace('did:key:', '');
    } else if (identifier.startsWith('0x')) {
        address = identifier.toLowerCase();
    }
    
    const seed = address.substring(0, 16);
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
}


