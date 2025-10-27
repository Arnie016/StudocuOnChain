import { Navigate } from "react-router-dom";

import "./storage.css";
import "../../global.css";
import { GlobalToolBar } from "../../global";

export default function Storage(props){
    const renderStoreStatus = () => {
        if (props.storedPending) {
            return <span className="status-chip status-chip--pending">Transaction pending</span>;
        }
        if (props.storedDone) {
            return <span className="status-chip status-chip--success">Stored on-chain</span>;
        }
        return <span className="status-chip status-chip--neutral">Awaiting input</span>;
    };

    const StoragePage = () => (
        <div className="page storage-page">
            <GlobalToolBar />
            <section className="page-section">
                <div className="section-heading">
                    <p className="eyebrow">SimpleStorage contract</p>
                    <h1>Store &amp; read values with a modern interface</h1>
                    <p className="storage-subtitle">
                        The contract lives in <code>src/contracts/SimpleStorage.sol</code>. Enter a uint value, push it on-chain,
                        and immediately retrieve the latest stored state using the controls below.
                    </p>
                </div>

                <div className="split-layout storage-layout">
                    <div className="glass-panel storage-panel storage-panel--intro">
                        <h3>How it works</h3>
                        <ol>
                            <li>Type any positive integer and hit “Store value”.</li>
                            <li>Wait for MetaMask to confirm the transaction.</li>
                            <li>Click “Get latest value” to read from the contract.</li>
                        </ol>
                        <div className="storage-cta">
                            <span className="status-chip status-chip--neutral">Gas optimized</span>
                            <span className="status-chip status-chip--neutral">Event logged</span>
                        </div>
                    </div>

                    <div className="glass-panel storage-panel storage-panel--actions">
                        <label htmlFor="inputVal">Value to store</label>
                        <input type="number" id="inputVal" placeholder="Enter a positive integer" min="0" />
                        <div className="storage-actions">
                            <button className="btn btn--primary" onClick={props.storeValHandle}>
                                Store value
                            </button>
                            <button className="btn btn--ghost" onClick={props.showValHandle}>
                                Get latest value
                            </button>
                        </div>
                        <div className="storage-status">
                            {renderStoreStatus()}
                            <div className="storage-readout">
                                <span>Current stored value</span>
                                <p className="storage-value">{props.showVal}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );

    return props.isConnected ? <StoragePage /> : <Navigate to='/InterfaceDemo' />;
}
