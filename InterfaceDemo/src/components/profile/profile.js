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

                <div className="profile-layout">
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

                    <div />
                </div>

                <div />
            </section>
        </div>
    );

    return isConnected ? <ProfilePage /> : <Navigate to='/' />;
}
