import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import './registration.css';
import '../../global.css';
import { GlobalToolBar } from '../../global';
import { CONTRACT_ABI_STUDOCU, CONTRACT_ADDRESS_STUDOCU } from '../../contracts/studocu_config';
import Web3 from 'web3';

export default function Registration(props) {
    const { address, isConnected } = props;
    const [isPending, setIsPending] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [error, setError] = useState(null);

    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(CONTRACT_ABI_STUDOCU, CONTRACT_ADDRESS_STUDOCU);

    const registerUser = async () => {
        if (!isConnected) {
            setError("Please connect your wallet first");
            return;
        }

        setIsPending(true);
        setError(null);

        try {
            await contract.methods.registerUser().send({
                from: address,
                value: web3.utils.toWei('0.01', 'ether')
            });
            setIsRegistered(true);
        } catch (err) {
            setError(err.message);
            console.error('Registration error:', err);
        } finally {
            setIsPending(false);
        }
    };

    const RegistrationPage = () => (
        <div className="page registration-page page--centered">
            <GlobalToolBar />
            <section className="page-section">
                <div className="section-heading">
                    <p className="eyebrow">Join the network</p>
                    <h1>Register to Upload & Vote</h1>
                    <p className="registration-subtitle">
                        Pay 0.01 ETH to join the StudocuOnChain network and start uploading or voting on documents.
                    </p>
                </div>

                <div className="glass-panel registration-card">
                    <h3>Network Registration</h3>
                    <p className="registration-fee">
                        Registration Fee: <strong>0.01 ETH</strong>
                    </p>
                    
                    {error && (
                        <div className="status-chip status-chip--danger">
                            {error}
                        </div>
                    )}

                    {isRegistered ? (
                        <div className="registration-success">
                            <div className="status-chip status-chip--success">
                                Successfully Registered
                            </div>
                            <p>You can now upload documents and vote!</p>
                        </div>
                    ) : (
                        <button
                            className="btn btn--primary"
                            onClick={registerUser}
                            disabled={isPending || !isConnected}
                        >
                            {isPending ? 'Processing...' : 'Register for 0.01 ETH'}
                        </button>
                    )}
                </div>
            </section>
        </div>
    );

    return isConnected ? <RegistrationPage /> : <Navigate to='/EE4032' />;
}

