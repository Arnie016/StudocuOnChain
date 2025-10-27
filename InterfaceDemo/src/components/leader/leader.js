import { Navigate } from "react-router-dom";

import "./leader.css";
import "../../global.css";
import { GlobalToolBar } from "../../global";

export default function Leader(props){
    const {
        isConnected,
        commitValHandle,
        revealVal,
        showLeaderHandle,
        resetHandle,
        showLeader,
        commitPending,
        commitDone,
        revealPending,
        revealAccepted,
        resetDone,
        electionOn,
        revealOn,
        elected
    } = props;

    const leaderStatus = elected
        ? <span className="status-chip status-chip--success">Leader elected</span>
        : <span className="status-chip status-chip--neutral">Awaiting reveal</span>;

    const commitStatus = commitPending
        ? <span className="status-chip status-chip--pending">Pending confirmation</span>
        : commitDone && electionOn
            ? <span className="status-chip status-chip--success">Commit accepted</span>
            : <span className="status-chip status-chip--neutral">Enter bit,key</span>;

    const revealStatus = revealPending
        ? <span className="status-chip status-chip--pending">Reveal pending</span>
        : revealAccepted
            ? <span className="status-chip status-chip--success">Reveal accepted</span>
            : revealOn
                ? <span className="status-chip status-chip--neutral">Ready to reveal</span>
                : <span className="status-chip status-chip--neutral">Waiting for commit phase</span>;

    const resetStatus = resetDone
        ? <span className="status-chip status-chip--success">Reset executed</span>
        : electionOn
            ? <span className="status-chip status-chip--pending">Election in progress</span>
            : <span className="status-chip status-chip--neutral">Idle</span>;

    const LeaderPage = () => (
        <div className="page leader-page">
            <GlobalToolBar />
            <section className="page-section">
                <div className="section-heading">
                    <p className="eyebrow">Commit &amp; reveal</p>
                    <h1>Visualize the leader election flow</h1>
                    <p className="leader-subtitle">
                        Two players commit concealed bits, reveal them with matching keys, and the XOR determines the leader.
                        Follow every phase with real-time indicators.
                    </p>
                </div>

                <div className="split-layout leader-layout">
                    <div className="glass-panel leader-panel">
                        <h3>Commit phase</h3>
                        <p>Input your bit and key separated by a comma, then submit to lock your commitment.</p>
                        <input type="text" id="CommitVal" placeholder="bit,key" />
                        <div className="leader-actions">
                            <button className="btn btn--primary" onClick={commitValHandle}>Commit value</button>
                            {commitStatus}
                        </div>
                    </div>

                    <div className="glass-panel leader-panel">
                        <h3>Reveal phase</h3>
                        <p>Once both commitments exist, reveal them using the same bit/key pair.</p>
                        <input type="text" id="RevealVal" placeholder="bit,key" />
                        <div className="leader-actions">
                            <button className="btn btn--primary" onClick={revealVal}>Reveal commitment</button>
                            {revealStatus}
                        </div>
                    </div>
                </div>

                <div className="glass-panel leader-outcome">
                    <div className="leader-outcome__metrics">
                        <div>
                            <span className="eyebrow">Current leader</span>
                            <p className="leader-address">{showLeader}</p>
                            {leaderStatus}
                        </div>
                        <button className="btn btn--ghost" onClick={showLeaderHandle}>Get leader</button>
                    </div>
                    <div className="leader-reset">
                        <div>
                            <span className="eyebrow">Reset election</span>
                            <p>Only the leader can force an instant reset. Others need to wait for the cooldown.</p>
                        </div>
                        <div className="leader-actions">
                            <button className="btn btn--primary" onClick={resetHandle}>Reset</button>
                            {resetStatus}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );

    return isConnected ? <LeaderPage /> : <Navigate to='/InterfaceDemo' />;
}
