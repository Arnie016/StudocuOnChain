import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import './registration.css';
import '../../global.css';
import { GlobalToolBar } from '../../global';

const formatTimestamp = (ts) => {
    if (!ts) {
        return '—';
    }
    const date = new Date(Number(ts) * 1000);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    return date.toLocaleString();
};

const statusVariant = (isRegistered, contractReady) => {
    if (!contractReady) {
        return 'status-chip--danger';
    }
    return isRegistered ? 'status-chip--success' : 'status-chip--pending';
};

const statusLabel = (isRegistered, contractReady) => {
    if (!contractReady) {
        return 'Contract not configured';
    }
    return isRegistered ? 'Registered' : 'Registration required';
};

const mapFlashVariant = (type) => {
    switch (type) {
        case 'success':
            return 'status-chip--success';
        case 'danger':
            return 'status-chip--danger';
        case 'info':
            return 'status-chip--neutral';
        default:
            return 'status-chip--neutral';
    }
};

export default function Registration(props) {
    const {
        isConnected,
        contractReady,
        toolbarProps = {},
        isRegistered,
        fees = {},
        stats = {},
        documents = [],
        documentsLoading = false,
        pendingAction,
        lastAccess,
        studocuError,
        onRefresh,
        onRegister,
        onUpload,
        onVote,
        onAccess,
        address
    } = props;

    const [ipfsHash, setIpfsHash] = useState('');
    const [password, setPassword] = useState('');
    const [flash, setFlash] = useState(null);

    const lowerAddress = address?.toLowerCase?.();

    const awaitingVote = useMemo(() => (
        Array.isArray(documents)
            ? documents.filter((doc) => doc.isVoter && !doc.hasVoted && !doc.processComplete)
            : []
    ), [documents]);

    const votedDocs = useMemo(() => (
        Array.isArray(documents)
            ? documents.filter((doc) => doc.isVoter && doc.hasVoted)
            : []
    ), [documents]);

    const myUploads = useMemo(() => (
        Array.isArray(documents) && lowerAddress
            ? documents.filter((doc) => doc.uploader?.toLowerCase?.() === lowerAddress)
            : []
    ), [documents, lowerAddress]);

    const approvedDocs = useMemo(() => (
        Array.isArray(documents)
            ? documents.filter((doc) => doc.approved)
            : []
    ), [documents]);

    const pendingDocs = useMemo(() => (
        Array.isArray(documents)
            ? documents.filter((doc) => !doc.approved && !doc.processComplete)
            : []
    ), [documents]);

    const rejectedDocs = useMemo(() => (
        Array.isArray(documents)
            ? documents.filter((doc) => !doc.approved && doc.processComplete)
            : []
    ), [documents]);

    const handleRegister = async () => {
        if (!onRegister) {
            return;
        }
        try {
            await onRegister();
            setFlash({ type: 'success', text: 'Registration transaction confirmed.' });
        } catch (err) {
            setFlash({ type: 'danger', text: err?.message || 'Registration failed.' });
        }
    };

    const handleUpload = async (event) => {
        event.preventDefault();
        if (!onUpload) {
            return;
        }
        if (!ipfsHash || !password) {
            setFlash({ type: 'danger', text: 'Provide both IPFS hash and password.' });
            return;
        }
        try {
            await onUpload({ ipfsHash, password });
            setFlash({ type: 'success', text: 'Document uploaded. Five voters will be notified automatically.' });
            setIpfsHash('');
            setPassword('');
        } catch (err) {
            setFlash({ type: 'danger', text: err?.message || 'Upload failed.' });
        }
    };

    const handleVote = async (docId, approval) => {
        if (!onVote) {
            return;
        }
        try {
            await onVote(docId, approval);
            setFlash({
                type: 'success',
                text: approval ? `Approved document #${docId}.` : `Rejected document #${docId}.`
            });
        } catch (err) {
            setFlash({ type: 'danger', text: err?.message || 'Vote failed.' });
        }
    };

    const handleAccess = async (docId) => {
        if (!onAccess) {
            return;
        }
        try {
            await onAccess(docId);
            setFlash({ type: 'info', text: `Access request for document #${docId} submitted. Password will appear below.` });
        } catch (err) {
            setFlash({ type: 'danger', text: err?.message || 'Access transaction failed.' });
        }
    };

    const handleRefresh = async () => {
        if (!onRefresh) {
            return;
        }
        try {
            await onRefresh();
            setFlash({ type: 'info', text: 'Data refreshed from the chain.' });
        } catch (err) {
            setFlash({ type: 'danger', text: err?.message || 'Refresh failed.' });
        }
    };

    const isBusy = (tag) => pendingAction && pendingAction === tag;
    const anyActionPending = Boolean(pendingAction);
    const canTransact = contractReady && isConnected;

    const registrationFeeLabel = fees?.registrationEth ? `${fees.registrationEth} ETH` : '—';
    const uploadFeeLabel = fees?.uploadEth ? `${fees.uploadEth} ETH` : '—';
    const accessFeeLabel = fees?.accessEth ? `${fees.accessEth} ETH` : '—';
    const voteRewardLabel = fees?.voteRewardEth ? `${fees.voteRewardEth} ETH` : '—';

    const renderDocStatus = (doc) => {
        if (doc.approved) {
            return <span className="status-chip status-chip--success">Approved</span>;
        }
        if (doc.processComplete) {
            return <span className="status-chip status-chip--danger">Rejected</span>;
        }
        return <span className="status-chip status-chip--neutral">Pending votes</span>;
    };

    const renderVoterMarquee = () => (
        <div className="studocu-voting">
            {documentsLoading ? (
                <div className="studocu-empty">
                    <p>Loading assignments...</p>
                </div>
            ) : awaitingVote.length === 0 ? (
                <div className="studocu-empty">
                    <p>No documents awaiting your vote.</p>
                    <span>Assignments update automatically after uploads.</span>
                </div>
            ) : (
                awaitingVote.map((doc) => (
                    <div className="studocu-vote-card" key={`vote-${doc.id}`}>
                        <div>
                            <span className="eyebrow">Document #{doc.id}</span>
                            <h4>{doc.ipfsHash || 'IPFS hash not set'}</h4>
                            <p>Uploaded by {doc.uploader}</p>
                            <p className="studocu-meta">Submitted {formatTimestamp(doc.timestamp)}</p>
                        </div>
                        <div className="studocu-vote-actions">
                            <button
                                className="btn btn--ghost"
                                onClick={() => handleVote(doc.id, false)}
                                disabled={!canTransact || isBusy(`vote-${doc.id}`)}
                            >
                                Reject
                            </button>
                            <button
                                className="btn btn--primary"
                                onClick={() => handleVote(doc.id, true)}
                                disabled={!canTransact || isBusy(`vote-${doc.id}`)}
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderMyUploads = () => (
        <div className="studocu-myuploads">
            {documentsLoading ? (
                <div className="studocu-empty">
                    <p>Syncing your uploads...</p>
                </div>
            ) : myUploads.length === 0 ? (
                <div className="studocu-empty">
                    <p>You have not uploaded documents yet.</p>
                    <span>Once uploaded, approvals and rejections appear here.</span>
                </div>
            ) : (
                myUploads.map((doc) => (
                    <div className="studocu-upload-card" key={`upload-${doc.id}`}>
                        <div>
                            <span className="eyebrow">Document #{doc.id}</span>
                            <h4>{doc.ipfsHash || 'IPFS hash not set'}</h4>
                            <p className="studocu-meta">Submitted {formatTimestamp(doc.timestamp)}</p>
                        </div>
                        <div className="studocu-upload-status">
                            {renderDocStatus(doc)}
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderApprovedDocs = () => (
        <div className="studocu-approved">
            {documentsLoading ? (
                <div className="studocu-empty">
                    <p>Checking approved documents...</p>
                </div>
            ) : approvedDocs.length === 0 ? (
                <div className="studocu-empty">
                    <p>No approved documents yet.</p>
                    <span>Access becomes available once the quorum is met.</span>
                </div>
            ) : (
                approvedDocs.map((doc) => (
                    <div className="studocu-approved-card" key={`approved-${doc.id}`}>
                        <div>
                            <span className="eyebrow">Document #{doc.id}</span>
                            <h4>{doc.ipfsHash || 'IPFS hash not set'}</h4>
                            <p className="studocu-meta">Uploader {doc.uploader}</p>
                        </div>
                        <div className="studocu-approved-actions">
                            <button
                                className="btn btn--primary"
                                onClick={() => handleAccess(doc.id)}
                                disabled={!canTransact || !isRegistered || isBusy(`access-${doc.id}`)}
                            >
                                Access for {accessFeeLabel}
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderSummaryFacts = () => (
        <ul className="studocu-stats">
            <li>
                <span>Registered users</span>
                <strong>{stats?.totalUsers ?? 0}</strong>
            </li>
            <li>
                <span>Total documents</span>
                <strong>{stats?.totalDocuments ?? 0}</strong>
            </li>
            <li>
                <span>Pending decisions</span>
                <strong>{pendingDocs.length}</strong>
            </li>
            <li>
                <span>Rejected</span>
                <strong>{rejectedDocs.length}</strong>
            </li>
        </ul>
    );

    const renderLastAccess = () => (
        <div className="glass-panel studocu-card">
            <h3>Latest access</h3>
            {lastAccess ? (
                <>
                    <p className="studocu-meta">Document #{lastAccess.docId}</p>
                    <div className="studocu-access-block">
                        <span>Password</span>
                        <code>{lastAccess.password}</code>
                        {lastAccess.ipfsHash && (
                            <p className="studocu-meta">IPFS: {lastAccess.ipfsHash}</p>
                        )}
                    </div>
                </>
            ) : (
                <div className="studocu-empty">
                    <p>No passwords retrieved yet.</p>
                    <span>Access an approved document to reveal the password.</span>
                </div>
            )}
        </div>
    );

    const RegistrationPage = () => (
        <div className="page registration-page">
            <GlobalToolBar
                {...toolbarProps}
                isConnected={toolbarProps.isConnected}
            />
            <section className="page-section studocu-section">
                <div className="section-heading">
                    <p className="eyebrow">Studocu OnChain</p>
                    <h1>Run the document verification flow</h1>
                    <p className="registration-subtitle">
                        Register, upload password-protected PDFs, let randomly selected voters review, and unlock access for the community.
                    </p>
                </div>

                {flash && (
                    <div className={`status-chip ${mapFlashVariant(flash.type)} studocu-flash`}>
                        {flash.text}
                    </div>
                )}

                {studocuError && (
                    <div className="status-chip status-chip--danger studocu-flash">
                        {studocuError}
                    </div>
                )}

                {!contractReady && (
                    <div className="glass-panel studocu-alert">
                        <h3>Contract address not configured</h3>
                        <p>
                            Update <code>CONTRACT_ADDRESS_STUDOCU</code> in <code>src/contracts/studocu_config.js</code> to point to your deployed StudocuOnChain contract.
                            All actions remain disabled until a valid address is supplied.
                        </p>
                    </div>
                )}

                <div className="card-grid studocu-overview">
                    <div className="glass-panel studocu-card">
                        <h3>Registration</h3>
                        <p className="studocu-meta">Fee: {registrationFeeLabel}</p>
                        <div className={`status-chip ${statusVariant(isRegistered, contractReady)}`}>
                            {statusLabel(isRegistered, contractReady)}
                        </div>
                        <button
                            className="btn btn--primary studocu-primary-btn"
                            onClick={handleRegister}
                            disabled={!canTransact || isRegistered || isBusy('register')}
                        >
                            {isRegistered ? 'You are registered' : `Register for ${registrationFeeLabel}`}
                        </button>
                        <p className="studocu-footnote">Registration opens uploads, voting, and access privileges.</p>
                    </div>

                    <div className="glass-panel studocu-card">
                        <h3>Network metrics</h3>
                        {renderSummaryFacts()}
                        <div className="studocu-card-actions">
                            <button
                                className="btn btn--ghost"
                                onClick={handleRefresh}
                                disabled={anyActionPending}
                            >
                                Refresh data
                            </button>
                            <span className="status-chip status-chip--neutral">Vote reward {voteRewardLabel}</span>
                        </div>
                    </div>

                    {renderLastAccess()}
                </div>

                <div className="glass-panel studocu-upload">
                    <div className="studocu-upload-header">
                        <div>
                            <h3>Upload new document</h3>
                            <p className="studocu-meta">
                                Deposit {uploadFeeLabel}. Funds return automatically once the document reaches the approval quorum.
                            </p>
                        </div>
                        <span className="status-chip status-chip--neutral">
                            {pendingDocs.length} pending · {approvedDocs.length} approved
                        </span>
                    </div>
                    <form className="studocu-upload-form" onSubmit={handleUpload}>
                        <label htmlFor="ipfsHash">IPFS hash</label>
                        <input
                            id="ipfsHash"
                            type="text"
                            placeholder="Qm..."
                            value={ipfsHash}
                            onChange={(event) => setIpfsHash(event.target.value)}
                            disabled={!canTransact || !isRegistered || isBusy('upload')}
                        />
                        <label htmlFor="docPassword">Document password</label>
                        <input
                            id="docPassword"
                            type="text"
                            placeholder="Password to unlock the PDF"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            disabled={!canTransact || !isRegistered || isBusy('upload')}
                        />
                        <div className="studocu-upload-actions">
                            <button
                                className="btn btn--primary"
                                type="submit"
                                disabled={!canTransact || !isRegistered || isBusy('upload')}
                            >
                                Upload for {uploadFeeLabel}
                            </button>
                            {!isRegistered && (
                                <span className="status-chip status-chip--pending">
                                    Register first to submit documents
                                </span>
                            )}
                        </div>
                    </form>
                </div>

                <div className="split-layout studocu-columns">
                    <div className="glass-panel studocu-column">
                        <h3>Your voting queue</h3>
                        <p className="studocu-meta">Earn {voteRewardLabel} per vote.</p>
                        {renderVoterMarquee()}
                        {votedDocs.length > 0 && (
                            <div className="studocu-divider">
                                <span className="eyebrow">Completed votes</span>
                                <p className="studocu-meta">{votedDocs.length} decision{votedDocs.length === 1 ? '' : 's'} already sent.</p>
                            </div>
                        )}
                    </div>
                    <div className="glass-panel studocu-column">
                        <h3>Your uploads</h3>
                        {renderMyUploads()}
                    </div>
                </div>

                <div className="glass-panel studocu-column">
                    <h3>Approved documents</h3>
                    <p className="studocu-meta">Pay {accessFeeLabel} to retrieve the password instantly.</p>
                    {renderApprovedDocs()}
                </div>
            </section>
        </div>
    );

    return isConnected ? <RegistrationPage /> : <Navigate to='/' />;
}
