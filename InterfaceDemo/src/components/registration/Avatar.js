import React from 'react';
import { generateAvatar } from '../../utils/avatar';
import './Avatar.css';

export default function Avatar({ address, size = 40, className = '' }) {
    const avatarUrl = generateAvatar(address, size);
    const sizeClass = size <= 24 ? 'avatar--small' : size >= 64 ? 'avatar--large' : 'avatar--medium';
    
    if (!avatarUrl) {
        return (
            <div className={`avatar avatar--placeholder ${sizeClass} ${className}`}>
                ?
            </div>
        );
    }

    return (
        <img
            src={avatarUrl}
            alt={`Avatar for ${address}`}
            className={`avatar ${sizeClass} ${className}`}
            onError={(e) => {
                // Fallback to placeholder on error
                e.target.style.display = 'none';
                e.target.nextSibling?.classList.remove('avatar--hidden');
            }}
        />
    );
}

