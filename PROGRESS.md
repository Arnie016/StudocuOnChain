## Progress Log

Date: 2025-10-31

- Fix: Voter selection now samples from real registered users. Added `userList` array and unique selection via partial Fisher–Yates.
- Fix: Voting logic counted all votes immediately. Added `hasVotedByIndex` to track actual voters; `_countVotes` and `_countApprovals` now only count cast votes.
- Fix: `_hasVoted` previously returned the vote value; now returns whether the voter has voted.
- UX: Updated frontend contract address to latest deploy on Sepolia.
- Note: Re-register users after redeploy (state resets on new address).

Known issues / backlog
- Security: `withdraw` needs `onlyOwner` + `nonReentrant` and `call` send pattern.
- Randomness: uses on-chain entropy (`block.timestamp`/`prevrandao`) – OK for demo, not production (consider Chainlink VRF).
- UX: Voting cards overflow on long IPFS hashes; add truncation and responsive layout.
- Feature: Add in-app PDF preview (IPFS gateway + react-pdf) so voters can review before voting.
- Feature: Add voting deadline to prevent stalled documents.

Errors encountered & resolutions
- "transaction gas limit too high" during upload: caused by revert due to insufficient voters and earlier selection bug. Resolved by fixing selection and ensuring ≥6 total users (uploader excluded).
- Early rejection after first vote: caused by counting all vote slots; fixed with `hasVotedByIndex` and corrected counters.


