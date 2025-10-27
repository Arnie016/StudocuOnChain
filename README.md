# StudocuOnChain

A decentralized document verification platform where users pay to join, upload password-protected PDFs to IPFS, and earn ETH by voting on document quality.

## Features

- **User Registration**: Pay 0.01 ETH to join the network
- **Document Upload**: Upload documents with 0.005 ETH deposit
- **Random Voter Selection**: 5 random voters selected from registered users for each document
- **Voting Rewards**: Earn 0.0001 ETH per vote cast
- **Quality Control**: 3/5 approval threshold required
- **Document Access**: Pay 0.001 ETH to access approved documents

## Project Structure

### InterfaceDemo/
Main React application with all components and smart contracts

### docs/InterfaceDemo/
Deployed website hosted at *https://marcotom.github.io/EE4032/InterfaceDemo/*

## Getting Started

### Prerequisites
- MetaMask extension installed
- Node.js and npm installed
- Sepolia testnet ETH for deployment and testing

### Installation
```bash
cd InterfaceDemo
npm install
npm start
```

## Smart Contract

The `StudocuOnChain.sol` contract handles:
- User registration (0.01 ETH)
- Document upload and IPFS hash storage (0.005 ETH deposit)
- Random voter selection (5 voters per document)
- Voting mechanism with rewards (0.0001 ETH per vote)
- Document access with password retrieval (0.001 ETH)
- Deposit refund upon approval (3/5 voters)

## Credit

The original InterfaceDemo project was created by Yan Ge (2022-2024): 
*https://github.com/dududududulu/InterfaceDemo/*

Updated in 2025 by Enrique Cervero and Tristan Philippe. 
