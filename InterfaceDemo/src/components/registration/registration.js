import { useMemo, useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import './registration.css';
import '../../global.css';
import { GlobalToolBar } from '../../global';
import PDFViewer from './PDFViewer';

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
        onRegister,
        onUpload,
        onAccess,
        address
    } = props;

    const [ipfsHash, setIpfsHash] = useState('');
    const [password, setPassword] = useState('');
    const [flash, setFlash] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingIPFS, setUploadingIPFS] = useState(false);
    const [viewingPDF, setViewingPDF] = useState(null);
    const passwordInputRef = useRef(null);
    const scrollPositionRef = useRef(0);

    const lowerAddress = address?.toLowerCase?.();

    // Prevent scroll when password input value changes
    useEffect(() => {
        if (passwordInputRef.current && document.activeElement === passwordInputRef.current) {
            // Save scroll position before state update
            const scrollY = scrollPositionRef.current || window.scrollY;
            // Restore scroll position after React re-render
            requestAnimationFrame(() => {
                if (document.activeElement === passwordInputRef.current) {
                    window.scrollTo(0, scrollY);
                }
            });
        }
    }, [password]);

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

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) {
            setSelectedFile(null);
            return;
        }

        // Validate PDF
        if (file.type !== 'application/pdf') {
            setFlash({ type: 'danger', text: 'Please select a PDF file.' });
            setSelectedFile(null);
            event.target.value = '';
            return;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setFlash({ type: 'danger', text: 'File size must be less than 10MB.' });
            setSelectedFile(null);
            event.target.value = '';
            return;
        }

        setSelectedFile(file);
        setFlash(null);
    };

    const uploadToIPFS = async (file, onProgress) => {
        // Use ipfs-http-client with public nodes
        // Note: Many public IPFS nodes don't allow uploads or require auth
        // This will try multiple approaches
        try {
            const { create } = await import('ipfs-http-client');
            
            // Try public nodes that might allow uploads
            const publicNodes = [
                { url: 'https://ipfs.infura.io:5001/api/v0', name: 'Infura (requires auth)' },
                { url: 'https://ipfs.io:5001/api/v0', name: 'IPFS.io public node' },
                { url: 'https://dweb.link/api/v0', name: 'dweb.link' },
                { url: 'https://ipfs-gateway.cloud:5001/api/v0', name: 'IPFS Gateway Cloud' }
            ];

            let lastError = null;
            let errors = [];
            
            for (let i = 0; i < publicNodes.length; i++) {
                const node = publicNodes[i];
                try {
                    if (onProgress) {
                        onProgress(`Trying IPFS node ${i + 1}/${publicNodes.length} (${node.name})...`);
                    }
                    
                    const ipfs = create({ 
                        url: node.url,
                        timeout: 30000 // 30 second timeout per node
                    });
                    
                    if (onProgress) {
                        onProgress(`Uploading to ${node.name}... This may take 30-60 seconds.`);
                    }
                    
                    const result = await ipfs.add(file, { 
                        cidVersion: 0,
                        progress: (bytes) => {
                            if (onProgress && file.size > 0) {
                                const percent = Math.round((bytes / file.size) * 100);
                                onProgress(`Uploading to ${node.name}... ${percent}%`);
                            }
                        }
                    });
                    
                    const cid = result.cid?.toString() || result.path || result;
                    if (onProgress) {
                        onProgress(`Successfully uploaded! Hash: ${cid}`);
                    }
                    return cid;
                } catch (nodeErr) {
                    const errorMsg = nodeErr?.message || String(nodeErr);
                    console.warn(`Node ${node.name} failed:`, errorMsg);
                    errors.push(`${node.name}: ${errorMsg}`);
                    lastError = nodeErr;
                    // Try next node
                    continue;
                }
            }
            
            // If all public nodes failed, provide helpful error message
            const errorDetails = errors.join('; ');
            throw new Error(
                `IPFS upload failed. Public nodes may require authentication or don't allow uploads.\n\n` +
                `Errors: ${errorDetails}\n\n` +
                `Alternative: Upload your PDF to Storacha Console (console.storacha.network) or Pinata (pinata.cloud) and paste the IPFS hash manually.`
            );
        } catch (err) {
            console.error('IPFS upload error:', err);
            // Re-throw with better error message
            if (err.message.includes('IPFS upload failed')) {
                throw err;
            }
            throw new Error(`IPFS upload failed: ${err?.message || 'Unknown error'}. Try uploading to Storacha Console (console.storacha.network) and paste the hash manually.`);
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

        let hash = ipfsHash;

        // If file selected but no hash yet, upload to IPFS first
        if (selectedFile && !hash) {
            setUploadingIPFS(true);
            setFlash({ type: 'info', text: 'Uploading file to IPFS... This may take 30-60 seconds.' });
            
            try {
                hash = await uploadToIPFS(selectedFile, (message) => {
                    setFlash({ type: 'info', text: message });
                });
                setIpfsHash(hash);
                setFlash({ type: 'info', text: `File uploaded to IPFS. Submitting to blockchain...` });
            } catch (err) {
                setUploadingIPFS(false);
                setFlash({ type: 'danger', text: err?.message || 'IPFS upload failed. You can paste an IPFS hash manually instead.' });
                return;
            }
        }

        if (!hash) {
            setFlash({ type: 'danger', text: 'Please select a file to upload OR paste an IPFS hash.' });
            setUploadingIPFS(false);
            return;
        }

        // MetaMask opens here to pay 0.005 ETH deposit
        try {
            await onUpload({ ipfsHash: hash, password });
            setFlash({ type: 'success', text: 'Document uploaded. Five voters will be notified automatically.' });
            setIpfsHash('');
            setPassword('');
            setSelectedFile(null);
            // Reset file input
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.value = '';
        } catch (err) {
            setFlash({ type: 'danger', text: err?.message || 'Upload failed.' });
        } finally {
            setUploadingIPFS(false);
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

    const renderDocStatus = (doc) => {
        const progress = doc.votingProgress || { totalVotes: 0, approvals: 0, requiredVoters: 5 };
        if (doc.approved) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <span className="status-chip status-chip--success">Approved</span>
                    <span className="studocu-meta" style={{ fontSize: '0.85rem' }}>
                        {progress.totalVotes}/{progress.requiredVoters} votes ({progress.approvals} approvals)
                    </span>
                </div>
            );
        }
        if (doc.processComplete) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <span className="status-chip status-chip--danger">Rejected</span>
                    <span className="studocu-meta" style={{ fontSize: '0.85rem' }}>
                        {progress.totalVotes}/{progress.requiredVoters} votes ({progress.approvals} approvals)
                    </span>
                </div>
            );
        }
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                <span className="status-chip status-chip--neutral">Pending votes</span>
                <span className="studocu-meta" style={{ fontSize: '0.85rem' }}>
                    {progress.totalVotes}/{progress.requiredVoters} votes ({progress.approvals} approvals)
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
                myUploads.map((doc) => (
                    <div className="studocu-upload-card" key={`upload-${doc.id}`}>
                        <div className="studocu-vote-card-content">
                            <span className="eyebrow">Document #{doc.id}</span>
                            <h4 className="studocu-ipfs-hash" title={doc.ipfsHash || 'IPFS hash not set'}>
                                {doc.ipfsHash ? (doc.ipfsHash.length > 42 ? `${doc.ipfsHash.substring(0, 20)}...${doc.ipfsHash.substring(doc.ipfsHash.length - 10)}` : doc.ipfsHash) : 'IPFS hash not set'}
                            </h4>
                            <p className="studocu-meta">Submitted {formatTimestamp(doc.timestamp)}</p>
                            {doc.ipfsHash && (
                                <div className="studocu-vote-links">
                                    <button
                                        className="btn btn--ghost btn--small"
                                        onClick={() => setViewingPDF(doc.ipfsHash)}
                                    >
                                        👁️ Preview PDF
                                    </button>
                                    <a
                                        href={`https://ipfs.io/ipfs/${doc.ipfsHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn--ghost btn--small"
                                    >
                                        📥 Download
                                    </a>
                                </div>
                            )}
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
                approvedDocs.map((doc) => {
                    const progress = doc.votingProgress || { totalVotes: 0, approvals: 0, requiredVoters: 5 };
                    return (
                    <div className="studocu-approved-card" key={`approved-${doc.id}`}>
                            <div className="studocu-vote-card-content">
                            <span className="eyebrow">Document #{doc.id}</span>
                                <h4 className="studocu-ipfs-hash" title={doc.ipfsHash || 'IPFS hash not set'}>
                                    {doc.ipfsHash ? (doc.ipfsHash.length > 42 ? `${doc.ipfsHash.substring(0, 20)}...${doc.ipfsHash.substring(doc.ipfsHash.length - 10)}` : doc.ipfsHash) : 'IPFS hash not set'}
                                </h4>
                                <p className="studocu-meta">Uploader {doc.uploader ? `${doc.uploader.substring(0, 6)}...${doc.uploader.substring(doc.uploader.length - 4)}` : 'Unknown'}</p>
                                <div className="studocu-vote-progress" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span className="studocu-vote-count">
                                        <strong>Votes: {progress.totalVotes}/{progress.requiredVoters}</strong>
                                    </span>
                                    <span className="studocu-vote-approvals">
                                        ({progress.approvals} approvals)
                                    </span>
                                </div>
                                {doc.ipfsHash && (
                                    <div className="studocu-vote-links">
                                        <button
                                            className="btn btn--ghost btn--small"
                                            onClick={() => setViewingPDF(doc.ipfsHash)}
                                        >
                                            👁️ Preview PDF
                                        </button>
                                        <a
                                            href={`https://ipfs.io/ipfs/${doc.ipfsHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn--ghost btn--small"
                                        >
                                            📥 Download
                                        </a>
                                    </div>
                                )}
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
                <div className="section-heading">
                    <p className="eyebrow">Studocu OnChain</p>
                    <h1>Upload and manage documents</h1>
                    <p className="registration-subtitle">
                        Upload password-protected PDFs for verification. Voters will be randomly selected to review your documents.
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
                            <p className="studocu-hint-small" style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
                                ⚡ Auto-updates every 10 seconds
                            </p>
                        </div>
                        <span className="status-chip status-chip--neutral">
                            {pendingDocs.length} pending · {approvedDocs.length} approved
                        </span>
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
                        <label htmlFor="ipfsHash">IPFS Hash (paste hash if you already have one)</label>
                        <input
                            id="ipfsHash"
                            type="text"
                            placeholder="Qm... (paste IPFS hash here, or upload file below)"
                            value={ipfsHash || ''}
                            onChange={(e) => setIpfsHash(e.target.value)}
                            disabled={uploadingIPFS || !!selectedFile}
                            autoComplete="off"
                        />
                        <p className="studocu-hint-small">
                            Don't have a hash? Upload a file below instead. Or use{' '}
                            <a href="https://console.storacha.network/" target="_blank" rel="noopener noreferrer" style={{textDecoration: 'underline'}}>
                                Storacha Console
                            </a>{' '}
                            to upload and get a hash.
                        </p>
                        {ipfsHash && !selectedFile && (
                            <div className="studocu-file-info">
                                <span className="status-chip status-chip--success">
                                    ✅ Using IPFS Hash: {ipfsHash.substring(0, 20)}...{ipfsHash.substring(ipfsHash.length - 10)}
                                </span>
                            </div>
                        )}
                        <div className="studocu-upload-divider">
                            <span className="eyebrow">OR upload new file</span>
                        </div>
                        <label htmlFor="fileInput">Select PDF File (only if uploading new file to IPFS)</label>
                        <input
                            id="fileInput"
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileSelect}
                            disabled={!canTransact || !isRegistered || isBusy('upload') || uploadingIPFS || !!ipfsHash}
                        />
                        {selectedFile && (
                            <div className="studocu-file-info">
                                <span className="status-chip status-chip--success">
                                    ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                </span>
                                <p className="studocu-hint-small">
                                    File will be uploaded to IPFS when you click "Upload Document"
                                </p>
                            </div>
                        )}
                        <label htmlFor="docPassword">Document Password (required)</label>
                        <input
                            ref={passwordInputRef}
                            id="docPassword"
                            type="text"
                            placeholder="Password to unlock the PDF"
                            value={password || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                scrollPositionRef.current = window.scrollY;
                                setPassword(value);
                            }}
                            onFocus={(e) => {
                                scrollPositionRef.current = window.scrollY;
                            }}
                            onBlur={() => {
                                scrollPositionRef.current = window.scrollY;
                            }}
                            onKeyDown={(e) => {
                                // Prevent form submission on Enter unless button is clicked
                                if (e.key === 'Enter' && e.target.type !== 'submit') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                            }}
                            disabled={!canTransact || !isRegistered || isBusy('upload') || uploadingIPFS}
                            readOnly={false}
                            autoComplete="off"
                        />
                        <p className="studocu-hint-small">
                            The password is required by the contract. It will be stored on-chain and can be accessed by voters after approval.
                        </p>
                        <div className="studocu-upload-actions">
                            <button
                                className="btn btn--primary"
                                type="submit"
                                disabled={!canTransact || !isRegistered || isBusy('upload') || !password || (!selectedFile && !ipfsHash) || uploadingIPFS}
                            >
                                {uploadingIPFS ? 'Uploading to IPFS...' : 
                                 isBusy('upload') ? 'Transaction Pending...' : 
                                 `Upload Document (${uploadFeeLabel})`}
                            </button>
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
                        </div>
                        {uploadingIPFS && (
                            <div className="studocu-file-info">
                                <span className="status-chip status-chip--neutral">
                                    ⏳ Uploading to IPFS... Please wait (this may take 30-60 seconds). MetaMask will open after upload completes.
                                </span>
                </div>
                        )}
                        {isBusy('upload') && !uploadingIPFS && (
                            <div className="studocu-file-info">
                                <span className="status-chip status-chip--pending">
                                    ⏳ Transaction submitted... Please confirm in MetaMask. Your document will appear in "Your uploads" below once confirmed.
                                </span>
                            </div>
                        )}
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
                                <div>
                                    <span>IPFS Hash:</span>
                                    <code className="studocu-ipfs-hash-small">{lastAccess.ipfsHash}</code>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>
            {viewingPDF && (
                <PDFViewer
                    ipfsHash={viewingPDF}
                    onClose={() => setViewingPDF(null)}
                />
            )}
        </div>
    );

    return isConnected ? <RegistrationPage /> : <Navigate to='/' />;
}
