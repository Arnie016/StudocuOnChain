import React from 'react';
import { generateAvatar } from '../../utils/avatar';
import './Avatar.css';

export default function Avatar({ address, size = 40, className = '' }) {
    const avatarUrl = generateAvatar(address, size);
    
    if (!avatarUrl) {
        return (
            <div 
                className={`avatar avatar--placeholder ${className}`}
                style={{ width: size, height: size }}
            >
                ?
            </div>
        );
    }

    return (
        <img
            src={avatarUrl}
            alt={`Avatar for ${address}`}
            className={`avatar ${className}`}
            style={{ width: size, height: size }}
            onError={(e) => {
                // Fallback to placeholder on error
                e.target.style.display = 'none';
                e.target.nextSibling?.classList.remove('avatar--hidden');
            }}
        />
    );
}


