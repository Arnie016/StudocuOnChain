import { Navigate } from "react-router-dom";

import "./profile.css";
import "../../global.css";
import { GlobalToolBar } from "../../global";
import METAMASK from '../../images/METAMASK.png';

export default function Profile(props){
    const { address, networkType, balance, isConnected, toolbarProps = {} } = props;

    const ProfilePage = () => (
        <div className="page profile-page">
            <GlobalToolBar
                {...toolbarProps}
                isConnected={toolbarProps.isConnected}
            />
            <section className="page-section">
                <div className="section-heading">
                    <p className="eyebrow">Wallet overview</p>
                    <h1>You're connected &amp; ready</h1>
                    <p className="profile-subtitle">
                        Monitor your MetaMask account, network and balance before triggering contract actions.
                    </p>
                </div>

                <div className="split-layout profile-layout">
                    <div className="glass-panel profile-card">
                        <img src={METAMASK} alt="MetaMask" className="profile-logo" />
                        <h3>Active account</h3>
                        <div className="profile-field">
                            <span>Address</span>
                            <p className="profile-value">{address || 'Not available'}</p>
                        </div>
                        <div className="profile-field">
                            <span>Network</span>
                            <p className="profile-value">{networkType || 'Unknown network'}</p>
                        </div>
                        <div className="profile-field">
                            <span>Balance</span>
                            <p className="profile-value">{balance || '0'} ETH</p>
                        </div>
                    </div>

                    <div className="glass-panel profile-highlights">
                        <p className="eyebrow">Quick stats</p>
                        <div className="card-grid profile-stats">
                            <div className="profile-stat">
                                <span>Storage value</span>
                                <strong>Write + Read</strong>
                                <p>Jump to the storage panel to push a new uint value in seconds.</p>
                            </div>
                            <div className="profile-stat">
                                <span>History monitor</span>
                                <strong>Live ledger</strong>
                                <p>Track the last operations, gas usage and statuses without leaving the page.</p>
                            </div>
                            <div className="profile-stat">
                                <span>Leader election</span>
                                <strong>Two-player commit</strong>
                                <p>Commit, reveal and fetch the current leader address with visual cues.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel profile-next-steps">
                    <div>
                        <p className="eyebrow">Next up</p>
                        <h3>Head to Storage or Leader to start interacting</h3>
                    </div>
                    <div className="profile-tags">
                        <span className="status-chip status-chip--neutral">Storage</span>
                        <span className="status-chip status-chip--neutral">History</span>
                        <span className="status-chip status-chip--neutral">Leader</span>
                    </div>
                </div>
            </section>
        </div>
    );

    return isConnected ? <ProfilePage /> : <Navigate to='/' />;
}
