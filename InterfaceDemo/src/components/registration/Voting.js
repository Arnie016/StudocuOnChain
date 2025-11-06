import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import './Voting.css';
import '../../global.css';
import { GlobalToolBar } from '../../global';
import PDFViewer from './PDFViewer';
import Avatar from './Avatar';

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

export default function Voting(props) {
    const {
        isConnected,
        contractReady,
        toolbarProps = {},
        isRegistered,
        fees = {},
        documents = [],
        documentsLoading = false,
        pendingAction,
        onVote,
        onRefresh,
        address
    } = props;

    const [viewingPDF, setViewingPDF] = useState(null);

    const lowerAddress = address?.toLowerCase?.();

    // Documents where user is a voter and can vote
    const awaitingVote = useMemo(() => (
        Array.isArray(documents)
            ? documents.filter((doc) => doc.isVoter && !doc.hasVoted && !doc.processComplete)
            : []
    ), [documents]);

    // Documents where user has already voted
    const votedDocs = useMemo(() => (
        Array.isArray(documents)
            ? documents.filter((doc) => doc.isVoter && doc.hasVoted)
            : []
    ), [documents]);

    // Documents where user is the uploader (for tracking their own uploads)
    const myUploadedDocs = useMemo(() => (
        Array.isArray(documents) && lowerAddress
            ? documents.filter((doc) => doc.uploader?.toLowerCase?.() === lowerAddress && !doc.processComplete)
            : []
    ), [documents, lowerAddress]);

    const isBusy = (tag) => pendingAction && pendingAction === tag;
    const canTransact = contractReady && isConnected;
    const voteRewardLabel = fees?.voteRewardEth ? `${fees.voteRewardEth} ETH` : '—';

    const handleVote = async (docId, approval) => {
        if (!onVote) {
            return;
        }
        try {
            await onVote(docId, approval);
        } catch (err) {
            console.error('Vote failed:', err);
        }
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
                awaitingVote.map((doc) => {
                    const progress = doc.votingProgress || { totalVotes: 0, approvals: 0, requiredVoters: 5 };
                    const timeLeft = doc.timeRemaining || 0;
                    const formatTimeRemaining = (seconds) => {
                        if (seconds === 0) return 'Voting closed';
                        const days = Math.floor(seconds / 86400);
                        const hours = Math.floor((seconds % 86400) / 3600);
                        if (days > 0) return `${days}d ${hours}h left`;
                        return `${hours}h left`;
                    };
                    
                    return (
                        <div className="studocu-vote-card" key={`vote-${doc.id}`}>
                            <div className="studocu-vote-card-content">
                                <span className="eyebrow">Document #{doc.id}</span>
                                <h4 className="studocu-ipfs-hash" title={doc.ipfsHash || 'IPFS hash not set'}>
                                    {doc.ipfsHash ? (doc.ipfsHash.length > 42 ? `${doc.ipfsHash.substring(0, 20)}...${doc.ipfsHash.substring(doc.ipfsHash.length - 10)}` : doc.ipfsHash) : 'IPFS hash not set'}
                                </h4>
                                <div className="studocu-uploader">
                                    <Avatar address={doc.uploader} size={24} />
                                    <p className="studocu-meta">Uploaded by {doc.uploader ? `${doc.uploader.substring(0, 6)}...${doc.uploader.substring(doc.uploader.length - 4)}` : 'Unknown'}</p>
                                </div>
                                <p className="studocu-meta">Submitted {formatTimestamp(doc.timestamp)}</p>
                                <div className="studocu-vote-progress">
                                    <span className="studocu-vote-count">
                                        <strong>Votes: {progress.totalVotes}/{progress.requiredVoters}</strong>
                                    </span>
                                    <span className="studocu-vote-approvals">
                                        ({progress.approvals} approvals)
                                    </span>
                                    {timeLeft > 0 && (
                                        <span className="studocu-vote-time">
                                            • {formatTimeRemaining(timeLeft)}
                                        </span>
                                    )}
                                    {timeLeft === 0 && !doc.processComplete && (
                                        <span className="studocu-vote-time">• Voting closed</span>
                                    )}
                                </div>
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
                            </div>
                            <div className="studocu-vote-actions">
                                <button
                                    className="btn btn--ghost"
                                    onClick={() => handleVote(doc.id, false)}
                                    disabled={!canTransact || !isRegistered || isBusy(`vote-${doc.id}`)}
                                >
                                    Reject
                                </button>
                                <button
                                    className="btn btn--primary"
                                    onClick={() => handleVote(doc.id, true)}
                                    disabled={!canTransact || !isRegistered || isBusy(`vote-${doc.id}`)}
                                >
                                    Approve
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );

    const renderCompletedVotes = () => {
        if (votedDocs.length === 0) {
            return null;
        }

        return (
            <div className="studocu-completed-votes">
                <div className="studocu-divider">
                    <span className="eyebrow">Completed votes</span>
                    <p className="studocu-meta">{votedDocs.length} decision{votedDocs.length === 1 ? '' : 's'} already sent.</p>
                </div>
                <div className="studocu-voting">
                    {votedDocs.map((doc) => {
                        const progress = doc.votingProgress || { totalVotes: 0, approvals: 0, requiredVoters: 5 };
                        return (
                            <div className="studocu-vote-card studocu-vote-card--completed" key={`completed-${doc.id}`}>
                                <div className="studocu-vote-card-content">
                                    <span className="eyebrow">Document #{doc.id}</span>
                                    <h4 className="studocu-ipfs-hash" title={doc.ipfsHash || 'IPFS hash not set'}>
                                        {doc.ipfsHash ? (doc.ipfsHash.length > 42 ? `${doc.ipfsHash.substring(0, 20)}...${doc.ipfsHash.substring(doc.ipfsHash.length - 10)}` : doc.ipfsHash) : 'IPFS hash not set'}
                                    </h4>
                                    <p className="studocu-meta">Submitted {formatTimestamp(doc.timestamp)}</p>
                                    <div className="studocu-vote-progress">
                                        <span className="studocu-vote-count">
                                            <strong>Votes: {progress.totalVotes}/{progress.requiredVoters}</strong>
                                        </span>
                                        <span className="studocu-vote-approvals">
                                            ({progress.approvals} approvals)
                                        </span>
                                    </div>
                                    <div className="studocu-vote-status">
                                        {doc.approved ? (
                                            <span className="status-chip status-chip--success">Approved</span>
                                        ) : doc.processComplete ? (
                                            <span className="status-chip status-chip--danger">Rejected</span>
                                        ) : (
                                            <span className="status-chip status-chip--neutral">Pending</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const VotingPage = () => (
        <div className="page voting-page">
            <GlobalToolBar
                {...toolbarProps}
                isConnected={toolbarProps.isConnected}
            />
            <section className="page-section voting-section">
                <div className="section-heading">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div>
                            <p className="eyebrow">Voting Queue</p>
                            <h1>Review and vote on documents</h1>
                            <p className="voting-subtitle">
                                Earn {voteRewardLabel} per vote. Preview documents before making your decision.
                            </p>
                        </div>
                        {onRefresh && (
                            <button
                                className="btn btn--ghost btn--small"
                                onClick={onRefresh}
                                disabled={documentsLoading}
                                title="Refresh voting queue"
                            >
                                🔄 Refresh
                            </button>
                        )}
                    </div>
                </div>

                {!isRegistered && (
                    <div className="glass-panel studocu-alert">
                        <h3>Registration required</h3>
                        <p>You must be registered to vote on documents. Go to the Studocu page to register.</p>
                    </div>
                )}

                <div className="glass-panel voting-queue">
                    <h3>Your voting queue</h3>
                    {renderVoterMarquee()}
                </div>

                {renderCompletedVotes()}

                {myUploadedDocs.length > 0 && (
                    <div className="glass-panel voting-queue">
                        <h3>Your uploaded documents</h3>
                        <p className="studocu-meta">Documents you uploaded (you cannot vote on your own documents)</p>
                        <div className="studocu-voting">
                            {myUploadedDocs.map((doc) => {
                                const progress = doc.votingProgress || { totalVotes: 0, approvals: 0, requiredVoters: 5 };
                                const timeLeft = doc.timeRemaining || 0;
                                const formatTimeRemaining = (seconds) => {
                                    if (seconds === 0) return 'Voting closed';
                                    const days = Math.floor(seconds / 86400);
                                    const hours = Math.floor((seconds % 86400) / 3600);
                                    if (days > 0) return `${days}d ${hours}h left`;
                                    return `${hours}h left`;
                                };

                                return (
                                    <div className="studocu-vote-card studocu-vote-card--uploader" key={`my-upload-${doc.id}`}>
                                        <div className="studocu-vote-card-content">
                                            <span className="eyebrow">Document #{doc.id}</span>
                                            <h4 className="studocu-ipfs-hash" title={doc.ipfsHash || 'IPFS hash not set'}>
                                                {doc.ipfsHash ? (doc.ipfsHash.length > 42 ? `${doc.ipfsHash.substring(0, 20)}...${doc.ipfsHash.substring(doc.ipfsHash.length - 10)}` : doc.ipfsHash) : 'IPFS hash not set'}
                                            </h4>
                                            <p className="studocu-meta">Submitted {formatTimestamp(doc.timestamp)}</p>
                                            <div className="studocu-vote-progress">
                                                <span className="studocu-vote-count">
                                                    <strong>Votes: {progress.totalVotes}/{progress.requiredVoters}</strong>
                                                </span>
                                                <span className="studocu-vote-approvals">
                                                    ({progress.approvals} approvals)
                                                </span>
                                                {timeLeft > 0 && (
                                                    <span className="studocu-vote-time">
                                                        • {formatTimeRemaining(timeLeft)}
                                                    </span>
                                                )}
                                                {timeLeft === 0 && !doc.processComplete && (
                                                    <span className="studocu-vote-time">• Voting closed</span>
                                                )}
                                            </div>
                                            <div className="studocu-vote-status">
                                                {doc.approved ? (
                                                    <span className="status-chip status-chip--success">Approved ✓</span>
                                                ) : doc.processComplete ? (
                                                    <span className="status-chip status-chip--danger">Rejected ✗</span>
                                                ) : (
                                                    <span className="status-chip status-chip--neutral">Pending votes</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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

    return isConnected ? <VotingPage /> : <Navigate to='/' />;
}

