import { Link, Navigate } from "react-router-dom";

import "./profile.css";
import "../../global.css";
import { GlobalToolBar } from "../../global";
import metamaskLogo from '../../images/metamask.svg';
import { DAPP_NAME, shortAddress } from "../../config/dapp";
import { Icon } from "../ui/Icon";

export default function Profile(props){
    const {
        address,
        networkType,
        balance,
        isConnected,
        isSupportedNetwork,
        isRegistered,
        stats = {},
        documents = [],
        fees = {},
        toolbarProps = {}
    } = props;

    const lowerAddress = address?.toLowerCase?.();
    const myUploads = Array.isArray(documents) && lowerAddress
        ? documents.filter((doc) => doc.uploader?.toLowerCase?.() === lowerAddress)
        : [];
    const assignedVotes = Array.isArray(documents)
        ? documents.filter((doc) => doc.isVoter && !doc.processComplete)
        : [];
    const completedVotes = Array.isArray(documents)
        ? documents.filter((doc) => doc.isVoter && doc.hasVoted)
        : [];
    const approvedDocs = Array.isArray(documents)
        ? documents.filter((doc) => doc.approved)
        : [];

    const ProfilePage = () => (
        <div className="page profile-page">
            <GlobalToolBar
                {...toolbarProps}
                isConnected={toolbarProps.isConnected}
            />
            <section className="page-section">
                <div className="section-heading">
                    <p className="eyebrow">Wallet overview</p>
                    <h1>{DAPP_NAME} dashboard</h1>
                    <p className="profile-subtitle">
                        Monitor wallet readiness, review assignments, uploads, and the current document market before triggering contract actions.
                    </p>
                </div>

                {!isSupportedNetwork && (
                    <div className="glass-panel studocu-alert">
                        <h3>Network switch required</h3>
                        <p>Contract reads and writes are disabled until MetaMask is on the configured deployment network.</p>
                    </div>
                )}

                <div className="split-layout profile-layout">
                    <div className="glass-panel profile-card">
                        <img src={metamaskLogo} alt="MetaMask" className="profile-logo" />
                        <h3>Active account</h3>
                        <div className="profile-field">
                            <span>Address</span>
                            <p className="profile-value">{address || 'Not available'}</p>
                        </div>
                        <div className="profile-field">
                            <span>Network</span>
                            <p className="profile-value">
                                {networkType || 'Unknown network'}
                                {!isSupportedNetwork && <em>Unsupported</em>}
                            </p>
                        </div>
                        <div className="profile-field">
                            <span>Balance</span>
                            <p className="profile-value">{balance || '0'} ETH</p>
                        </div>
                    </div>

                    <div className="glass-panel profile-card">
                        <h3>Next action</h3>
                        <div className="action-list">
                            <div className="action-row">
                                <div>
                                    <strong>{isRegistered ? 'Upload notes' : 'Register first'}</strong>
                                    <p>{isRegistered ? `Stake ${fees?.uploadEth || '0.005'} ETH and submit a document.` : `Pay ${fees?.registrationEth || '0.01'} ETH to join the network.`}</p>
                                </div>
                                <Link className="btn btn--primary btn--small" to="/InterfaceDemo/register">
                                    <Icon name="arrowRight" size={16} />
                                    Open
                                </Link>
                            </div>
                            <div className="action-row">
                                <div>
                                    <strong>Voting queue</strong>
                                    <p>{assignedVotes.length} active assignment{assignedVotes.length === 1 ? '' : 's'} for {shortAddress(address)}.</p>
                                </div>
                                <Link className="btn btn--ghost btn--small" to="/InterfaceDemo/vote">
                                    <Icon name="arrowRight" size={16} />
                                    Review
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="metric-grid profile-stats">
                    <div className="metric-card">
                        <span>Registered users</span>
                        <strong>{stats?.totalUsers ?? 0}</strong>
                    </div>
                    <div className="metric-card">
                        <span>Total documents</span>
                        <strong>{stats?.totalDocuments ?? 0}</strong>
                    </div>
                    <div className="metric-card">
                        <span>Your uploads</span>
                        <strong>{myUploads.length}</strong>
                    </div>
                    <div className="metric-card">
                        <span>Approved docs</span>
                        <strong>{approvedDocs.length}</strong>
                    </div>
                    <div className="metric-card">
                        <span>Votes assigned</span>
                        <strong>{assignedVotes.length}</strong>
                    </div>
                    <div className="metric-card">
                        <span>Votes completed</span>
                        <strong>{completedVotes.length}</strong>
                    </div>
                </div>
            </section>
        </div>
    );

    return isConnected ? <ProfilePage /> : <Navigate to='/' />;
}
