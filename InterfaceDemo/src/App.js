import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import Web3 from "web3";

import "./App.css";
import Login from "./components/login/login";
import Profile from "./components/profile/profile";
import Storage from "./components/storage/storage";
import History from "./components/history/history";
import Leader from "./components/leader/leader";
import Registration from "./components/registration/registration";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./contracts/config";
import { CONTRACT_ABI_2, CONTRACT_ADDRESS_2 } from "./contracts/config_2";
import { CONTRACT_ABI_STUDOCU, CONTRACT_ADDRESS_STUDOCU } from "./contracts/studocu_config";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const CHAIN_LABELS = {
    "0x1": "Ethereum Mainnet",
    "0x3": "Ropsten Test Network",
    "0x4": "Rinkeby Test Network",
    "0x5": "Goerli Test Network",
    "0xaa36a7": "Sepolia Test Network"
};

const resolveNetworkLabel = (chainId) => CHAIN_LABELS[chainId] || "Unsupported Network";

const isValidAddress = (value) => value && value.toLowerCase() !== ZERO_ADDRESS;

const pickEthereumProvider = () => {
    if (typeof window === "undefined") {
        return null;
    }
    const { ethereum } = window;
    if (!ethereum) {
        return null;
    }
    if (Array.isArray(ethereum.providers) && ethereum.providers.length > 0) {
        const metamaskProvider = ethereum.providers.find((provider) => provider.isMetaMask);
        if (metamaskProvider) {
            return metamaskProvider;
        }
        return ethereum.providers[0];
    }
    return ethereum;
};

export default function App() {
    const [haveMetamask, setHaveMetamask] = useState(true);
    const [ethereumProvider, setEthereumProvider] = useState(null);
    const [provider, setProvider] = useState(null);
    const [web3, setWeb3] = useState(null);
    const [storageContract, setStorageContract] = useState(null);
    const [leaderContract, setLeaderContract] = useState(null);
    const [studocuContract, setStudocuContract] = useState(null);

    const [address, setAddress] = useState(null);
    const [network, setNetwork] = useState(null);
    const [balance, setBalance] = useState("0");
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectError, setConnectError] = useState(null);

    const [storedPending, setStoredPending] = useState(false);
    const [storedDone, setStoredDone] = useState(false);
    const [showVal, setShowVal] = useState(0);

    const [historyRecord, setHistoryRecord] = useState([]);
    const maxRecordLen = 50;
    const recordIdRef = useRef(0);

    const [commitPending, setCommitPending] = useState(false);
    const [commitDone, setCommitDone] = useState(false);
    const [revealPending, setRevealPending] = useState(false);
    const [revealAccepted, setRevealAccepted] = useState(false);
    const [resetDone, setResetDone] = useState(false);
    const [showLead, setShowLead] = useState(ZERO_ADDRESS);
    const [electionOn, setElectionOn] = useState(false);
    const [revealOn, setRevealOn] = useState(false);
    const [elected, setElected] = useState(false);

    const [studocuReady, setStudocuReady] = useState(false);
    const [studocuRegistered, setStudocuRegistered] = useState(false);
    const [studocuFees, setStudocuFees] = useState({
        registrationWei: null,
        registrationEth: null,
        uploadWei: null,
        uploadEth: null,
        accessWei: null,
        accessEth: null,
        voteRewardWei: null,
        voteRewardEth: null
    });
    const [studocuStats, setStudocuStats] = useState({
        totalDocuments: 0,
        totalUsers: 0
    });
    const [studocuDocs, setStudocuDocs] = useState([]);
    const [studocuDocsLoading, setStudocuDocsLoading] = useState(false);
    const [studocuError, setStudocuError] = useState(null);
    const [studocuPendingAction, setStudocuPendingAction] = useState(null);
    const [studocuLastAccess, setStudocuLastAccess] = useState(null);

    const navigate = useNavigate();

    // Detect injected provider and prefer MetaMask when multiple wallets exist
    useEffect(() => {
        const selectedProvider = pickEthereumProvider();
        if (!selectedProvider) {
            setHaveMetamask(false);
            setEthereumProvider(null);
            return;
        }

        setHaveMetamask(Boolean(selectedProvider.isMetaMask));
        setEthereumProvider(selectedProvider);
    }, []);

    useEffect(() => {
        if (!ethereumProvider) {
            setProvider(null);
            setWeb3(null);
            return;
        }

        setProvider(new ethers.providers.Web3Provider(ethereumProvider, "any"));
        setWeb3(new Web3(ethereumProvider));
    }, [ethereumProvider]);

    // Build contract instances once web3 is ready
    useEffect(() => {
        if (!web3) {
            setStorageContract(null);
            setLeaderContract(null);
            setStudocuContract(null);
            setStudocuReady(false);
            return;
        }

        setStorageContract(new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS));
        setLeaderContract(new web3.eth.Contract(CONTRACT_ABI_2, CONTRACT_ADDRESS_2));

        if (isValidAddress(CONTRACT_ADDRESS_STUDOCU)) {
            const contractInstance = new web3.eth.Contract(CONTRACT_ABI_STUDOCU, CONTRACT_ADDRESS_STUDOCU);
            setStudocuContract(contractInstance);
            setStudocuReady(true);
        } else {
            setStudocuContract(null);
            setStudocuReady(false);
        }
    }, [web3]);

    const refreshBalance = useCallback(async (account) => {
        if (!provider || !account) {
            return;
        }
        try {
            const balanceVal = await provider.getBalance(account);
            setBalance(ethers.utils.formatEther(balanceVal));
        } catch (err) {
            console.error("Failed to refresh balance", err);
        }
    }, [provider]);

    const handleAccountsChanged = useCallback(async (accounts) => {
        if (!accounts || accounts.length === 0) {
            setAddress(null);
            setBalance("0");
            setIsConnected(false);
            navigate("/");
            return;
        }

        const account = accounts[0];
        setAddress(account);
        setIsConnected(true);
        await refreshBalance(account);
    }, [navigate, refreshBalance]);

    const handleChainChanged = useCallback(async (chainId) => {
        setNetwork(resolveNetworkLabel(chainId));
        if (ethereumProvider) {
            setProvider(new ethers.providers.Web3Provider(ethereumProvider, "any"));
            setWeb3(new Web3(ethereumProvider));
        }
        await refreshBalance(address);
    }, [address, ethereumProvider, refreshBalance]);

    // Subscribe to MetaMask events
    useEffect(() => {
        if (!ethereumProvider?.on) {
            return undefined;
        }

        ethereumProvider.on("accountsChanged", handleAccountsChanged);
        ethereumProvider.on("chainChanged", handleChainChanged);

        return () => {
            ethereumProvider.removeListener?.("accountsChanged", handleAccountsChanged);
            ethereumProvider.removeListener?.("chainChanged", handleChainChanged);
        };
    }, [ethereumProvider, handleAccountsChanged, handleChainChanged]);

    const connectWallet = useCallback(async () => {
        if (!ethereumProvider) {
            setHaveMetamask(false);
            setConnectError("MetaMask is not installed");
            return;
        }

        setIsConnecting(true);
        setConnectError(null);

        try {
            const accounts = await ethereumProvider.request({ method: "eth_requestAccounts" });
            const chainId = await ethereumProvider.request({ method: "eth_chainId" });

            await handleAccountsChanged(accounts);
            setNetwork(resolveNetworkLabel(chainId));
            setIsConnected(true);
            navigate("/InterfaceDemo/profile");
        } catch (error) {
            console.error("Failed to connect wallet", error);
            setConnectError(error?.message || "Unable to connect to wallet");
            setIsConnected(false);
        } finally {
            setIsConnecting(false);
        }
    }, [ethereumProvider, handleAccountsChanged, navigate]);

    const storeData = useCallback(async (inputVal) => {
        if (!storageContract || !address) {
            throw new Error("Storage contract is not ready");
        }
        return storageContract.methods.set(inputVal).send({ from: address });
    }, [storageContract, address]);

    const getData = useCallback(async () => {
        if (!storageContract) {
            throw new Error("Storage contract is not ready");
        }
        return storageContract.methods.get().call();
    }, [storageContract]);

    const getLeader = useCallback(async () => {
        if (!leaderContract) {
            throw new Error("Leader contract is not ready");
        }
        return leaderContract.methods.get_leader().call();
    }, [leaderContract]);

    const pushHistoryRecord = useCallback((operation, value = "", detail = null) => {
        recordIdRef.current += 1;

        let status = 1;
        let cost = 0;

        if (!value && value !== 0) {
            status = 0;
            cost = "NA";
        } else if (operation !== "get") {
            if (detail === "null") {
                status = 2;
                cost = "NA";
            } else if (detail?.gasUsed) {
                status = 1;
                cost = detail.gasUsed;
            } else {
                cost = "";
            }
        }

        const newRecord = {
            id: recordIdRef.current,
            address,
            operation,
            value,
            cost,
            status
        };

        setHistoryRecord((current) => {
            const updated = [...current, newRecord];
            if (updated.length > maxRecordLen) {
                updated.shift();
            }
            return updated;
        });
    }, [address]);

    const formatWeiToEth = useCallback((value) => {
        if (value === null || value === undefined) {
            return "0";
        }
        try {
            return ethers.utils.formatEther(value.toString());
        } catch (err) {
            if (web3?.utils?.fromWei) {
                return web3.utils.fromWei(value.toString(), "ether");
            }
            return value.toString();
        }
    }, [web3]);

    const refreshStudocuSummary = useCallback(async () => {
        if (!studocuContract) {
            setStudocuFees({
                registrationWei: null,
                registrationEth: null,
                uploadWei: null,
                uploadEth: null,
                accessWei: null,
                accessEth: null,
                voteRewardWei: null,
                voteRewardEth: null
            });
            setStudocuStats({ totalDocuments: 0, totalUsers: 0 });
            return;
        }

        try {
            const [registrationFee, uploadDeposit, accessFee, voteReward, totalDocumentsRaw, totalUsersRaw] = await Promise.all([
                studocuContract.methods.REGISTRATION_FEE().call(),
                studocuContract.methods.UPLOAD_DEPOSIT().call(),
                studocuContract.methods.ACCESS_FEE().call(),
                studocuContract.methods.VOTE_REWARD().call(),
                studocuContract.methods.totalDocuments().call(),
                studocuContract.methods.totalUsers().call()
            ]);

            setStudocuFees({
                registrationWei: registrationFee,
                registrationEth: formatWeiToEth(registrationFee),
                uploadWei: uploadDeposit,
                uploadEth: formatWeiToEth(uploadDeposit),
                accessWei: accessFee,
                accessEth: formatWeiToEth(accessFee),
                voteRewardWei: voteReward,
                voteRewardEth: formatWeiToEth(voteReward)
            });

            setStudocuStats({
                totalDocuments: Number(totalDocumentsRaw),
                totalUsers: Number(totalUsersRaw)
            });

            setStudocuError(null);
        } catch (err) {
            console.error("Failed to refresh Studocu summary", err);
            setStudocuError(err?.message || "Unable to load Studocu summary.");
        }
    }, [studocuContract, formatWeiToEth]);

    const refreshStudocuRegistration = useCallback(async () => {
        if (!studocuContract || !address) {
            setStudocuRegistered(false);
            return;
        }

        try {
            const registered = await studocuContract.methods.registeredUsers(address).call();
            setStudocuRegistered(Boolean(registered));
        } catch (err) {
            console.error("Failed to check Studocu registration", err);
        }
    }, [studocuContract, address]);

    const refreshStudocuDocuments = useCallback(async () => {
        if (!studocuContract) {
            setStudocuDocs([]);
            return;
        }

        setStudocuDocsLoading(true);
        try {
            const totalDocumentsRaw = await studocuContract.methods.totalDocuments().call();
            const totalDocuments = Number(totalDocumentsRaw);
            const docIndices = Array.from({ length: totalDocuments }, (_, idx) => idx);

            const docs = await Promise.all(docIndices.map(async (docId) => {
                const base = await studocuContract.methods.getDocument(docId).call();
                let processComplete = false;
                let depositAmount = "0";

                try {
                    const meta = await studocuContract.methods.documents(docId).call();
                    processComplete = Boolean(meta.processComplete);
                    depositAmount = meta.depositAmount?.toString?.() ?? meta.depositAmount ?? "0";
                } catch (metaErr) {
                    console.warn(`Unable to load document metadata for doc ${docId}`, metaErr);
                }

                let isVoter = false;
                let hasVoted = false;

                if (address) {
                    try {
                        isVoter = await studocuContract.methods.isVoterForDocument(docId, address).call();
                        if (isVoter) {
                            hasVoted = await studocuContract.methods.hasUserVoted(docId, address).call();
                        }
                    } catch (voteErr) {
                        console.warn(`Unable to evaluate voter status for doc ${docId}`, voteErr);
                    }
                }

                return {
                    id: docId,
                    uploader: base.uploader,
                    ipfsHash: base.ipfsHash,
                    approved: Boolean(base.approved),
                    timestamp: Number(base.timestamp),
                    processComplete,
                    depositAmount,
                    isVoter,
                    hasVoted
                };
            }));

            setStudocuDocs(docs);
            setStudocuStats((prev) => ({ ...prev, totalDocuments }));
            setStudocuError(null);
        } catch (err) {
            console.error("Failed to fetch Studocu documents", err);
            setStudocuError(err?.message || "Unable to fetch documents. Try again later.");
        } finally {
            setStudocuDocsLoading(false);
        }
    }, [studocuContract, address]);

    const syncStudocuData = useCallback(async () => {
        await Promise.allSettled([
            refreshStudocuSummary(),
            refreshStudocuRegistration(),
            refreshStudocuDocuments()
        ]);
    }, [refreshStudocuSummary, refreshStudocuRegistration, refreshStudocuDocuments]);

    const registerStudocuUser = useCallback(async () => {
        if (!studocuContract || !address) {
            throw new Error("Connect your wallet before registering.");
        }

        setStudocuPendingAction("register");
        setStudocuError(null);

        try {
            const value = studocuFees?.registrationWei ?? await studocuContract.methods.REGISTRATION_FEE().call();
            const tx = await studocuContract.methods.registerUser().send({
                from: address,
                value
            });

            pushHistoryRecord("studocu-register", formatWeiToEth(value), tx);
            await refreshStudocuRegistration();
            await refreshStudocuSummary();
            return tx;
        } catch (err) {
            console.error("Studocu registration failed", err);
            pushHistoryRecord("studocu-register", "", "null");
            setStudocuError(err?.message || "Registration failed.");
            throw err;
        } finally {
            setStudocuPendingAction(null);
        }
    }, [studocuContract, address, studocuFees, pushHistoryRecord, formatWeiToEth, refreshStudocuRegistration, refreshStudocuSummary]);

    const uploadStudocuDocument = useCallback(async ({ ipfsHash, password }) => {
        if (!studocuContract || !address) {
            throw new Error("Connect your wallet before uploading.");
        }

        if (!ipfsHash || !password) {
            throw new Error("IPFS hash and password are required.");
        }

        setStudocuPendingAction("upload");
        setStudocuError(null);

        try {
            const value = studocuFees?.uploadWei ?? await studocuContract.methods.UPLOAD_DEPOSIT().call();
            const tx = await studocuContract.methods.uploadDocument(ipfsHash, password).send({
                from: address,
                value
            });

            pushHistoryRecord("studocu-upload", ipfsHash, tx);
            await refreshStudocuDocuments();
            await refreshStudocuSummary();
            return tx;
        } catch (err) {
            console.error("Studocu upload failed", err);
            pushHistoryRecord("studocu-upload", ipfsHash, "null");
            setStudocuError(err?.message || "Upload failed.");
            throw err;
        } finally {
            setStudocuPendingAction(null);
        }
    }, [studocuContract, address, studocuFees, pushHistoryRecord, refreshStudocuDocuments, refreshStudocuSummary]);

    const voteOnStudocuDocument = useCallback(async (docId, approval) => {
        if (!studocuContract || !address) {
            throw new Error("Connect your wallet before voting.");
        }

        setStudocuPendingAction(`vote-${docId}`);
        setStudocuError(null);

        try {
            const tx = await studocuContract.methods.voteOnDocument(docId, approval).send({ from: address });
            pushHistoryRecord("studocu-vote", `${docId}:${approval ? "approve" : "reject"}`, tx);
            await refreshStudocuDocuments();
            return tx;
        } catch (err) {
            console.error("Studocu vote failed", err);
            pushHistoryRecord("studocu-vote", `${docId}`, "null");
            setStudocuError(err?.message || "Vote failed.");
            throw err;
        } finally {
            setStudocuPendingAction(null);
        }
    }, [studocuContract, address, pushHistoryRecord, refreshStudocuDocuments]);

    const accessStudocuDocument = useCallback(async (docId) => {
        if (!studocuContract || !address) {
            throw new Error("Connect your wallet before accessing documents.");
        }

        setStudocuPendingAction(`access-${docId}`);
        setStudocuError(null);

        try {
            const value = studocuFees?.accessWei ?? await studocuContract.methods.ACCESS_FEE().call();
            const tx = await studocuContract.methods.accessDocument(docId).send({
                from: address,
                value
            });

            const password = await studocuContract.methods.getDocumentPassword(docId).call();
            const doc = studocuDocs.find((item) => item.id === docId);

            setStudocuLastAccess({
                docId,
                password,
                ipfsHash: doc?.ipfsHash || "",
                timestamp: Date.now()
            });

            pushHistoryRecord("studocu-access", `${docId}`, tx);
            return { tx, password };
        } catch (err) {
            console.error("Studocu access failed", err);
            pushHistoryRecord("studocu-access", `${docId}`, "null");
            setStudocuError(err?.message || "Access failed.");
            throw err;
        } finally {
            setStudocuPendingAction(null);
        }
    }, [studocuContract, address, studocuFees, studocuDocs, pushHistoryRecord]);

    const commitValUpdate = useCallback(async () => {
        if (!leaderContract) {
            console.warn("Leader contract not available");
            return;
        }

        const commitVal = document.getElementById("CommitVal")?.value;
        setCommitPending(true);
        setCommitDone(false);
        setResetDone(false);

        if (commitVal && commitVal.length) {
            setElectionOn(true);
            const [bit, key] = commitVal.split(",").map(Number);
            try {
                await leaderContract.methods.Commit(bit, key).send({ from: address });
                setCommitDone(true);
            } catch (err) {
                console.error("Commit transaction failed", err);
                setCommitDone(false);
            }
        } else {
            console.log("Commit field is empty");
        }

        setCommitPending(false);
    }, [leaderContract, address]);

    const revealVal = useCallback(async () => {
        if (!leaderContract) {
            console.warn("Leader contract not available");
            return;
        }

        const revealValue = document.getElementById("RevealVal")?.value;
        setRevealAccepted(false);
        setRevealPending(true);

        if (revealValue && revealValue.length) {
            const [bit, key] = revealValue.split(",").map(Number);
            try {
                await leaderContract.methods.Reveal(bit, key).send({ from: address });
                setRevealAccepted(true);
            } catch (err) {
                console.error("Reveal transaction failed", err);
                setRevealAccepted(false);
            }
        } else {
            console.log("Reveal field is empty");
        }
        setRevealPending(false);
    }, [leaderContract, address]);

    const resetHandle = useCallback(async () => {
        if (!leaderContract) {
            return;
        }
        try {
            await leaderContract.methods.election_reset().send({ from: address });
            setElectionOn(false);
            setRevealOn(false);
            setElected(false);
        } catch (err) {
            console.error("Reset failed", err);
        }
    }, [leaderContract, address]);

    useEffect(() => {
        if (!leaderContract) {
            return undefined;
        }

        const leaderSub = leaderContract.events.leader_elected().on("data", () => setElected(true));
        const revealSub = leaderContract.events.reveal_on().on("data", () => setRevealOn(true));
        const resetSub = leaderContract.events.reset_done().on("data", () => {
            setResetDone(true);
            setElectionOn(false);
            setRevealOn(false);
            setElected(false);
        });

        return () => {
            leaderSub?.unsubscribe?.();
            revealSub?.unsubscribe?.();
            resetSub?.unsubscribe?.();
        };
    }, [leaderContract]);

    useEffect(() => {
        if (!studocuContract) {
            setStudocuReady(false);
            setStudocuDocs([]);
            setStudocuRegistered(false);
            return;
        }

        setStudocuReady(true);
        refreshStudocuSummary();
        refreshStudocuDocuments();
        if (address) {
            refreshStudocuRegistration();
        }
    }, [studocuContract, address, refreshStudocuSummary, refreshStudocuRegistration, refreshStudocuDocuments]);

    useEffect(() => {
        setStudocuLastAccess(null);
    }, [address]);

    const storedValUpdate = useCallback(async () => {
        const inputVal = document.getElementById("inputVal")?.value;
        setStoredPending(false);
        setStoredDone(false);

        if (!inputVal || !inputVal.length) {
            pushHistoryRecord("store", inputVal, "null");
            return;
        }

        setStoredPending(true);

        try {
            const detail = await storeData(inputVal);
            pushHistoryRecord("store", inputVal, detail);
            setStoredDone(true);
        } catch (err) {
            console.error("Store transaction failed", err);
            pushHistoryRecord("store", inputVal, "null");
            setStoredDone(false);
        } finally {
            setStoredPending(false);
        }
    }, [pushHistoryRecord, storeData]);

    const showValUpdate = useCallback(async () => {
        try {
            const ans = await getData();
            setShowVal(ans);
            pushHistoryRecord("get", ans);
        } catch (err) {
            console.error("Failed to get value", err);
        }
    }, [getData, pushHistoryRecord]);

    const showLeaderUpdate = useCallback(async () => {
        try {
            const ans = await getLeader();
            setShowLead(ans);
        } catch (err) {
            console.error("Failed to fetch leader", err);
        }
    }, [getLeader]);

    const toolbarProps = {
        isConnected,
        address,
        network,
        onConnect: connectWallet,
        isConnecting,
        hasMetamask: haveMetamask
    };

    const LoginDisplay = () => (
        <Login
            isHaveMetamask={haveMetamask}
            connectTo={connectWallet}
            isConnecting={isConnecting}
            connectError={connectError}
            toolbarProps={toolbarProps}
        />
    );

    const ProfileDisplay = () => (
        <Profile
            isConnected={isConnected}
            address={address}
            networkType={network}
            balance={balance}
            toolbarProps={toolbarProps}
        />
    );

    const StorageDisplay = () => (
        <Storage
            isConnected={isConnected}
            storeValHandle={storedValUpdate}
            showValHandle={showValUpdate}
            showVal={showVal}
            storedPending={storedPending}
            storedDone={storedDone}
            toolbarProps={toolbarProps}
        />
    );

    const HistoryDisplay = () => (
        <History
            isConnected={isConnected}
            recordList={historyRecord}
            recordLen={historyRecord.length}
            toolbarProps={toolbarProps}
        />
    );

    const LeaderDisplay = () => (
        <Leader
            isConnected={isConnected}
            commitValHandle={commitValUpdate}
            showLeader={showLead}
            commitDone={commitDone}
            commitPending={commitPending}
            revealVal={revealVal}
            revealPending={revealPending}
            revealAccepted={revealAccepted}
            showLeaderHandle={showLeaderUpdate}
            resetHandle={resetHandle}
            resetDone={resetDone}
            electionOn={electionOn}
            revealOn={revealOn}
            elected={elected}
            toolbarProps={toolbarProps}
        />
    );

    const RegistrationDisplay = () => (
        <Registration
            isConnected={isConnected}
            contractReady={studocuReady}
            toolbarProps={toolbarProps}
            isRegistered={studocuRegistered}
            fees={studocuFees}
            stats={studocuStats}
            documents={studocuDocs}
            documentsLoading={studocuDocsLoading}
            pendingAction={studocuPendingAction}
            lastAccess={studocuLastAccess}
            studocuError={studocuError}
            onRefresh={syncStudocuData}
            onRegister={registerStudocuUser}
            onUpload={uploadStudocuDocument}
            onVote={voteOnStudocuDocument}
            onAccess={accessStudocuDocument}
            address={address}
        />
    );

    return (
        <div className="App">
            <Routes>
                <Route path="/" element={<LoginDisplay />} />
                <Route path="/EE4032" element={<Navigate to="/" replace />} />
                <Route path="/InterfaceDemo/profile" element={<ProfileDisplay />} />
                <Route path="/InterfaceDemo/storage" element={<StorageDisplay />} />
                <Route path="/InterfaceDemo/history" element={<HistoryDisplay />} />
                <Route path="/InterfaceDemo/leader" element={<LeaderDisplay />} />
                <Route path="/InterfaceDemo/register" element={<RegistrationDisplay />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}
