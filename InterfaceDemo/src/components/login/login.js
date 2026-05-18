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
            return 'Install MetaMask to sign in as a creator. Uploads, storage, and listings are already backed by the production API.';
        }
        if (isConnecting) {
            return 'Approve the wallet connection and signature request to open the creator workbench.';
        }
        return `Connect on ${SUPPORTED_NETWORK.shortName || SUPPORTED_NETWORK.chainName} to manage uploads, private files, and creator earnings.`;
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
                            A creator marketplace for study files. Upload privately, price access, track reviews, and build a revenue ledger before the payout contract goes live.
                        </p>
                        <div className="login-flow">
                            <div>
                                <span>01</span>
                                <strong>Upload</strong>
                                <p>Drop PDFs, sheets, images, or course files into private storage.</p>
                            </div>
                            <div>
                                <span>02</span>
                                <strong>List</strong>
                                <p>Add course metadata, price the unlock, and send it to review.</p>
                            </div>
                            <div>
                                <span>03</span>
                                <strong>Earn</strong>
                                <p>Confirmed purchases become creator earnings, with wallet payouts next.</p>
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
                            <span>API, database, and private storage are live on AWS.</span>
                            <div className="login-badges">
                                <span>React · Postgres · Private object storage</span>
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
                                        ? 'Approve the prompts in MetaMask. The second signature creates the backend session.'
                                        : 'Connect once to unlock uploads, creator listings, and earnings from the backend.'}
                                </p> :
                                <p>
                                    Refresh this page after installing MetaMask. Chrome and Brave work best for the current wallet flow.
                                </p>
                            }
                        </div>
                        {connectError && (
                            <div className="login-status__tip">
                                <div className="status-chip status-chip--danger">
                                    {connectError}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
