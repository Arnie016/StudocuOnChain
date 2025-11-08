// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

// Demo-only safety imports (used by Remix)
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract StudocuOnChain is Ownable, ReentrancyGuard {
    // Payment constants
    uint256 public constant REGISTRATION_FEE = 0.01 ether;
    uint256 public constant UPLOAD_DEPOSIT = 0.005 ether;
    uint256 public constant VOTE_REWARD = 0.02 ether;
    uint256 public constant ACCESS_FEE = 0.001 ether;
    uint256 public constant APPROVAL_THRESHOLD = 3;
    uint256 public constant REQUIRED_VOTERS = 5;
    uint256 public constant VOTING_DURATION = 7 days; // window for voting
    
    // Document structure
    struct Document {
        address uploader;
        string ipfsHash;
        string password;
        string externalLink;
        uint256 depositAmount;
        address[] voters;
        bool[] votes;
        bool approved;
        bool processComplete;
        uint256 timestamp;
        uint256 votingDeadline;
    }
    
    // State variables
    mapping(address => bool) public registeredUsers;
    mapping(uint256 => Document) public documents;
    uint256 public totalDocuments;
    uint256 public totalUsers;

    // Keep an explicit list of registered users to enable correct random sampling
    address[] private userList;
    
    // Track which voters have actually voted (docId => voterIndex => hasVoted)
    mapping(uint256 => mapping(uint256 => bool)) public hasVotedByIndex;
    
    // Events
    event UserRegistered(address indexed user);
    event DocumentUploaded(uint256 indexed docId, address indexed uploader, string ipfsHash);
    event VoteCast(uint256 indexed docId, address indexed voter, bool approval);
    event DocumentApproved(uint256 indexed docId);
    event DocumentRejected(uint256 indexed docId);
    event DocumentAccessed(uint256 indexed docId, address indexed user);
    event DocumentResult(uint256 indexed docId, bool approved, uint256 approvals, uint256 totalVotes);
    
    // Modifiers
    modifier onlyRegistered() {
        require(registeredUsers[msg.sender], "User not registered");
        _;
    }
    
    modifier validDocument(uint256 docId) {
        require(docId < totalDocuments, "Invalid document ID");
        _;
    }
    
    // Constructor: Initialize Ownable with deployer as owner
    constructor() Ownable(msg.sender) {}
    
    // User registration
    function registerUser() external payable {
        require(msg.value == REGISTRATION_FEE, "Must pay registration fee");
        require(!registeredUsers[msg.sender], "Already registered");
        
        registeredUsers[msg.sender] = true;
        userList.push(msg.sender);
        totalUsers++;
        
        emit UserRegistered(msg.sender);
    }
    
    // Upload document
    function uploadDocument(string memory ipfsHash, string memory password, string memory externalLink) external payable onlyRegistered {
        require(msg.value == UPLOAD_DEPOSIT, "Must pay upload deposit");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(bytes(password).length > 0, "Password required");
        require(bytes(externalLink).length > 0, "External link required");
        
        // Select 5 random voters
        address[] memory selectedVoters = _selectRandomVoters(msg.sender);
        
        // Create document
        documents[totalDocuments] = Document({
            uploader: msg.sender,
            ipfsHash: ipfsHash,
            password: password,
            externalLink: externalLink,
            depositAmount: msg.value,
            voters: selectedVoters,
            votes: new bool[](REQUIRED_VOTERS),
            approved: false,
            processComplete: false,
            timestamp: block.timestamp,
            votingDeadline: block.timestamp + VOTING_DURATION
        });
        
        emit DocumentUploaded(totalDocuments, msg.sender, ipfsHash);
        totalDocuments++;
    }
    
    // Vote on document
    function voteOnDocument(uint256 docId, bool approval) external validDocument(docId) {
        Document storage doc = documents[docId];
        require(!doc.processComplete, "Voting complete");
        require(block.timestamp <= doc.votingDeadline, "Voting period over");
        require(registeredUsers[msg.sender], "Must be registered");
        require(_isVoter(docId, msg.sender), "Not selected as voter");
        require(!_hasVoted(docId, msg.sender), "Already voted");
        
        // Record vote
        uint256 voterIndex = _getVoterIndex(docId, msg.sender);
        doc.votes[voterIndex] = approval;
        hasVotedByIndex[docId][voterIndex] = true;
        
        // Pay voter reward
        payable(msg.sender).transfer(VOTE_REWARD);
        
        emit VoteCast(docId, msg.sender, approval);
        
        // Check if voting is complete (all 5 have voted)
        if (_countVotes(docId) == REQUIRED_VOTERS) {
            _processVoting(docId);
        }
    }
    
    // Access approved document
    function accessDocument(uint256 docId) external payable validDocument(docId) nonReentrant {
        require(msg.value == ACCESS_FEE, "Must pay access fee");
        Document storage doc = documents[docId];
        require(doc.approved, "Document not approved");
        payable(doc.uploader).transfer(msg.value);
        
        emit DocumentAccessed(docId, msg.sender);
    }
    
    // Get document details
    function getDocument(uint256 docId) external view validDocument(docId) returns (
        address uploader,
        string memory ipfsHash,
        string memory externalLink,
        bool approved,
        uint256 timestamp
    ) {
        Document storage doc = documents[docId];
        return (doc.uploader, doc.ipfsHash, doc.externalLink, doc.approved, doc.timestamp);
    }

    // View: time remaining until voting closes (0 if closed)
    function timeRemaining(uint256 docId) external view validDocument(docId) returns (uint256) {
        Document storage doc = documents[docId];
        if (block.timestamp >= doc.votingDeadline) return 0;
        return doc.votingDeadline - block.timestamp;
    }
    
    // Get password for approved document (only called after payment)
    function getDocumentPassword(uint256 docId) external view returns (string memory) {
        Document storage doc = documents[docId];
        require(doc.approved, "Document not approved");
        return doc.password;
    }
    
    // Check if user is a voter for document
    function isVoterForDocument(uint256 docId, address user) external view returns (bool) {
        return _isVoter(docId, user);
    }
    
    // Check if user has voted
    function hasUserVoted(uint256 docId, address user) external view returns (bool) {
        return _hasVoted(docId, user);
    }
    
    // Get voting progress (returns: totalVotes, approvals, requiredVoters)
    function getVotingProgress(uint256 docId) external view validDocument(docId) returns (
        uint256 totalVotes,
        uint256 approvals,
        uint256 requiredVoters
    ) {
        return (_countVotes(docId), _countApprovals(docId), REQUIRED_VOTERS);
    }
    
    // Internal: Select random voters
    function _selectRandomVoters(address uploader) internal view returns (address[] memory) {
        // Build a pool of real registered users, excluding the uploader
        require(totalUsers >= REQUIRED_VOTERS, "Not enough users");

        // Count eligible users
        uint256 eligibleCount = 0;
        for (uint256 i = 0; i < userList.length; i++) {
            if (userList[i] != uploader && registeredUsers[userList[i]]) {
                eligibleCount++;
            }
        }
        require(eligibleCount >= REQUIRED_VOTERS, "Not enough distinct voters");

        // Copy eligible users into a memory pool
        address[] memory pool = new address[](eligibleCount);
        uint256 p = 0;
        for (uint256 i = 0; i < userList.length; i++) {
            address u = userList[i];
            if (u != uploader && registeredUsers[u]) {
                pool[p++] = u;
            }
        }

        // Pseudo-randomly pick REQUIRED_VOTERS unique addresses via partial Fisher-Yates shuffle
        address[] memory selected = new address[](REQUIRED_VOTERS);
        // Demo-only pseudorandomness (acceptable for demo, not production)
        bytes32 seed = keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender));
        for (uint256 i = 0; i < REQUIRED_VOTERS; i++) {
            uint256 remaining = eligibleCount - i;
            uint256 idx = uint256(keccak256(abi.encodePacked(seed, i))) % remaining;
            selected[i] = pool[idx];
            // move last unpicked element to idx to avoid duplicates
            pool[idx] = pool[remaining - 1];
        }

        return selected;
    }
    
    // Internal: Check if address is a voter
    function _isVoter(uint256 docId, address user) internal view returns (bool) {
        Document storage doc = documents[docId];
        for (uint256 i = 0; i < doc.voters.length; i++) {
            if (doc.voters[i] == user) {
                return true;
            }
        }
        return false;
    }
    
    // Internal: Get voter index
    function _getVoterIndex(uint256 docId, address voter) internal view returns (uint256) {
        Document storage doc = documents[docId];
        for (uint256 i = 0; i < doc.voters.length; i++) {
            if (doc.voters[i] == voter) {
                return i;
            }
        }
        revert("Voter not found");
    }
    
    // Internal: Check if voter has voted
    function _hasVoted(uint256 docId, address voter) internal view returns (bool) {
        uint256 voterIndex = _getVoterIndex(docId, voter);
        return hasVotedByIndex[docId][voterIndex];
    }
    
    // Internal: Count votes
    function _countVotes(uint256 docId) internal view returns (uint256) {
        uint256 count = 0;
        Document storage doc = documents[docId];
        for (uint256 i = 0; i < doc.voters.length; i++) {
            if (hasVotedByIndex[docId][i]) {
                count++;
            }
        }
        return count;
    }
    
    // Internal: Count approvals
    function _countApprovals(uint256 docId) internal view returns (uint256) {
        Document storage doc = documents[docId];
        uint256 count = 0;
        for (uint256 i = 0; i < doc.votes.length; i++) {
            if (hasVotedByIndex[docId][i] && doc.votes[i]) {
                count++;
            }
        }
        return count;
    }
    
    // Internal: Process voting results
    function _processVoting(uint256 docId) internal {
        Document storage doc = documents[docId];
        uint256 approvals = _countApprovals(docId);
        
        if (approvals >= APPROVAL_THRESHOLD) {
            // Document approved - refund deposit
            doc.approved = true;
            doc.processComplete = true;
            payable(doc.uploader).transfer(doc.depositAmount);
            emit DocumentApproved(docId);
        } else {
            // Document rejected - forfeit deposit
            doc.approved = false;
            doc.processComplete = true;
            // Deposit is kept in contract
            emit DocumentRejected(docId);
        }

        emit DocumentResult(docId, doc.approved, approvals, _countVotes(docId));
    }
    
    // Contract owner can withdraw funds (call-based, protected)
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "Insufficient funds");
        (bool ok, ) = payable(owner()).call{value: amount}("");
        require(ok, "Withdraw failed");
    }

    // Accept direct ETH transfers (demo)
    receive() external payable {}
    fallback() external payable {}
}

