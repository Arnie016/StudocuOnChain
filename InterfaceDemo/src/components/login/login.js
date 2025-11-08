import './login.css';
import '../../global.css';
import { GlobalToolBar } from '../../global';
import logo from '../../images/logo.svg';

export default function Login(props){
    const {
        isHaveMetamask: hasMetamask,
        isConnecting,
        connectError,
        connectTo,
        toolbarProps = {}
    } = props;

    const statusLabel = hasMetamask
        ? (isConnecting ? 'Connecting to MetaMask...' : 'MetaMask detected')
        : 'MetaMask not found';
    const statusBody = (() => {
        if (!hasMetamask) {
            return 'Install the MetaMask extension to begin interacting with the contracts.';
        }
        if (isConnecting) {
            return 'Approve the connection request in your wallet to continue.';
        }
        return 'Connect your wallet to unlock the on-chain playground.';
    })();

    return (
        <div className="page login-page page--centered">
            <GlobalToolBar
                {...toolbarProps}
                isConnected={toolbarProps.isConnected}
                onConnect={toolbarProps.onConnect || connectTo}
                isConnecting={isConnecting}
                hasMetamask={hasMetamask}
            />
            <section className="page-section login-section">
                <div className="split-layout login-layout">
                    <div className="glass-panel login-hero">
                        <p className="eyebrow">Studocu OnChain</p>
                        <h1>Document review workspace for your blockchain cohort</h1>
                        <p className="login-subtitle">
                            Connect MetaMask, register as a reviewer, submit password-protected PDFs, and
                            coordinate approvals from one focused control panel.
                        </p>
                        <ul className="feature-list">
                            <li>One-click wallet connection with live status updates</li>
                            <li>Voting dashboards with automatic event refresh and history</li>
                            <li>Password-gated IPFS preview once access fees are paid</li>
                        </ul>
                        <div className="login-actions">
                            <button
                                className="btn btn--primary"
                                onClick={connectTo}
                                disabled={!hasMetamask || isConnecting}
                            >
                                {hasMetamask ? (isConnecting ? 'Connecting...' : 'Connect MetaMask') : 'Install MetaMask first'}
                            </button>
                            <a
                                className="btn btn--ghost login-doc-btn"
                                href="https://metamask.io/download/"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Download MetaMask
                            </a>
                        </div>
                        <div className="login-footer">
                            <span>Project by Yan Ge, Enrique Cervero &amp; Tristan Philippe</span>
                            <div className="login-badges">
                                <span>Solidity · React · Sepolia</span>
                            </div>
                        </div>
                    </div>
                    <div className="glass-panel login-status">
                        <img src={logo} className="login-logo" alt="Studocu OnChain" />
                        <p className="eyebrow">Wallet status</p>
                        <h2>{statusLabel}</h2>
                        <p>{statusBody}</p>
                        {
                            hasMetamask ? (
                                isConnecting ?
                                    <div className="status-chip status-chip--pending">Awaiting confirmation</div> :
                                    <div className="status-chip status-chip--success">Ready to connect</div>
                            ) :
                            <div className="status-chip status-chip--danger">
                                Action required
                            </div>
                        }
                        <div className="login-status__tip">
                            {hasMetamask ?
                                <p>
                                    {isConnecting
                                        ? 'Approve the prompt in MetaMask. We will take you to the profile page once connected.'
                                        : 'Use the connect button to link your browser wallet and continue to the profile page.'}
                                </p> :
                                <p>
                                    Refresh this page after installing MetaMask to continue. We recommend Chrome or Brave.
                                </p>
                            }
                        </div>
                        <div className="login-status__tip">
                            {connectError && (
                                <div className="status-chip status-chip--danger">
                                    {connectError}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
