/**
 * Generate a deterministic avatar URL from an Ethereum address or DID
 * Uses a simple hash-based approach to create consistent avatars
 */

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


