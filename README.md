# MantlePay

<div align="center">

**Decentralized Receivable Financing Platform on Mantle Network**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-blue)](https://react.dev/)
[![Thirdweb](https://img.shields.io/badge/Thirdweb-5.0-purple)](https://thirdweb.com/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-orange)](https://soliditylang.org/)
[![Mantle](https://img.shields.io/badge/Mantle-Network-green)](https://www.mantle.xyz/)

*Transforming accounts receivable into liquid assets through blockchain-powered tokenization*

</div>

<img width="142" height="62" alt="Screenshot 2026-01-15 at 7 26 22 PM" src="https://github.com/user-attachments/assets/c95d6fa7-7af4-4801-ad00-2c750e7990de" />

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Smart Contracts](#smart-contracts)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

**MantlePay** is a decentralized finance (DeFi) platform that enables merchants to tokenize their accounts receivable and access immediate liquidity. Built on the Mantle Network, MantlePay leverages smart contracts to create a transparent, secure, and efficient marketplace for receivable financing.

![WhatsApp Image 2026-01-15 at 8 24 01 PM (1)](https://github.com/user-attachments/assets/ab882335-e5a0-4165-9418-b4422d5dbf2e)
![WhatsApp Image 2026-01-15 at 8 24 01 PM](https://github.com/user-attachments/assets/0af305dc-b3f7-4dcf-aa19-d8214678b2fc)


### Key Benefits

- **Immediate Liquidity**: Merchants receive up to 80% of invoice value upfront
- **Transparent Pricing**: Clear ROI calculations for investors
- **Risk Segmentation**: Senior and Junior tranches for different risk appetites
- **Blockchain Security**: Immutable records and automated execution
- **Cross-Device Flow**: Merchant and consumer interact seamlessly on separate devices

## ✨ Features

### For Merchants
- 📱 **QR Code Generation**: Create sales orders with scannable QR codes
- 🎫 **Receipt NFT Minting**: Customers mint NFTs to approve invoices
- 💰 **Pool Creation**: Tokenize receivables into investable pools
- 📊 **Dashboard**: Track orders, NFTs, and pool performance

### For Customers
- 📷 **QR Scanner**: Scan merchant QR codes to review orders
- ✅ **Order Verification**: Approve and mint Receipt NFTs
- 🔐 **Secure Approval**: Blockchain-verified order approval

### For Investors
- 📈 **Tranche Investment**: Choose between Senior (lower risk) or Junior (higher return) tranches
- 💎 **ROI Transparency**: Clear return calculations based on discount rates
- 📊 **Pool Analytics**: Real-time funding progress and pool statistics
- 💵 **Claim Returns**: Automated claim mechanism when receivables are repaid

## 🏗️ Architecture

MantlePay consists of three main components:

### 1. **Receipt NFT Contract** (ERC721)
- Represents invoices as non-fungible tokens
- Minted by customers to approve merchant orders
- Transferred to protocol when pools are created

### 2. **Tranche Token Contracts** (ERC20)
- Senior Tranche Token: Lower risk, stable returns
- Junior Tranche Token: Higher risk, higher returns
- Automatically deployed for each pool

### 3. **Cascade Protocol Contract**
- Core logic for pool creation, investment, repayment, and claims
- Manages payment waterfall between Senior and Junior tranches
- Handles NFT custody and tranche token distribution

### Flow Diagram

```
Merchant → Creates Order → Generates QR Code
                                    ↓
Customer → Scans QR → Approves → Mints Receipt NFT
                                    ↓
Merchant → Creates Pool → Transfers NFT to Protocol
                                    ↓
Investors → Invest in Senior/Junior Tranches
                                    ↓
Pool Funds → Merchant Receives Advance (80% of Receivable)
                                    ↓
Customer → Repays Receivable → Protocol Distributes Returns
                                    ↓
Investors → Claim Returns (Senior First, Then Junior)
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.1** - React framework with App Router
- **React 19.1** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Thirdweb SDK v5** - Blockchain interactions
- **QR Code Libraries** - Order generation and scanning

### Blockchain
- **Mantle Network** - Layer 2 blockchain
- **Solidity 0.8.20** - Smart contract language
- **OpenZeppelin** - Security-tested contract libraries

### Key Libraries
- `thirdweb` - Web3 SDK for wallet and contract interactions
- `qrcode` - QR code generation
- `html5-qrcode` - QR code scanning
- `lucide-react` - Icon library

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Mantle Network wallet (MetaMask recommended)
- Thirdweb Client ID ([Get one here](https://portal.thirdweb.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PayMantle
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here
   ```

4. **Deploy Smart Contracts**
   
   Deploy contracts to Mantle Testnet:
   - First deploy `ReceiptNFT` contract
   - Then deploy `CascadeProtocol` with the ReceiptNFT address
   - Update contract addresses in `src/lib/contracts.ts`

5. **Run the development server**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
bun run build
bun run start
```

## 📜 Smart Contracts

### Contract Addresses (Mantle Testnet)

- **ReceiptNFT**: `0x28226Fe29970E41e54CE46fBa973933F0721E2de`
- **CascadeProtocol**: `0x44994F1f72129deC08457632E7f76224c879e59e`

### Key Functions

#### ReceiptNFT
- `mint(address to)` - Mint a new receipt NFT

#### CascadeProtocol
- `createPool(uint256 tokenId, uint256 receivableValue, uint256 investorReturn, uint256 seniorDiscBPS, uint256 juniorDiscBPS)` - Create a new receivable pool
- `investSenior(uint256 poolId)` - Invest in Senior tranche
- `investJunior(uint256 poolId)` - Invest in Junior tranche
- `repay(uint256 poolId)` - Repay the receivable
- `claim(uint256 poolId)` - Claim returns as an investor

### Security Features

- ✅ ReentrancyGuard protection
- ✅ Ownable access control
- ✅ ERC721Holder for safe NFT transfers
- ✅ Input validation and overflow protection
- ✅ Payment waterfall ensures Senior tranche priority

## 📖 Usage Guide

### For Merchants

1. **Create a Sales Order**
   - Navigate to Merchant Dashboard
   - Fill in order details (Merchant ID, Amount, Due Date)
   - Generate QR code

2. **Share QR Code**
   - Customer scans QR code on their device
   - Customer approves and mints Receipt NFT

3. **Create Pool**
   - NFT appears in "Your R-NFTs" section
   - Click "Create Pool"
   - Set discounts (Senior/Junior)
   - Investor Return (C) is auto-calculated
   - Submit transaction

### For Customers

1. **Scan QR Code**
   - Open Customer Portal
   - Click "Start QR Scanner"
   - Scan merchant's QR code

2. **Review & Approve**
   - Review order details
   - Click "Approve & Mint NFT"
   - Confirm transaction

### For Investors

1. **Browse Pools**
   - View available pools on Pools page
   - Check ROI, funding progress, and pool details

2. **Invest**
   - Select a pool
   - Choose Senior or Junior tranche
   - Enter investment amount
   - Confirm transaction

3. **Claim Returns**
   - Once receivable is repaid
   - Click "Claim Returns" on pool detail page
   - Receive returns automatically

## 📁 Project Structure

```
PayMantle/
├── contracts/              # Smart contracts
│   ├── CascadePool.sol    # Main protocol contract
│   └── ReceiptNFT.sol     # NFT contract
├── src/
│   ├── app/               # Next.js app directory
│   │   ├── customer/      # Customer portal
│   │   ├── merchant/      # Merchant dashboard
│   │   ├── pools/         # Pool listing and details
│   │   └── layout.tsx     # Root layout
│   ├── components/        # React components
│   │   ├── consumer/      # Customer-facing components
│   │   └── ui/            # Reusable UI components
│   ├── lib/               # Utilities and hooks
│   │   ├── contracts.ts   # Contract addresses and ABIs
│   │   ├── hooks.ts      # Custom React hooks
│   │   └── sales-orders.ts # QR code utilities
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
└── package.json          # Dependencies
```

## 🔢 Financial Model

### Key Formulas

**Advance Amount (A)**
```
A = R × 0.8
```
Where R = Receivable Value

**Investor Return (C)**
```
C = A / (s × (1 - dS) + j × (1 - dJ))
```
Where:
- s = Senior share (0.75)
- j = Junior share (0.25)
- dS = Senior discount (in decimal)
- dJ = Junior discount (in decimal)

**ROI Calculation**
```
ROI = discount / (1 - discount) × 100
```

**Example:**
- Receivable Value (R) = 1000 MNT
- Advance (A) = 800 MNT
- Senior Discount = 5% → ROI = 5.26%
- Junior Discount = 12% → ROI = 13.64%

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write clear commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [Mantle Network](https://www.mantle.xyz/)
- [Thirdweb Documentation](https://portal.thirdweb.com/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## 💬 Support

For questions or support, please open an issue on GitHub or contact the development team.

---

<div align="center">

**Built with ❤️ on Mantle Network**

*Empowering merchants with instant liquidity through decentralized finance*

</div>
