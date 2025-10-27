// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract StudocuOnChain {
    // Payment constants
    uint256 public constant REGISTRATION_FEE = 0.01 ether;
    uint256 public constant UPLOAD_DEPOSIT = 0.005 ether;
    uint256 public constant VOTE_REWARD = 0.0001 ether;
    uint256 public constant ACCESS_FEE = 0.001 ether;
    uint256 public constant APPROVAL_THRESHOLD = 3;
    uint256 public constant REQUIRED_VOTERS = 5;
    
    // Document structure
    struct Document {
        address uploader;
        string ipfsHash;
        string password;
        uint256 depositAmount;
        address[] voters;
        bool[] votes;
        bool approved;
        bool processComplete;
        uint256 timestamp;
    }
    
    // State variables
    mapping(address => bool) public registeredUsers;
    mapping(uint256 => Document) public documents;
    uint256 public totalDocuments;
    uint256 public totalUsers;
    
    // Events
    event UserRegistered(address indexed user);
    event DocumentUploaded(uint256 indexed docId, address indexed uploader, string ipfsHash);
    event VoteCast(uint256 indexed docId, address indexed voter, bool approval);
    event DocumentApproved(uint256 indexed docId);
    event DocumentRejected(uint256 indexed docId);
    event DocumentAccessed(uint256 indexed docId, address indexed user);
    
    // Modifiers
    modifier onlyRegistered() {
        require(registeredUsers[msg.sender], "User not registered");
        _;
    }
    
    modifier validDocument(uint256 docId) {
        require(docId < totalDocuments, "Invalid document ID");
        _;
    }
    
    // User registration
    function registerUser() external payable {
        require(msg.value == REGISTRATION_FEE, "Must pay registration fee");
        require(!registeredUsers[msg.sender], "Already registered");
        
        registeredUsers[msg.sender] = true;
        totalUsers++;
        
        emit UserRegistered(msg.sender);
    }
    
    // Upload document
    function uploadDocument(string memory ipfsHash, string memory password) external payable onlyRegistered {
        require(msg.value == UPLOAD_DEPOSIT, "Must pay upload deposit");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(bytes(password).length > 0, "Password required");
        
        // Select 5 random voters
        address[] memory selectedVoters = _selectRandomVoters(msg.sender);
        
        // Create document
        documents[totalDocuments] = Document({
            uploader: msg.sender,
            ipfsHash: ipfsHash,
            password: password,
            depositAmount: msg.value,
            voters: selectedVoters,
            votes: new bool[](REQUIRED_VOTERS),
            approved: false,
            processComplete: false,
            timestamp: block.timestamp
        });
        
        emit DocumentUploaded(totalDocuments, msg.sender, ipfsHash);
        totalDocuments++;
    }
    
    // Vote on document
    function voteOnDocument(uint256 docId, bool approval) external validDocument(docId) {
        Document storage doc = documents[docId];
        require(!doc.processComplete, "Voting complete");
        require(registeredUsers[msg.sender], "Must be registered");
        require(_isVoter(docId, msg.sender), "Not selected as voter");
        require(!_hasVoted(docId, msg.sender), "Already voted");
        
        // Record vote
        uint256 voterIndex = _getVoterIndex(docId, msg.sender);
        doc.votes[voterIndex] = approval;
        
        // Pay voter reward
        payable(msg.sender).transfer(VOTE_REWARD);
        
        emit VoteCast(docId, msg.sender, approval);
        
        // Check if voting is complete (all 5 have voted)
        if (_countVotes(docId) == REQUIRED_VOTERS) {
            _processVoting(docId);
        }
    }
    
    // Access approved document
    function accessDocument(uint256 docId) external payable validDocument(docId) {
        require(msg.value == ACCESS_FEE, "Must pay access fee");
        Document storage doc = documents[docId];
        require(doc.approved, "Document not approved");
        
        emit DocumentAccessed(docId, msg.sender);
    }
    
    // Get document details
    function getDocument(uint256 docId) external view validDocument(docId) returns (
        address uploader,
        string memory ipfsHash,
        bool approved,
        uint256 timestamp
    ) {
        Document storage doc = documents[docId];
        return (doc.uploader, doc.ipfsHash, doc.approved, doc.timestamp);
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
    
    // Internal: Select random voters
    function _selectRandomVoters(address uploader) internal view returns (address[] memory) {
        require(totalUsers >= REQUIRED_VOTERS, "Not enough users");
        
        address[] memory allUsers = new address[](totalUsers);
        uint256 count = 0;
        
        // Collect all registered users except uploader
        for (uint256 i = 0; i < address(this).balance / REGISTRATION_FEE; i++) {
            address user = address(uint160(i + 1));
            if (registeredUsers[user] && user != uploader) {
                allUsers[count] = user;
                count++;
            }
        }
        
        address[] memory selected = new address[](REQUIRED_VOTERS);
        bytes32 seed = keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender));
        
        for (uint256 i = 0; i < REQUIRED_VOTERS; i++) {
            uint256 index = uint256(keccak256(abi.encodePacked(seed, i))) % count;
            selected[i] = allUsers[index];
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
        return documents[docId].votes[voterIndex];
    }
    
    // Internal: Count votes
    function _countVotes(uint256 docId) internal view returns (uint256) {
        bool[] memory votes = documents[docId].votes;
        uint256 count = 0;
        for (uint256 i = 0; i < votes.length; i++) {
            if (votes[i] == true || votes[i] == false) {
                count++;
            }
        }
        return count;
    }
    
    // Internal: Count approvals
    function _countApprovals(uint256 docId) internal view returns (uint256) {
        bool[] memory votes = documents[docId].votes;
        uint256 count = 0;
        for (uint256 i = 0; i < votes.length; i++) {
            if (votes[i]) {
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
    }
    
    // Contract owner can withdraw funds
    function withdraw() external {
        payable(msg.sender).transfer(address(this).balance);
    }
}

