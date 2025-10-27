import './login.css';
import '../../global.css';
import { GlobalToolBar } from '../../global';
import logo from '../../images/logo.svg';

export default function Login(props){
    const hasMetamask = props.isHaveMetamask;

    const statusLabel = hasMetamask ? 'MetaMask detected' : 'MetaMask not found';
    const statusBody = hasMetamask
        ? 'Connect your wallet to unlock the on-chain playground.'
        : 'Install the MetaMask extension to begin interacting with the contracts.';

    return (
        <div className="page login-page page--centered">
            <GlobalToolBar />
            <section className="page-section login-section">
                <div className="split-layout login-layout">
                    <div className="glass-panel login-hero">
                        <p className="eyebrow">Studocu OnChain</p>
                        <h1>Ultra sleek interface for your EE4032 blockchain toolkit</h1>
                        <p className="login-subtitle">
                            Connect MetaMask, push values to the SimpleStorage contract, follow your
                            history, and orchestrate the leader election demo from a single, polished cockpit.
                        </p>
                        <ul className="feature-list">
                            <li>One-click wallet connection with live status</li>
                            <li>Responsive panels for storage, history and leader flows</li>
                            <li>New glassmorphism aesthetic with gradient accents</li>
                        </ul>
                        <div className="login-actions">
                            <button
                                className="btn btn--primary"
                                onClick={props.connectTo}
                                disabled={!hasMetamask}
                            >
                                {hasMetamask ? 'Connect MetaMask' : 'Install MetaMask first'}
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
                            hasMetamask ?
                            <div className="status-chip status-chip--success">
                                Ready to connect
                            </div> :
                            <div className="status-chip status-chip--danger">
                                Action required
                            </div>
                        }
                        <div className="login-status__tip">
                            {hasMetamask ?
                                <p>
                                    Use the connect button to link your browser wallet and continue to the profile page.
                                </p> :
                                <p>
                                    Refresh this page after installing MetaMask to continue. We recommend Chrome or Brave.
                                </p>
                            }
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
