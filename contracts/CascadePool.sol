// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================================
// DEPENDENCIES (OpenZeppelin v5.0 Compatible)
// ============================================================================
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// ============================================================================
// 1. RECEIPT NFT (The Invoice)
// ============================================================================
contract ReceiptNFT is ERC721, Ownable {
    uint256 public nextId;

    // Fix: Pass msg.sender to Ownable constructor
    constructor() ERC721("Cascade Invoice", "INV") Ownable(msg.sender) {}

    function mint(address to) external returns (uint256) {
        uint256 tokenId = nextId++;
        _mint(to, tokenId);
        return tokenId;
    }
}

// ============================================================================
// 2. TRANCHE TOKEN (The Investor Shares)
// ============================================================================
contract TrancheToken is ERC20, Ownable {
    // Fix: Pass msg.sender to Ownable constructor
    constructor(string memory name, string memory symbol) 
        ERC20(name, symbol) 
        Ownable(msg.sender) 
    {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}

// ============================================================================
// 3. CASCADE PROTOCOL (Main Logic - Mantle Native)
// ============================================================================
contract CascadeProtocol is ReentrancyGuard, ERC721Holder, Ownable {
    
    struct Pool {
        address merchant;
        uint256 receivableValue;    // R (in MNT/Wei)
        uint256 advanceAmount;      // A (in MNT/Wei)
        
        // Tranche Contracts
        TrancheToken seniorToken;
        TrancheToken juniorToken;
        
        // Math
        uint256 seniorFaceValue;    // Amount owed to Seniors
        uint256 seniorTargetRaise;  // Amount Seniors pay
        uint256 juniorFaceValue;    // Amount owed to Juniors
        uint256 juniorTargetRaise;  // Amount Juniors pay
        
        // State
        uint256 seniorRaised;
        uint256 juniorRaised;
        uint256 totalRepaid;        // Total HBAR repaid by customer
        bool isFunded;
    }

    uint256 public poolCount;
    mapping(uint256 => Pool) public pools;
    ReceiptNFT public receiptNft;

    // Events
    event PoolCreated(uint256 indexed poolId, uint256 targetRaise);
    event Invested(uint256 indexed poolId, string tranche, uint256 amount);
    event MerchantFunded(uint256 indexed poolId, uint256 amount);
    event RepaymentReceived(uint256 indexed poolId, uint256 amount);
    event Claimed(uint256 indexed poolId, address indexed user, uint256 amount);

    // Fix: Pass msg.sender to Ownable constructor
    constructor(address _receiptNft) Ownable(msg.sender) {
        receiptNft = ReceiptNFT(_receiptNft);
    }

    // ------------------------------------------------------------------------
    // A. MERCHANT: Create Pool
    // ------------------------------------------------------------------------
    function createPool(
        uint256 _tokenId,
        uint256 _receivableValue,   // Total Invoice Value (MNT Wei)
        uint256 _investorReturn,    // Total Interest for Investors (MNT Wei)
        uint256 _seniorDiscBPS,     // 100 = 1%
        uint256 _juniorDiscBPS      // 1200 = 12%
    ) external nonReentrant {
        // 1. Custody the NFT
        receiptNft.safeTransferFrom(msg.sender, address(this), _tokenId);

        poolCount++;
        Pool storage p = pools[poolCount];

        // 2. Calculate Constants
        uint256 advance = (_receivableValue * 80) / 100; // 80% LTV
        uint256 claimTotal = advance + _investorReturn;

        p.merchant = msg.sender;
        p.receivableValue = _receivableValue;
        p.advanceAmount = advance;

        // Split Claim: 75% Senior / 25% Junior
        p.seniorFaceValue = (claimTotal * 75) / 100; 
        p.juniorFaceValue = (claimTotal * 25) / 100;

        // Apply Discounts to determine Target Raise
        p.seniorTargetRaise = p.seniorFaceValue - ((p.seniorFaceValue * _seniorDiscBPS) / 10000);
        p.juniorTargetRaise = p.juniorFaceValue - ((p.juniorFaceValue * _juniorDiscBPS) / 10000);

        // 3. Deploy Tranche Tokens
        string memory pid = Strings.toString(poolCount);
        p.seniorToken = new TrancheToken(
            string(abi.encodePacked("Senior Tranche ", pid)), 
            string(abi.encodePacked("Snr-", pid))
        );
        p.juniorToken = new TrancheToken(
            string(abi.encodePacked("Junior Tranche ", pid)), 
            string(abi.encodePacked("Jnr-", pid))
        );

        emit PoolCreated(poolCount, p.seniorTargetRaise + p.juniorTargetRaise);
    }

    // ------------------------------------------------------------------------
    // B. INVESTOR: Fund Pool (Native MNT)
    // ------------------------------------------------------------------------
    function investSenior(uint256 _poolId) external payable nonReentrant {
        Pool storage p = pools[_poolId];
        require(!p.isFunded, "Pool already funded");
        require(p.seniorRaised + msg.value <= p.seniorTargetRaise, "Senior full");

        p.seniorRaised += msg.value;

        // Mint Tokens: (Contribution * FaceValue) / TargetRaise
        // This scales the tokens so 1 Token = 1 Unit of Future Claim
        uint256 mintAmt = (msg.value * p.seniorFaceValue) / p.seniorTargetRaise;
        p.seniorToken.mint(msg.sender, mintAmt);

        emit Invested(_poolId, "SENIOR", msg.value);
        _checkFunding(_poolId);
    }

    function investJunior(uint256 _poolId) external payable nonReentrant {
        Pool storage p = pools[_poolId];
        require(!p.isFunded, "Pool already funded");
        require(p.juniorRaised + msg.value <= p.juniorTargetRaise, "Junior full");

        p.juniorRaised += msg.value;

        uint256 mintAmt = (msg.value * p.juniorFaceValue) / p.juniorTargetRaise;
        p.juniorToken.mint(msg.sender, mintAmt);

        emit Invested(_poolId, "JUNIOR", msg.value);
        _checkFunding(_poolId);
    }

    function _checkFunding(uint256 _poolId) internal {
        Pool storage p = pools[_poolId];
        // If both full
        if (p.seniorRaised >= p.seniorTargetRaise && p.juniorRaised >= p.juniorTargetRaise) {
            p.isFunded = true;
            // Transfer MNT to Merchant
            (bool success, ) = payable(p.merchant).call{value: p.advanceAmount}("");
            require(success, "MNT Transfer Failed");
            emit MerchantFunded(_poolId, p.advanceAmount);
        }
    }

    // ------------------------------------------------------------------------
    // C. PAYER: Repay Loan (Native MNT)
    // ------------------------------------------------------------------------
    function repay(uint256 _poolId) external payable nonReentrant {
        Pool storage p = pools[_poolId];
        require(p.isFunded, "Not funded yet");
        p.totalRepaid += msg.value;
        emit RepaymentReceived(_poolId, msg.value);
    }

    // ------------------------------------------------------------------------
    // D. WATERFALL: Claim Returns (Native MNT)
    // ------------------------------------------------------------------------
    function claim(uint256 _poolId) external nonReentrant {
        Pool storage p = pools[_poolId];
        uint256 payout = 0;

        // 1. Senior Waterfall
        uint256 sBal = p.seniorToken.balanceOf(msg.sender);
        if (sBal > 0) {
            // Senior gets paid first
            uint256 seniorFilled = p.totalRepaid > p.seniorFaceValue ? p.seniorFaceValue : p.totalRepaid;
            
            // Value = (Balance * FilledAmount) / TotalFaceValue
            // Note: Logic assumes tokens represent full face value
            uint256 val = (sBal * seniorFilled) / p.seniorFaceValue; 
            
            // Simple Hackathon Logic: Burn all, pay calculated value
            // (Production needs logic for partial repayment streams)
            if (val > 0) {
                p.seniorToken.burn(msg.sender, sBal);
                payout += val;
            }
        }

        // 2. Junior Waterfall
        uint256 jBal = p.juniorToken.balanceOf(msg.sender);
        if (jBal > 0) {
            // Junior gets paid after Senior is 100% full
            uint256 juniorFilled = 0;
            if (p.totalRepaid > p.seniorFaceValue) {
                uint256 remaining = p.totalRepaid - p.seniorFaceValue;
                juniorFilled = remaining > p.juniorFaceValue ? p.juniorFaceValue : remaining;
            }

            if (juniorFilled > 0) {
                uint256 val = (jBal * juniorFilled) / p.juniorFaceValue;
                if (val > 0) {
                    p.juniorToken.burn(msg.sender, jBal);
                    payout += val;
                }
            }
        }

        require(payout > 0, "Nothing to claim");
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Payout failed");
        emit Claimed(_poolId, msg.sender, payout);
    }

    function claimMerchantResidual(uint256 _poolId) external nonReentrant {
        Pool storage p = pools[_poolId];
        require(msg.sender == p.merchant, "Not merchant");
        
        uint256 debt = p.seniorFaceValue + p.juniorFaceValue;
        require(p.totalRepaid > debt, "Investors not paid yet");

        uint256 residual = p.totalRepaid - debt;
        p.totalRepaid -= residual; // Adjust state to prevent double claim

        (bool success, ) = payable(msg.sender).call{value: residual}("");
        require(success, "Payout failed");
    }

    // Receive function to accept MNT if sent directly (fallback)
    receive() external payable {}
}