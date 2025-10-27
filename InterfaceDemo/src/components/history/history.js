import { Navigate } from "react-router-dom";

import "./history.css";
import "../../global.css";
import { GlobalToolBar } from "../../global";

export default function History(props){
    const displayNum = 8;
    const records = Array.isArray(props.recordList) ? props.recordList.slice(1) : [];
    const filteredRecords = records.filter(Boolean);
    const latestRecords = filteredRecords.slice(-displayNum).reverse();

    const statusMap = {
        1: { label: 'Approved', className: 'status-chip--success' },
        0: { label: 'Invalid', className: 'status-chip--pending' },
        2: { label: 'Rejected', className: 'status-chip--danger' }
    };

    const renderStatus = (status) => {
        const cfg = statusMap[status] || { label: 'Unknown', className: 'status-chip--neutral' };
        return <span className={`status-chip ${cfg.className}`}>{cfg.label}</span>;
    };

    const HistoryPage = () => (
        <div className="page history-page">
            <GlobalToolBar />
            <section className="page-section">
                <div className="section-heading">
                    <p className="eyebrow">Recent activity</p>
                    <h1>Live view of your contract operations</h1>
                    <p className="history-subtitle">
                        Track the latest {displayNum} interactions including gas usage, stored values and approval status.
                    </p>
                </div>

                <div className="glass-panel history-table">
                    <div className="history-table__head">
                        <span>#</span>
                        <span>Account</span>
                        <span>Operation</span>
                        <span>Value</span>
                        <span>Gas used</span>
                        <span>Status</span>
                    </div>
                    <div className="history-table__body">
                        {
                            latestRecords.length === 0 ?
                            <div className="history-empty">
                                <p>No operations yet.</p>
                                <span>Store a value or run a leader action to populate the feed.</span>
                            </div> :
                            latestRecords.map((record) => (
                                <div className="history-row" key={`${record.id}-${record.operation}`}>
                                    <span>{record.id}</span>
                                    <span className="history-cell history-cell--address">{record.address}</span>
                                    <span className="history-cell history-cell--operation">{record.operation}</span>
                                    <span>{record.value?.toString() || '—'}</span>
                                    <span>{record.cost?.toString() || '—'}</span>
                                    <span>{renderStatus(record.status)}</span>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </section>
        </div>
    );

    return props.isConnected ? <HistoryPage /> : <Navigate to='/InterfaceDemo' />;
}
