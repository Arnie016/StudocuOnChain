import { useMemo, useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import './registration.css';
import '../../global.css';
import { GlobalToolBar } from '../../global';
import PDFViewer from './PDFViewer';
import { buildIpfsUrl, shortIpfsHash, normalizeIpfsInput } from '../../utils/ipfs';

const LOCAL_PREVIEW_PATH = '/demo/A0273649N_ArnavSalkade_hw5 (1).pdf';
const LOCAL_PREVIEW_URL = `${process.env.PUBLIC_URL || ''}${LOCAL_PREVIEW_PATH}`;

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

const voteCountClass = (progress) => {
    const approvals = Number(progress?.approvals || 0);
    if (approvals >= 3) {
        return 'studocu-vote-count studocu-vote-count--ready';
    }
    if (approvals >= 1) {
        return 'studocu-vote-count studocu-vote-count--warning';
    }
    return 'studocu-vote-count';
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
        onRegister,
        onUpload,
        onAccess,
        onRefresh,
        address
    } = props;

    const [ipfsHash, setIpfsHash] = useState('');
    const [password, setPassword] = useState('');
    const [flash, setFlash] = useState(null);
    const [viewingPDF, setViewingPDF] = useState(null);
    const [viewerFallbackUrl, setViewerFallbackUrl] = useState(null);
    const [viewerPassword, setViewerPassword] = useState(null);
    const [accessPreviewInput, setAccessPreviewInput] = useState('');
    const [accessHistory, setAccessHistory] = useState([]);
    const passwordInputRef = useRef(null);

    const openPdfViewer = (hash, docPassword = null) => {
        if (!hash) {
            return;
        }
        setViewerPassword(docPassword);
        setViewingPDF(hash);
        setViewerFallbackUrl(LOCAL_PREVIEW_URL);
    };

    useEffect(() => {
        setAccessPreviewInput('');
    }, [lastAccess]);

    useEffect(() => {
        if (!lastAccess || !lastAccess.docId) {
            return;
        }

        setAccessHistory((prev) => {
            const exists = prev.some((item) => item.docId === lastAccess.docId && item.timestamp === lastAccess.timestamp);
            if (exists) {
                return prev;
            }

            const entry = {
                docId: lastAccess.docId,
                password: lastAccess.password,
                ipfsHash: lastAccess.ipfsHash,
                timestamp: lastAccess.timestamp
            };

            const updated = [entry, ...prev];
            return updated.slice(0, 5);
        });
    }, [lastAccess]);

    const lowerAddress = address?.toLowerCase?.();
    const lastAccessDownloadUrl = lastAccess?.ipfsHash ? buildIpfsUrl(lastAccess.ipfsHash) : '';

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
        if (event && event.preventDefault) {
        event.preventDefault();
        }
        if (!onUpload) {
            return;
        }

        if (!password) {
            setFlash({ type: 'danger', text: 'Please enter a document password.' });
            return;
        }

        if (!ipfsHash) {
            setFlash({ type: 'danger', text: 'Please enter an IPFS hash.' });
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

    const isBusy = (tag) => pendingAction && pendingAction === tag;
    const canTransact = contractReady && isConnected;

    const registrationFeeLabel = fees?.registrationEth ? `${fees.registrationEth} ETH` : '—';
    const uploadFeeLabel = fees?.uploadEth ? `${fees.uploadEth} ETH` : '—';
    const accessFeeLabel = fees?.accessEth ? `${fees.accessEth} ETH` : '—';

    const formatIpfsLabel = (hash) => {
        if (!hash) {
            return 'IPFS hash not set';
        }
        const pretty = shortIpfsHash(hash);
        return pretty || 'IPFS hash not set';
    };

    const fullHashTitle = (hash) => {
        const normalized = normalizeIpfsInput(hash);
        return normalized || 'IPFS hash not set';
    };

    const renderDocStatus = (doc) => {
        const progress = doc.votingProgress || { totalVotes: 0, approvals: 0, requiredVoters: 5 };
        const countClass = voteCountClass(progress);
        if (doc.approved) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <span className="status-chip status-chip--success">Approved</span>
                    <span className={countClass}>
                        Votes: {progress.totalVotes}/{progress.requiredVoters}
                    </span>
                </div>
            );
        }
        if (doc.processComplete) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <span className="status-chip status-chip--danger">Rejected</span>
                    <span className={countClass}>
                        Votes: {progress.totalVotes}/{progress.requiredVoters}
                    </span>
                </div>
            );
        }
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                <span className="status-chip status-chip--neutral">Pending votes</span>
                <span className={countClass}>
                    Votes: {progress.totalVotes}/{progress.requiredVoters}
                </span>
                    </div>
        );
    };


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
                myUploads.map((doc) => {
                    const downloadUrl = buildIpfsUrl(doc.ipfsHash);
                    return (
                    <div className="studocu-upload-card" key={`upload-${doc.id}`}>
                        <div className="studocu-vote-card-content">
                            <span className="eyebrow">Document #{doc.id}</span>
                            <h4 className="studocu-ipfs-hash" title={fullHashTitle(doc.ipfsHash)}>
                                {formatIpfsLabel(doc.ipfsHash)}
                            </h4>
                            <p className="studocu-meta">Submitted {formatTimestamp(doc.timestamp)}</p>
                            {doc.ipfsHash && (
                                <div className="studocu-vote-links">
                                    {downloadUrl ? (
                                        <a
                                            href={downloadUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn--ghost btn--small"
                                        >
                                            📥 Download
                                        </a>
                                    ) : (
                                        <span className="studocu-meta" style={{ fontSize: '0.8rem' }}>
                                            Invalid IPFS link
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="studocu-upload-status">
                            {renderDocStatus(doc)}
                        </div>
                    </div>
                );
                })
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
                approvedDocs.map((doc) => {
                    const progress = doc.votingProgress || { totalVotes: 0, approvals: 0, requiredVoters: 5 };
                    const voteClass = voteCountClass(progress);
                    return (
                    <div className="studocu-approved-card" key={`approved-${doc.id}`}>
                            <div className="studocu-vote-card-content">
                            <span className="eyebrow">Document #{doc.id}</span>
                                <h4 className="studocu-ipfs-hash" title={fullHashTitle(doc.ipfsHash)}>
                                    {formatIpfsLabel(doc.ipfsHash)}
                                </h4>
                                <p className="studocu-meta">Uploader {doc.uploader ? `${doc.uploader.substring(0, 6)}...${doc.uploader.substring(doc.uploader.length - 4)}` : 'Unknown'}</p>
                                <div className="studocu-vote-progress" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span className={voteClass}>
                                        Votes: {progress.totalVotes}/{progress.requiredVoters}
                                    </span>
                                </div>
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
    );
                })
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
                <div className="section-heading studocu-heading">
                    <div>
                    <p className="eyebrow">Studocu OnChain</p>
                        <h1>Upload and manage documents</h1>
                    <p className="registration-subtitle">
                            Upload password-protected PDFs for verification. Voters will be randomly selected to review your documents.
                    </p>
                    </div>
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
                    </div>

                    <div className="glass-panel studocu-card studocu-stats-card">
                        <h3>Network Stats</h3>
                        <ul className="studocu-stats-compact">
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
                    </div>
                </div>

                <div className="glass-panel studocu-upload">
                    <div className="studocu-upload-header">
                        <div>
                            <h3>Upload new document</h3>
                            <p className="studocu-meta">
                                Deposit {uploadFeeLabel}. Funds return automatically once the document reaches the approval quorum.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="status-chip status-chip--neutral">
                            {pendingDocs.length} pending · {approvedDocs.length} approved
                        </span>
                            {onRefresh && (
                                <button
                                    className="btn btn--ghost btn--small"
                                    onClick={onRefresh}
                                    disabled={documentsLoading}
                                    title="Refresh data"
                                >
                                    🔄 Refresh
                                </button>
                            )}
                        </div>
                    </div>
                    <form 
                        className="studocu-upload-form" 
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleUpload(e);
                        }}
                        onKeyDown={(e) => {
                            // Prevent form submission on Enter key in input fields
                            if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }}
                    >
                        <label htmlFor="ipfsHashInput">IPFS Hash (required)</label>
                        <div className="studocu-hash-row">
                        <input
                                id="ipfsHashInput"
                            type="text"
                                placeholder="bafy... or Qm..."
                            value={ipfsHash}
                                onChange={(e) => setIpfsHash(e.target.value.trim())}
                                autoComplete="off"
                            />
                            <button
                                className="btn btn--primary"
                                type="submit"
                                disabled={!canTransact || !isRegistered || isBusy('upload') || !password || !ipfsHash}
                            >
                                Upload
                            </button>
                        </div>
                        <label htmlFor="docPassword">Document Password (required)</label>
                        <input
                            ref={passwordInputRef}
                            id="docPassword"
                            type="text"
                            placeholder="Password to unlock the PDF"
                            value={password || ''}
                            onChange={(e) => {
                                setPassword(e.target.value);
                            }}
                            onKeyDown={(e) => {
                                // Prevent form submission on Enter unless button is clicked
                                if (e.key === 'Enter' && e.target.type !== 'submit') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                            }}
                            disabled={isBusy('upload')}
                            autoComplete="off"
                        />
                        <p className="studocu-hint-small">
                            The password is required by the contract. It will be stored on-chain and can be accessed by voters after approval.
                        </p>
                        <div className="studocu-upload-messages">
                            {!isRegistered && (
                                <span className="status-chip status-chip--pending">
                                    Register first to submit documents
                                </span>
                            )}
                            {isBusy('upload') && (
                                <span className="status-chip status-chip--pending">
                                    ⏳ Transaction pending... Waiting for confirmation
                                </span>
                            )}
                            {!isBusy('upload') && isRegistered && canTransact && (
                                <span className="status-chip status-chip--neutral">
                                    Upload fee: {uploadFeeLabel}
                                </span>
                            )}
                        </div>
                    </form>

                    <div className="studocu-upload-history">
                        <h3>Your uploads</h3>
                        {renderMyUploads()}
                    </div>
                </div>

                <div className="glass-panel studocu-column">
                    <h3>Approved documents</h3>
                    <p className="studocu-meta">Pay {accessFeeLabel} to retrieve the password instantly.</p>
                    {renderApprovedDocs()}
                </div>

                {lastAccess && (
                    <div className="glass-panel studocu-access-result">
                        <h3>Access Result</h3>
                        <p className="studocu-meta">Document #{lastAccess.docId}</p>
                        <div className="studocu-access-block">
                            <div>
                                <span>Password:</span>
                                <code>{lastAccess.password}</code>
                            </div>
                            {lastAccess.ipfsHash && (
                                <>
                                    <div>
                                        <span>IPFS Hash:</span>
                                        <code className="studocu-ipfs-hash-small">{lastAccess.ipfsHash}</code>
                                    </div>
                        <div className="studocu-access-links">
                                        {lastAccessDownloadUrl && (
                                            <a
                                                href={lastAccessDownloadUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn--ghost btn--small"
                                            >
                                                📥 Download PDF
                                            </a>
                                        )}
                                        <div className="studocu-access-password">
                                            <input
                                                type="text"
                                                placeholder="Enter password to preview"
                                                value={accessPreviewInput}
                                                onChange={(e) => setAccessPreviewInput(e.target.value)}
                                                className="studocu-access-input"
                                            />
                                            <button
                                                type="button"
                                                className="btn btn--ghost btn--small"
                                                onClick={() => openPdfViewer(lastAccess.ipfsHash, accessPreviewInput)}
                                                disabled={!accessPreviewInput}
                                            >
                                                👁️ Preview
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {accessHistory.length > 0 && (
                    <div className="glass-panel studocu-access-history">
                        <h3>Recent Access History</h3>
                        <ul>
                            {accessHistory.map((entry) => (
                                <li key={`${entry.docId}-${entry.timestamp}`} className="studocu-access-history-item">
                                    <div>
                                        <span>Doc #{entry.docId}</span>
                                        <code className="studocu-ipfs-hash-small">{entry.ipfsHash}</code>
                                    </div>
                                    <div className="studocu-access-history-meta">
                                        <span>Retrieved {new Date(entry.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className="studocu-access-history-actions">
                                        <button
                                            type="button"
                                            className="btn btn--ghost btn--small"
                                            onClick={() => openPdfViewer(entry.ipfsHash, entry.password)}
                                        >
                                            👁️ Preview
                                        </button>
                                        <span className="studocu-access-history-password">🔐 {entry.password}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>
            {viewingPDF && (
                <PDFViewer
                    ipfsHash={viewingPDF}
                    pdfPassword={viewerPassword || undefined}
                    fallbackUrl={viewerFallbackUrl}
                    onClose={() => {
                        setViewingPDF(null);
                        setViewerPassword(null);
                        setViewerFallbackUrl(null);
                    }}
                />
            )}
        </div>
    );

    return isConnected ? <RegistrationPage /> : <Navigate to='/' />;
}
