const baseProps = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: false
};

export const Icon = ({ name, size = 18, className = "" }) => {
    const props = {
        ...baseProps,
        width: size,
        height: size,
        className: `icon ${className}`.trim()
    };

    switch (name) {
        case "download":
            return (
                <svg {...props}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M12 15V3" />
                </svg>
            );
        case "eye":
            return (
                <svg {...props}>
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            );
        case "refresh":
            return (
                <svg {...props}>
                    <path d="M21 12a9 9 0 0 1-14.7 7" />
                    <path d="M3 12a9 9 0 0 1 14.7-7" />
                    <path d="M17 1v4h-4" />
                    <path d="M7 23v-4h4" />
                </svg>
            );
        case "clock":
            return (
                <svg {...props}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                </svg>
            );
        case "lock":
            return (
                <svg {...props}>
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
            );
        case "check":
            return (
                <svg {...props}>
                    <path d="M20 6 9 17l-5-5" />
                </svg>
            );
        case "x":
            return (
                <svg {...props}>
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                </svg>
            );
        case "arrowRight":
            return (
                <svg {...props}>
                    <path d="M5 12h14" />
                    <path d="m13 5 7 7-7 7" />
                </svg>
            );
        case "upload":
            return (
                <svg {...props}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="m17 8-5-5-5 5" />
                    <path d="M12 3v12" />
                </svg>
            );
        case "wallet":
            return (
                <svg {...props}>
                    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
                    <path d="M16 12h6v5h-6a2.5 2.5 0 0 1 0-5Z" />
                    <path d="M18 14.5h.01" />
                </svg>
            );
        case "file":
            return (
                <svg {...props}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6" />
                    <path d="M8 13h8" />
                    <path d="M8 17h5" />
                </svg>
            );
        default:
            return null;
    }
};
