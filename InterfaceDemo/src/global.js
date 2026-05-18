import { NavLink } from "react-router-dom";
import { DAPP_NAME, shortAddress } from "./config/dapp";
import { Icon } from "./components/ui/Icon";

const navLinks = [
    { path: "/", label: "Login", exact: true },
    { path: "/InterfaceDemo/profile", label: "Profile" },
    { path: "/InterfaceDemo/register", label: "Upload" },
    { path: "/InterfaceDemo/vote", label: "Vote" },
    { path: "/InterfaceDemo/history", label: "History" }
];

export const GlobalToolBar = ({
    isConnected,
    address,
    network,
    isSupportedNetwork = true,
    supportedNetworkLabel = "Sepolia Test Network",
    onConnect,
    onSwitchNetwork,
    isConnecting = false,
    hasMetamask = true
}) => {
    const handleConnect = onConnect || (() => {});
    const walletStatus = isConnected ? "Wallet connected" : "Wallet disconnected";
    const networkLabel = network || "Unknown network";
    const needsNetworkSwitch = isConnected && !isSupportedNetwork;

    return (
        <nav className={`global-nav${needsNetworkSwitch ? " has-warning" : ""}`}>
            <div className="global-nav__main">
                <div className="global-nav__brand">
                    <div className="global-nav__logo" aria-hidden="true">LU</div>
                    <div className="global-nav__meta">
                        <strong className="studocu-wordmark">{DAPP_NAME}</strong>
                        <span>On-chain notes market</span>
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
                        <span className={`status-indicator ${isConnected ? (isSupportedNetwork ? "is-online" : "is-warning") : "is-offline"}`} />
                        <span>{needsNetworkSwitch ? `Switch to ${supportedNetworkLabel}` : walletStatus}</span>
                    </div>
                    <div className="global-nav__status-meta">
                        {isConnected ? (
                            <>
                                <span className={`global-nav__pill${isSupportedNetwork ? "" : " global-nav__pill--warning"}`} title={networkLabel}>
                                    {networkLabel}
                                </span>
                                <span className="global-nav__pill global-nav__pill--address" title={address}>
                                    {shortAddress(address)}
                                </span>
                                {needsNetworkSwitch && (
                                    <button
                                        type="button"
                                        className="btn btn--primary global-nav__connect"
                                        onClick={onSwitchNetwork}
                                    >
                                        <Icon name="wallet" size={16} />
                                        Switch network
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                type="button"
                                className="btn btn--primary global-nav__connect"
                                onClick={handleConnect}
                                disabled={!hasMetamask || isConnecting}
                            >
                                <Icon name="wallet" size={16} />
                                {hasMetamask
                                    ? (isConnecting ? "Connecting..." : "Connect Wallet")
                                    : "Install MetaMask"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {needsNetworkSwitch && (
                <div className="global-nav__warning">
                    <strong>Unsupported network.</strong>
                    <span>This deployment is configured for {supportedNetworkLabel}. Contract actions are paused until the wallet network matches.</span>
                </div>
            )}
        </nav>
    );
};
