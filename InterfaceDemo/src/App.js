import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import Web3 from "web3";

import "./App.css";
import Login from "./components/login/login";
import Profile from "./components/profile/profile";
import History from "./components/history/history";
import Leader from "./components/leader/leader";
import Registration from "./components/registration/registration";
import Voting from "./components/registration/Voting";
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
    const [leaderContract, setLeaderContract] = useState(null);
    const [studocuContract, setStudocuContract] = useState(null);

    const [address, setAddress] = useState(null);
    const [network, setNetwork] = useState(null);
    const [balance, setBalance] = useState("0");
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectError, setConnectError] = useState(null);


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
    const studocuDocsLoadingRef = useRef(false);
    const studocuEventCooldownRef = useRef(0);
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
            setLeaderContract(null);
            setStudocuContract(null);
            setStudocuReady(false);
            return;
        }

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
            // Try to call constants one by one with better error handling
            let registrationFee, uploadDeposit, accessFee, voteReward, totalDocumentsRaw, totalUsersRaw;
            
            try {
                registrationFee = await studocuContract.methods.REGISTRATION_FEE().call();
            } catch (e) {
                console.warn("Failed to read REGISTRATION_FEE:", e);
                // Fallback to known value (0.01 ETH = 10000000000000000 wei)
                registrationFee = "10000000000000000";
            }
            
            try {
                uploadDeposit = await studocuContract.methods.UPLOAD_DEPOSIT().call();
            } catch (e) {
                console.warn("Failed to read UPLOAD_DEPOSIT:", e);
                // Fallback to known value (0.005 ETH = 5000000000000000 wei)
                uploadDeposit = "5000000000000000";
            }
            
            try {
                accessFee = await studocuContract.methods.ACCESS_FEE().call();
            } catch (e) {
                console.warn("Failed to read ACCESS_FEE:", e);
                // Fallback to known value (0.001 ETH = 1000000000000000 wei)
                accessFee = "1000000000000000";
            }
            
            try {
                voteReward = await studocuContract.methods.VOTE_REWARD().call();
            } catch (e) {
                console.warn("Failed to read VOTE_REWARD:", e);
                // Fallback to known value (0.02 ETH = 20000000000000000 wei)
                voteReward = "20000000000000000";
            }
            
            try {
                totalDocumentsRaw = await studocuContract.methods.totalDocuments().call();
            } catch (e) {
                console.warn("Failed to read totalDocuments:", e);
                totalDocumentsRaw = "0";
            }
            
            try {
                totalUsersRaw = await studocuContract.methods.totalUsers().call();
            } catch (e) {
                console.warn("Failed to read totalUsers:", e);
                totalUsersRaw = "0";
            }

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
            // Don't show error if it's just ABI/decoding issues - use fallback values
            if (err?.message?.includes("decoding") || err?.message?.includes("ABI")) {
                console.warn("Using fallback fee values due to ABI issue");
                setStudocuFees({
                    registrationWei: "10000000000000000", // 0.01 ETH
                    registrationEth: "0.01",
                    uploadWei: "5000000000000000", // 0.005 ETH
                    uploadEth: "0.005",
                    accessWei: "1000000000000000", // 0.001 ETH
                    accessEth: "0.001",
                    voteRewardWei: "20000000000000000", // 0.02 ETH
                    voteRewardEth: "0.02"
                });
                setStudocuStats({ totalDocuments: 0, totalUsers: 0 });
                setStudocuError(null);
            } else {
                setStudocuError(err?.message || "Unable to load Studocu summary.");
            }
        }
    }, [studocuContract, formatWeiToEth]);

    const refreshStudocuRegistration = useCallback(async () => {
        if (!studocuContract || !address) {
            setStudocuRegistered(false);
            return;
        }

        try {
            const registered = await studocuContract.methods.registeredUsers(address).call();
            const isReg = Boolean(registered);
            setStudocuRegistered(isReg);
            console.log("Registration status:", isReg);
        } catch (err) {
            console.error("Failed to check Studocu registration", err);
            // Don't set to false on error - might be temporary RPC issue
        }
    }, [studocuContract, address]);

    const refreshStudocuDocuments = useCallback(async () => {
        if (!studocuContract) {
            setStudocuDocs([]);
            return;
        }

        // Skip if already loading to prevent overlapping requests
        if (studocuDocsLoadingRef.current) {
            return;
        }

        studocuDocsLoadingRef.current = true;
        setStudocuDocsLoading(true);
        try {
            const totalDocumentsRaw = await studocuContract.methods.totalDocuments().call();
            const totalDocuments = Number(totalDocumentsRaw);
            const docIndices = Array.from({ length: totalDocuments }, (_, idx) => idx);

            const docs = await Promise.all(docIndices.map(async (docId) => {
                const base = await studocuContract.methods.getDocument(docId).call();
                let processComplete = false;
                let depositAmount = "0";
                let votingDeadline = 0;

                try {
                    const meta = await studocuContract.methods.documents(docId).call();
                    processComplete = Boolean(meta.processComplete);
                    depositAmount = meta.depositAmount?.toString?.() ?? meta.depositAmount ?? "0";
                    votingDeadline = Number(meta.votingDeadline || 0);
                } catch (metaErr) {
                    console.warn(`Unable to load document metadata for doc ${docId}`, metaErr);
                }

                let isVoter = false;
                let hasVoted = false;
                let votingProgress = { totalVotes: 0, approvals: 0, requiredVoters: 5 };
                let timeRemaining = 0;

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

                try {
                    const progress = await studocuContract.methods.getVotingProgress(docId).call();
                    votingProgress = {
                        totalVotes: Number(progress.totalVotes),
                        approvals: Number(progress.approvals),
                        requiredVoters: Number(progress.requiredVoters)
                    };
                } catch (progErr) {
                    console.warn(`Unable to load voting progress for doc ${docId}`, progErr);
                }

                try {
                    timeRemaining = Number(await studocuContract.methods.timeRemaining(docId).call());
                } catch (timeErr) {
                    console.warn(`Unable to load time remaining for doc ${docId}`, timeErr);
                }

                return {
                    id: docId,
                    uploader: base.uploader,
                    ipfsHash: base.ipfsHash,
                    externalLink: base.externalLink || "",
                    approved: Boolean(base.approved),
                    timestamp: Number(base.timestamp),
                    processComplete,
                    depositAmount,
                    isVoter,
                    hasVoted,
                    votingProgress,
                    timeRemaining,
                    votingDeadline
                };
            }));

            setStudocuDocs(docs);
            setStudocuStats((prev) => ({ ...prev, totalDocuments }));
            setStudocuError(null);
        } catch (err) {
            console.error("Failed to fetch Studocu documents", err);
            const errorMsg = err?.message || "Unable to fetch documents. Try again later.";
            
            // Don't show error for RPC rate limit issues - just log it
            if (errorMsg.includes('too many errors') || errorMsg.includes('rate limit') || errorMsg.includes('RPC endpoint')) {
                console.warn("RPC rate limit hit, will retry on next refresh");
                // Keep existing data, don't show error to user
            } else {
                setStudocuError(errorMsg);
            }
        } finally {
            studocuDocsLoadingRef.current = false;
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
    }, [studocuContract, address, studocuFees, pushHistoryRecord, formatWeiToEth, refreshStudocuSummary, refreshStudocuRegistration]);

    const uploadStudocuDocument = useCallback(async ({ ipfsHash, password, externalLink }) => {
        if (!studocuContract || !address) {
            throw new Error("Connect your wallet before uploading.");
        }

        if (!ipfsHash || !password || !externalLink) {
            throw new Error("IPFS hash, password, and external link are required.");
        }

        setStudocuPendingAction("upload");
        setStudocuError(null);

        try {
            const value = studocuFees?.uploadWei ?? await studocuContract.methods.UPLOAD_DEPOSIT().call();
            
            // Estimate gas and check for errors early (catches revert reasons before sending)
            let gasLimit;
            try {
                const estimatedGas = await studocuContract.methods.uploadDocument(ipfsHash, password, externalLink).estimateGas({
                    from: address,
                    value
                });
                // Web3.js returns BigNumber, convert to number
                const estimatedGasNum = Number(estimatedGas);
                // Add 10% buffer, cap at 15M to stay under network limit of 16.7M
                const withBuffer = Math.floor(estimatedGasNum * 1.1);
                gasLimit = Math.min(withBuffer, 15000000).toString();
            } catch (estimateErr) {
                // If estimation fails, check for specific error messages
                const errMsg = estimateErr?.message || String(estimateErr);
                if (errMsg.includes("Not enough users") || errMsg.includes("Not enough distinct voters")) {
                    throw new Error("Not enough registered users. Need at least 6 users (including you) to upload documents. Other users need to register first.");
                }
                // For other errors, use a safe default gas limit
                console.warn("Gas estimation failed, using default:", estimateErr);
                gasLimit = "8000000"; // 8M should be plenty for upload
            }
            
            const tx = await studocuContract.methods.uploadDocument(ipfsHash, password, externalLink).send({
                from: address,
                value,
                gas: gasLimit
            });

            pushHistoryRecord("studocu-upload", ipfsHash, tx);
            await refreshStudocuDocuments();
            await refreshStudocuSummary();
            return tx;
        } catch (err) {
            console.error("Studocu upload failed", err);
            pushHistoryRecord("studocu-upload", ipfsHash, "null");
            
            // Parse revert reason from error
            let errorMessage = "Upload failed.";
            if (err?.message) {
                errorMessage = err.message;
                // Check for common revert reasons
                if (err.message.includes("Not enough users") || err.message.includes("Not enough distinct voters")) {
                    errorMessage = "Not enough registered users. Need at least 6 users (including you) to upload documents. Other users need to register first.";
                } else if (err.message.includes("revert")) {
                    // Try to extract the revert reason
                    const revertMatch = err.message.match(/revert\s+(.+)/i);
                    if (revertMatch) {
                        errorMessage = `Transaction failed: ${revertMatch[1]}`;
                    }
                }
            }
            
            setStudocuError(errorMessage);
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
            
            // Wait a moment for transaction to be processed, then refresh
            await new Promise((resolve) => setTimeout(resolve, 1500));
            await refreshStudocuDocuments();
            await refreshStudocuSummary();
            return tx;
        } catch (err) {
            console.error("Studocu vote failed", err);
            pushHistoryRecord("studocu-vote", `${docId}`, "null");
            setStudocuError(err?.message || "Vote failed.");
            throw err;
        } finally {
            setStudocuPendingAction(null);
        }
    }, [studocuContract, address, pushHistoryRecord, refreshStudocuDocuments, refreshStudocuSummary]);

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

            // Wait a moment for transaction to be processed
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Get password with timeout (10 seconds max)
            let password = "Retrieving...";
            try {
                const passwordPromise = studocuContract.methods.getDocumentPassword(docId).call({ from: address });
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Timeout after 10 seconds")), 10000)
                );
                
                password = await Promise.race([passwordPromise, timeoutPromise]);
            } catch (pwdErr) {
                console.error("Password retrieval error:", pwdErr);
                password = "Error: Could not retrieve password. Transaction completed but password unavailable.";
            }

            const doc = studocuDocs.find((item) => item.id === docId);

            setStudocuLastAccess({
                docId,
                password: password || "Password not available",
                ipfsHash: doc?.ipfsHash || "",
                externalLink: doc?.externalLink || "",
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
            return undefined;
        }

        let cancelled = false;

        const triggerRefresh = () => {
            if (cancelled) {
                return;
            }

            const now = Date.now();
            const last = studocuEventCooldownRef.current || 0;
            if (now - last < 4000) {
                return;
            }

            studocuEventCooldownRef.current = now;
            refreshStudocuDocuments();
            refreshStudocuSummary();
        };

        const subscribe = (eventName) => {
            try {
                return studocuContract.events[eventName]({})
                    .on("data", () => {
                        console.debug(`[Studocu] ${eventName} event received`);
                        triggerRefresh();
                    })
                    .on("error", (err) => {
                        console.warn(`[Studocu] ${eventName} listener error`, err);
                    });
            } catch (err) {
                console.warn(`[Studocu] Failed to subscribe to ${eventName}`, err);
                return null;
            }
        };

        const subscriptions = [
            "DocumentUploaded",
            "VoteCast",
            "DocumentApproved",
            "DocumentRejected",
            "DocumentResult"
        ].map(subscribe);

        return () => {
            cancelled = true;
            subscriptions.forEach((sub) => {
                try {
                    sub?.unsubscribe?.();
                } catch (err) {
                    console.warn("Failed to unsubscribe Studocu event", err);
                }
            });
        };
    }, [studocuContract, refreshStudocuDocuments, refreshStudocuSummary]);

    useEffect(() => {
        if (!studocuContract) {
            return undefined;
        }

        const interval = setInterval(() => {
            refreshStudocuDocuments();
            refreshStudocuSummary();
        }, 15000);

        return () => clearInterval(interval);
    }, [studocuContract, refreshStudocuDocuments, refreshStudocuSummary]);

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

        // Auto-refresh DISABLED to avoid RPC rate limits
        // Data refreshes automatically after user actions (vote, upload, access)
        // Users can manually refresh using the refresh button in the UI
        // If you need auto-refresh, increase interval to 2-5 minutes minimum
    }, [studocuContract, address, refreshStudocuSummary, refreshStudocuRegistration, refreshStudocuDocuments]);

    useEffect(() => {
        setStudocuLastAccess(null);
    }, [address]);

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
            onRegister={registerStudocuUser}
            onUpload={uploadStudocuDocument}
            onAccess={accessStudocuDocument}
            onRefresh={syncStudocuData}
            address={address}
        />
    );

    const VotingDisplay = () => (
        <Voting
            isConnected={isConnected}
            contractReady={studocuReady}
            toolbarProps={toolbarProps}
            isRegistered={studocuRegistered}
            fees={studocuFees}
            documents={studocuDocs}
            documentsLoading={studocuDocsLoading}
            pendingAction={studocuPendingAction}
            onVote={voteOnStudocuDocument}
            onRefresh={syncStudocuData}
            address={address}
        />
    );

    return (
        <div className="App">
            <Routes>
                <Route path="/" element={<LoginDisplay />} />
                <Route path="/EE4032" element={<Navigate to="/" replace />} />
                <Route path="/InterfaceDemo/profile" element={<ProfileDisplay />} />
                <Route path="/InterfaceDemo/vote" element={<VotingDisplay />} />
                <Route path="/InterfaceDemo/history" element={<HistoryDisplay />} />
                <Route path="/InterfaceDemo/leader" element={<LeaderDisplay />} />
                <Route path="/InterfaceDemo/register" element={<RegistrationDisplay />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}
