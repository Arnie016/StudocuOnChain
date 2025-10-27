import { NavLink } from "react-router-dom";

const navLinks = [
    { path: "/", label: "Login", exact: true },
    { path: "/InterfaceDemo/profile", label: "Profile" },
    { path: "/InterfaceDemo/storage", label: "Storage" },
    { path: "/InterfaceDemo/history", label: "History" },
    { path: "/InterfaceDemo/leader", label: "Leader" },
    { path: "/InterfaceDemo/register", label: "Studocu" }
];

const shortenAddress = (value) => {
    if (!value || value.length < 10) {
        return value || "";
    }
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

export const GlobalToolBar = ({
    isConnected,
    address,
    network,
    onConnect,
    isConnecting = false,
    hasMetamask = true
}) => {
    const handleConnect = onConnect || (() => {});
    const walletStatus = isConnected ? "Wallet connected" : "Wallet disconnected";
    const networkLabel = network || "Unknown network";

    return (
        <nav className="global-nav">
            <div className="global-nav__brand">
                <div className="global-nav__logo">Ξ</div>
                <div className="global-nav__meta">
                    <span>Studocu OnChain</span>
                    <strong>Interface Demo</strong>
                </div>
            </div>
            <div className="global-nav__links">
                {navLinks.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        end={link.exact}
                        className={({ isActive }) =>
                            `global-nav__link${isActive ? " is-active" : ""}`
                        }
                    >
                        {link.label}
                    </NavLink>
                ))}
            </div>
            <div className="global-nav__status">
                <div className="global-nav__status-line">
                    <span className={`status-indicator ${isConnected ? "is-online" : "is-offline"}`} />
                    <span>{walletStatus}</span>
                </div>
                <div className="global-nav__status-meta">
                    {isConnected ? (
                        <>
                            <span className="global-nav__pill" title={networkLabel}>
                                {networkLabel}
                            </span>
                            <span className="global-nav__pill global-nav__pill--address" title={address}>
                                {shortenAddress(address)}
                            </span>
                        </>
                    ) : (
                        <button
                            className="btn btn--primary global-nav__connect"
                            onClick={handleConnect}
                            disabled={!hasMetamask || isConnecting}
                        >
                            {hasMetamask
                                ? (isConnecting ? "Connecting..." : "Connect Wallet")
                                : "Install MetaMask"}
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};
