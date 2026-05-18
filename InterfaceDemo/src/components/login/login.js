import './login.css';
import '../../global.css';
import { GlobalToolBar } from '../../global';
import logo from '../../images/logo.svg';
import { DAPP_NAME, SUPPORTED_NETWORK } from '../../config/dapp';
import { Icon } from '../ui/Icon';

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
        return `Connect your wallet on ${SUPPORTED_NETWORK.shortName || SUPPORTED_NETWORK.chainName} to upload, review, and unlock notes.`;
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
                        <h1 className="studocu-gradient-title">{DAPP_NAME}</h1>
                        <p className="login-subtitle">
                            A wallet-native marketplace for useful class notes. Register once, upload
                            password-protected PDFs, review assigned submissions, and unlock approved files from one control panel.
                        </p>
                        <div className="login-flow">
                            <div>
                                <span>01</span>
                                <strong>Register</strong>
                                <p>Join the reviewer pool with the configured contract fee.</p>
                            </div>
                            <div>
                                <span>02</span>
                                <strong>Upload</strong>
                                <p>Stake a small deposit and submit an IPFS or fallback link.</p>
                            </div>
                            <div>
                                <span>03</span>
                                <strong>Review</strong>
                                <p>Vote on assigned notes and earn the voter reward.</p>
                            </div>
                        </div>
                        <div className="login-actions">
                            <button
                                className="btn btn--primary"
                                onClick={connectTo}
                                disabled={!hasMetamask || isConnecting}
                            >
                                <Icon name="wallet" size={18} />
                                {hasMetamask ? (isConnecting ? 'Connecting...' : 'Connect MetaMask') : 'Install MetaMask first'}
                            </button>
                            <a
                                className="btn btn--ghost login-doc-btn"
                                href="https://metamask.io/download/"
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Icon name="download" size={18} />
                                Download MetaMask
                            </a>
                        </div>
                        <div className="login-footer">
                            <span>Production network: {SUPPORTED_NETWORK.chainName}</span>
                            <div className="login-badges">
                                <span>Solidity · React · IPFS</span>
                            </div>
                        </div>
                    </div>
                    <div className="glass-panel login-status">
                        <img src={logo} className="login-logo" alt={DAPP_NAME} />
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
