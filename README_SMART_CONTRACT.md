# 🔐 LiquidityGuard AI - Smart Contract Implementation Guide

> **Complete guide for developing, testing, and deploying the LiquidityGuardVault smart contract system.**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Decision](#architecture-decision)
3. [Contract Specifications](#contract-specifications)
4. [Development Environment Setup](#development-environment-setup)
5. [Implementation Phases](#implementation-phases)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Guide](#deployment-guide)
8. [Integration with Agents](#integration-with-agents)
9. [Security Considerations](#security-considerations)
10. [Gas Optimization](#gas-optimization)

---

## 🎯 Overview

### **What You're Building**

A **Vault Smart Contract** that:
- Securely holds user funds (ETH, WETH, USDC, stablecoins, etc.)
- Allows approved AI agents to execute strategies on behalf of users
- Integrates with multiple DeFi protocols (Aave V3, Lido, Compound, etc.)
- Supports gasless swaps via 1inch Fusion+
- Implements comprehensive safety mechanisms
- Is production-ready for mainnet deployment after audit

### **Current System Status**

✅ **Complete:**
- 4 AI agents (Position Monitor, Yield Optimizer, Swap Optimizer, Executor)
- Data layer (The Graph subgraph, CoinGecko integration)
- Multi-agent communication (Fetch.ai Agentverse)
- Testing in Demo, Presentation, and Production modes

⏳ **Your Task:**
- Smart contract development (this guide)
- Integration with existing agent system
- Security audit preparation
- Mainnet deployment strategy

### **Why This Contract Matters**

Currently, the **Cross-Chain Executor** (`agents/cross_chain_executor.py`) simulates transactions. Your smart contract will:
1. Enable **real transaction execution** on blockchain
2. Give users **custody of their funds** (non-custodial)
3. Allow **autonomous agent operations** with safety limits
4. Support **production mode** (real swaps, real positions)

---

## 🏗️ Architecture Decision

### **Two Approaches**

#### **Option 1: Monolithic Contract** (⭐ RECOMMENDED FOR HACKATHON)

```
LiquidityGuardVault.sol (Single Contract)
    ├── User Management (deposits, withdrawals, permissions)
    ├── Agent Authorization (approval, execution limits)
    ├── Protocol Integration (Aave, Lido, Compound inline)
    ├── Swap Execution (1inch Fusion+, Uniswap inline)
    └── Safety Guards (HF checks, limits, timelocks)
```

**Advantages:**
- ✅ Faster to develop (1-2 weeks)
- ✅ Simpler deployment (single address)
- ✅ Lower gas costs (no delegate calls)
- ✅ Easier to audit
- ✅ Perfect for hackathon/testnet

**Disadvantages:**
- ❌ Less modular (harder to upgrade protocols)
- ❌ Larger contract size (may hit 24KB limit)
- ❌ Tight coupling of concerns

**Best For:**
- ✅ Initial hackathon demo
- ✅ Sepolia testnet deployment
- ✅ Proof of concept
- ✅ Quick iteration

---

#### **Option 2: Modular Contract System** (Future Production)

```
LiquidityGuardVault.sol (Main Contract)
    ├── UserManager.sol
    ├── AgentManager.sol
    └── ProtocolRouter.sol
            ├── AaveV3Adapter.sol
            ├── LidoAdapter.sol
            ├── CompoundV3Adapter.sol
            └── SwapRouter.sol
                    ├── UniswapV3Adapter.sol
                    └── OneInchFusionAdapter.sol
```

**Advantages:**
- ✅ Highly modular (easy to add protocols)
- ✅ Upgradeable per module
- ✅ Clean separation of concerns
- ✅ Each contract under 24KB limit

**Disadvantages:**
- ❌ Slower to develop (3-4 weeks)
- ❌ Complex deployment (10+ contracts)
- ❌ Higher gas costs (delegate calls)
- ❌ More complex audit

**Best For:**
- ✅ Production mainnet deployment
- ✅ Long-term scalability
- ✅ After security audit
- ✅ After raising funding

---

### **✅ RECOMMENDATION: Start with Option 1**

**Timeline:**
1. **Weeks 1-2:** Build monolithic contract on Sepolia
2. **Weeks 3-4:** Test, integrate with agents, demo ready
3. **Post-Hackathon:** Refactor to modular for mainnet

**Why:**
- Hackathon deadline approaching
- Need working demo fast
- Testnet has no size limits (in practice)
- Can refactor later with more time/budget

---

## 📐 Contract Specifications

### **Core Requirements**

Your contract MUST support:

#### **1. User Fund Management**

```solidity
// Users can deposit any supported ERC20 token or ETH
function deposit(address token, uint256 amount) external payable;

// Users can withdraw with safety checks (maintains min HF)
function withdraw(address token, uint256 amount) external;

// View current position details
function getPosition(address user) external view returns (
    uint256 totalCollateralUSD,
    uint256 totalDebtUSD,
    uint256 healthFactor,
    address[] memory collateralTokens,
    uint256[] memory collateralAmounts,
    address[] memory debtTokens,
    uint256[] memory debtAmounts
);
```

#### **2. Agent Authorization**

```solidity
// User approves an agent to execute strategies
function approveAgent(address agent) external;

// User revokes agent permission
function revokeAgent(address agent) external;

// Check if agent is approved
function isAgentApproved(address user, address agent) external view returns (bool);

// View all approved agents for a user
function getApprovedAgents(address user) external view returns (address[] memory);
```

#### **3. Strategy Execution**

```solidity
enum StrategyType {
    DEPOSIT_COLLATERAL,      // Add collateral to Aave/Compound
    WITHDRAW_COLLATERAL,     // Remove collateral
    BORROW,                  // Borrow against collateral
    REPAY,                   // Repay debt
    REBALANCE,               // Move from one protocol to another
    SWAP,                    // Token swap via 1inch/Uniswap
    STAKE,                   // Stake ETH in Lido/Rocket Pool
    UNSTAKE                  // Unstake and withdraw
}

struct Strategy {
    bytes32 strategyId;          // Unique identifier
    address user;                // Target user
    StrategyType strategyType;   // Type of operation
    address fromProtocol;        // Source protocol address (0x0 if none)
    address toProtocol;          // Destination protocol
    address fromToken;           // Source token
    address toToken;             // Destination token
    uint256 amount;              // Amount to move/swap
    uint256 minAmountOut;        // Slippage protection
    uint256 deadline;            // Execution deadline
    bytes extraData;             // Protocol-specific data
}

// Agents call this to execute strategies
function executeStrategy(
    Strategy calldata strategy,
    bytes calldata signature  // User signature for extra security (optional)
) external returns (bool success);

// Simulate strategy without executing (for agent planning)
function simulateStrategy(
    Strategy calldata strategy
) external view returns (
    bool willSucceed,
    uint256 estimatedGas,
    uint256 expectedOutput,
    uint256 newHealthFactor
);
```

#### **4. Protocol Integration**

**Aave V3 Integration:**
```solidity
// Deposit collateral to Aave V3
function _depositToAave(
    address token,
    uint256 amount,
    address onBehalfOf
) internal;

// Withdraw from Aave V3
function _withdrawFromAave(
    address token,
    uint256 amount,
    address to
) internal returns (uint256);

// Borrow from Aave V3
function _borrowFromAave(
    address token,
    uint256 amount,
    address onBehalfOf
) internal;

// Repay debt to Aave V3
function _repayToAave(
    address token,
    uint256 amount,
    address onBehalfOf
) internal returns (uint256);

// Get user position from Aave
function _getAavePosition(address user) internal view returns (
    uint256 totalCollateralBase,
    uint256 totalDebtBase,
    uint256 availableBorrowsBase,
    uint256 currentLiquidationThreshold,
    uint256 ltv,
    uint256 healthFactor
);
```

**Lido Integration:**
```solidity
// Stake ETH in Lido, get stETH
function _stakeInLido(uint256 amount) internal returns (uint256 stETHAmount);

// Unstake is via sell stETH for ETH (Lido doesn't have direct unstake)
function _unstakeFromLido(uint256 stETHAmount) internal returns (uint256 ethAmount);
```

**Compound V3 Integration:**
```solidity
// Supply collateral to Compound V3
function _supplyToCompound(
    address token,
    uint256 amount
) internal;

// Withdraw from Compound
function _withdrawFromCompound(
    address token,
    uint256 amount
) internal returns (uint256);
```

#### **5. Swap Integration**

**1inch Fusion+ Integration (Priority):**
```solidity
// Create a Fusion+ order for gasless swap
function createFusionOrder(
    address fromToken,
    address toToken,
    uint256 amountIn,
    uint256 minAmountOut,
    uint256 auctionDuration,
    address[] calldata allowedResolvers
) external returns (bytes32 orderHash);

// Resolvers call this to fulfill orders
function executeFusionOrder(
    bytes32 orderHash,
    uint256 amountOut,
    bytes calldata resolverData
) external returns (bool);
```

**Uniswap V3 Fallback:**
```solidity
// Direct swap via Uniswap V3 (if Fusion+ unavailable)
function _swapViaUniswap(
    address fromToken,
    address toToken,
    uint256 amountIn,
    uint256 minAmountOut,
    uint24 poolFee
) internal returns (uint256 amountOut);
```

#### **6. Safety Mechanisms**

```solidity
// Constants
uint256 public constant MIN_HEALTH_FACTOR = 1.2e18;  // Minimum 1.2 HF
uint256 public constant MAX_TX_PERCENT = 50;         // Max 50% per transaction
uint256 public constant LARGE_TX_TIMELOCK = 24 hours; // Delay for large txs

// Modifiers
modifier maintainsHealthFactor(address user) {
    _;
    uint256 hf = getHealthFactor(user);
    require(hf >= MIN_HEALTH_FACTOR, "Health factor too low");
}

modifier withinTransactionLimit(address user, uint256 amount) {
    uint256 totalCollateral = getUserTotalCollateralUSD(user);
    uint256 maxAllowed = totalCollateral * MAX_TX_PERCENT / 100;
    require(amount <= maxAllowed, "Transaction amount too large");
    _;
}

modifier onlyApprovedAgent(address user) {
    require(isAgentApproved(user, msg.sender), "Agent not approved");
    _;
}

// Emergency functions
function pause() external onlyOwner;
function unpause() external onlyOwner;
function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner;
```

---

## 🛠️ Development Environment Setup

### **Step 1: Choose Framework**

**Option A: Hardhat** (Recommended - already set up)
```bash
cd liqx_contracts

# Install dependencies
pnpm install

# Already has:
# - hardhat
# - @openzeppelin/contracts
# - @nomicfoundation/hardhat-toolbox
# - ethers v6
```

**Option B: Foundry** (Alternative - faster testing)
```bash
cd liqx_contracts

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Initialize
forge init --force

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts
forge install aave/aave-v3-core
```

### **Step 2: Install Protocol Dependencies**

```bash
# Aave V3
pnpm add @aave/core-v3

# 1inch
pnpm add @1inch/limit-order-protocol-contract

# Uniswap V3
pnpm add @uniswap/v3-periphery @uniswap/v3-core

# Lido
pnpm add @lido-dao/contracts
```

### **Step 3: Configure Networks**

Edit `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Sepolia testnet (for development)
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY 
        ? [process.env.DEPLOYER_PRIVATE_KEY] 
        : [],
      chainId: 11155111,
    },
    
    // Ethereum mainnet (future production)
    mainnet: {
      url: process.env.ALCHEMY_MAINNET_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY 
        ? [process.env.DEPLOYER_PRIVATE_KEY] 
        : [],
      chainId: 1,
    },
    
    // Local development
    hardhat: {
      chainId: 31337,
      forking: {
        url: process.env.ALCHEMY_SEPOLIA_URL || "",
        enabled: true,
      },
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
```

### **Step 4: Get Testnet Funds**

```bash
# Get Sepolia ETH from faucets:
# 1. https://sepoliafaucet.com
# 2. https://www.alchemy.com/faucets/ethereum-sepolia
# 3. https://faucet.quicknode.com/ethereum/sepolia

# Or use the Alchemy faucet API
curl --request POST \
  --url https://api.g.alchemy.com/v2/${ALCHEMY_API_KEY}/faucet \
  --header 'content-type: application/json' \
  --data '{
    "wallet_address": "YOUR_WALLET_ADDRESS",
    "network": "sepolia"
  }'
```

---

## 🏗️ Implementation Phases

### **Phase 1: Core Vault (Week 1)**

#### **Day 1-2: Basic Structure**

Create `contracts/LiquidityGuardVault.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract LiquidityGuardVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // ============ State Variables ============
    
    struct Position {
        uint256 totalCollateralUSD;
        uint256 totalDebtUSD;
        uint256 healthFactor;
        mapping(address => uint256) collateralByToken;
        mapping(address => uint256) debtByToken;
    }
    
    struct Strategy {
        bytes32 strategyId;
        address user;
        StrategyType strategyType;
        address fromProtocol;
        address toProtocol;
        address fromToken;
        address toToken;
        uint256 amount;
        uint256 minAmountOut;
        uint256 deadline;
        bytes extraData;
        bool executed;
        uint256 executionTime;
    }
    
    enum StrategyType {
        DEPOSIT_COLLATERAL,
        WITHDRAW_COLLATERAL,
        BORROW,
        REPAY,
        REBALANCE,
        SWAP,
        STAKE,
        UNSTAKE
    }
    
    // User positions
    mapping(address => Position) private positions;
    
    // Agent approvals: user => agent => approved
    mapping(address => mapping(address => bool)) public approvedAgents;
    
    // Strategy tracking: strategyId => Strategy
    mapping(bytes32 => Strategy) public strategies;
    
    // Supported tokens
    mapping(address => bool) public supportedTokens;
    
    // ============ Constants ============
    
    uint256 public constant MIN_HEALTH_FACTOR = 1.2e18;
    uint256 public constant MAX_TX_PERCENT = 50;
    uint256 public constant LARGE_TX_TIMELOCK = 24 hours;
    
    // ============ Events ============
    
    event Deposited(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    
    event Withdrawn(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    
    event AgentApproved(
        address indexed user,
        address indexed agent,
        uint256 timestamp
    );
    
    event AgentRevoked(
        address indexed user,
        address indexed agent,
        uint256 timestamp
    );
    
    event StrategyQueued(
        bytes32 indexed strategyId,
        address indexed user,
        StrategyType strategyType,
        uint256 timestamp
    );
    
    event StrategyExecuted(
        bytes32 indexed strategyId,
        address indexed user,
        bool success,
        uint256 timestamp
    );
    
    // ============ Modifiers ============
    
    modifier onlyApprovedAgent(address user) {
        require(
            approvedAgents[user][msg.sender],
            "Agent not approved"
        );
        _;
    }
    
    modifier maintainsHealthFactor(address user) {
        _;
        uint256 hf = getHealthFactor(user);
        require(
            hf >= MIN_HEALTH_FACTOR,
            "Health factor too low"
        );
    }
    
    modifier withinTransactionLimit(address user, uint256 amountUSD) {
        uint256 totalCollateral = positions[user].totalCollateralUSD;
        uint256 maxAllowed = totalCollateral * MAX_TX_PERCENT / 100;
        require(
            amountUSD <= maxAllowed,
            "Transaction amount exceeds limit"
        );
        _;
    }
    
    modifier supportedToken(address token) {
        require(
            supportedTokens[token],
            "Token not supported"
        );
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address[] memory _supportedTokens) {
        // Add supported tokens
        for (uint i = 0; i < _supportedTokens.length; i++) {
            supportedTokens[_supportedTokens[i]] = true;
        }
    }
    
    // ============ User Functions ============
    
    function deposit(
        address token,
        uint256 amount
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        supportedToken(token)
    {
        require(amount > 0, "Amount must be > 0");
        
        // Handle ETH deposits
        if (token == address(0)) {
            require(msg.value == amount, "ETH amount mismatch");
        } else {
            // Transfer ERC20 tokens
            IERC20(token).safeTransferFrom(
                msg.sender,
                address(this),
                amount
            );
        }
        
        // Update position
        positions[msg.sender].collateralByToken[token] += amount;
        
        // Recalculate position values
        _updatePositionValues(msg.sender);
        
        emit Deposited(msg.sender, token, amount, block.timestamp);
    }
    
    function withdraw(
        address token,
        uint256 amount
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        maintainsHealthFactor(msg.sender)
    {
        require(amount > 0, "Amount must be > 0");
        require(
            positions[msg.sender].collateralByToken[token] >= amount,
            "Insufficient balance"
        );
        
        // Update position
        positions[msg.sender].collateralByToken[token] -= amount;
        
        // Recalculate position values
        _updatePositionValues(msg.sender);
        
        // Transfer tokens
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
        
        emit Withdrawn(msg.sender, token, amount, block.timestamp);
    }
    
    function approveAgent(address agent) external {
        require(agent != address(0), "Invalid agent address");
        require(!approvedAgents[msg.sender][agent], "Already approved");
        
        approvedAgents[msg.sender][agent] = true;
        
        emit AgentApproved(msg.sender, agent, block.timestamp);
    }
    
    function revokeAgent(address agent) external {
        require(approvedAgents[msg.sender][agent], "Not approved");
        
        approvedAgents[msg.sender][agent] = false;
        
        emit AgentRevoked(msg.sender, agent, block.timestamp);
    }
    
    // ============ View Functions ============
    
    function getPosition(address user) 
        external 
        view 
        returns (
            uint256 totalCollateralUSD,
            uint256 totalDebtUSD,
            uint256 healthFactor
        ) 
    {
        Position storage pos = positions[user];
        return (
            pos.totalCollateralUSD,
            pos.totalDebtUSD,
            pos.healthFactor
        );
    }
    
    function getHealthFactor(address user) 
        public 
        view 
        returns (uint256) 
    {
        return positions[user].healthFactor;
    }
    
    function isAgentApproved(address user, address agent) 
        external 
        view 
        returns (bool) 
    {
        return approvedAgents[user][agent];
    }
    
    // ============ Internal Functions ============
    
    function _updatePositionValues(address user) internal {
        // TODO: Calculate total collateral and debt in USD
        // TODO: Calculate health factor
        // This will be implemented in Phase 2 with protocol integration
    }
    
    // ============ Admin Functions ============
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
    }
    
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }
    
    // Emergency function - only for recovering stuck funds
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (token == address(0)) {
            payable(to).transfer(amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }
    
    // Receive ETH
    receive() external payable {}
}
```

#### **Day 3-4: Write Unit Tests**

Create `test/LiquidityGuardVault.test.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { LiquidityGuardVault } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LiquidityGuardVault", function () {
  let vault: LiquidityGuardVault;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let agent1: SignerWithAddress;
  let mockToken: any;

  beforeEach(async function () {
    [owner, user1, agent1] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Mock USDC", "mUSDC", 6);

    // Deploy vault
    const Vault = await ethers.getContractFactory("LiquidityGuardVault");
    vault = await Vault.deploy([mockToken.address]);
  });

  describe("Deposits", function () {
    it("Should allow users to deposit tokens", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      
      // Mint tokens to user
      await mockToken.mint(user1.address, depositAmount);
      
      // Approve vault
      await mockToken.connect(user1).approve(vault.address, depositAmount);
      
      // Deposit
      await expect(
        vault.connect(user1).deposit(mockToken.address, depositAmount)
      )
        .to.emit(vault, "Deposited")
        .withArgs(user1.address, mockToken.address, depositAmount);
    });

    it("Should reject deposits of unsupported tokens", async function () {
      const fakeToken = "0x0000000000000000000000000000000000000001";
      
      await expect(
        vault.connect(user1).deposit(fakeToken, 1000)
      ).to.be.revertedWith("Token not supported");
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      // Setup: user deposits tokens
      const depositAmount = ethers.parseUnits("1000", 6);
      await mockToken.mint(user1.address, depositAmount);
      await mockToken.connect(user1).approve(vault.address, depositAmount);
      await vault.connect(user1).deposit(mockToken.address, depositAmount);
    });

    it("Should allow users to withdraw their tokens", async function () {
      const withdrawAmount = ethers.parseUnits("500", 6);
      
      await expect(
        vault.connect(user1).withdraw(mockToken.address, withdrawAmount)
      )
        .to.emit(vault, "Withdrawn")
        .withArgs(user1.address, mockToken.address, withdrawAmount);
    });

    it("Should reject withdrawals exceeding balance", async function () {
      const withdrawAmount = ethers.parseUnits("2000", 6);
      
      await expect(
        vault.connect(user1).withdraw(mockToken.address, withdrawAmount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Agent Management", function () {
    it("Should allow users to approve agents", async function () {
      await expect(
        vault.connect(user1).approveAgent(agent1.address)
      )
        .to.emit(vault, "AgentApproved")
        .withArgs(user1.address, agent1.address);
      
      expect(
        await vault.isAgentApproved(user1.address, agent1.address)
      ).to.be.true;
    });

    it("Should allow users to revoke agents", async function () {
      // First approve
      await vault.connect(user1).approveAgent(agent1.address);
      
      // Then revoke
      await expect(
        vault.connect(user1).revokeAgent(agent1.address)
      )
        .to.emit(vault, "AgentRevoked")
        .withArgs(user1.address, agent1.address);
      
      expect(
        await vault.isAgentApproved(user1.address, agent1.address)
      ).to.be.false;
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to pause", async function () {
      await vault.pause();
      
      await expect(
        vault.connect(user1).deposit(mockToken.address, 1000)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(
        vault.connect(user1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
```

---

### **Phase 2: Protocol Integration (Week 2)**

#### **Aave V3 Integration**

Add Aave interface and implementation:

```solidity
// interfaces/IAaveV3Pool.sol
interface IAaveV3Pool {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;
    
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
    
    function borrow(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        uint16 referralCode,
        address onBehalfOf
    ) external;
    
    function repay(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf
    ) external returns (uint256);
    
    function getUserAccountData(address user)
        external
        view
        returns (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        );
}

// Add to LiquidityGuardVault.sol

// Aave V3 Pool address on Sepolia
IAaveV3Pool public constant AAVE_POOL = 
    IAaveV3Pool(0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951);

function _depositToAave(
    address token,
    uint256 amount,
    address onBehalfOf
) internal {
    // Approve Aave pool
    IERC20(token).approve(address(AAVE_POOL), amount);
    
    // Supply to Aave
    AAVE_POOL.supply(token, amount, onBehalfOf, 0);
}

function _withdrawFromAave(
    address token,
    uint256 amount,
    address to
) internal returns (uint256) {
    return AAVE_POOL.withdraw(token, amount, to);
}

function _getAaveHealthFactor(address user) 
    internal 
    view 
    returns (uint256) 
{
    (, , , , , uint256 healthFactor) = AAVE_POOL.getUserAccountData(user);
    return healthFactor;
}
```

#### **Add Strategy Execution**

```solidity
function executeStrategy(
    Strategy calldata strategy
) 
    external 
    onlyApprovedAgent(strategy.user)
    nonReentrant 
    whenNotPaused
    maintainsHealthFactor(strategy.user)
    returns (bool)
{
    require(
        block.timestamp <= strategy.deadline,
        "Strategy expired"
    );
    require(
        !strategies[strategy.strategyId].executed,
        "Already executed"
    );
    
    // Store strategy
    strategies[strategy.strategyId] = strategy;
    strategies[strategy.strategyId].executionTime = block.timestamp;
    
    // Execute based on type
    bool success;
    
    if (strategy.strategyType == StrategyType.DEPOSIT_COLLATERAL) {
        success = _executeDeposit(strategy);
    } else if (strategy.strategyType == StrategyType.REBALANCE) {
        success = _executeRebalance(strategy);
    } else if (strategy.strategyType == StrategyType.STAKE) {
        success = _executeStake(strategy);
    }
    // ... other types
    
    strategies[strategy.strategyId].executed = success;
    
    emit StrategyExecuted(
        strategy.strategyId,
        strategy.user,
        success,
        block.timestamp
    );
    
    return success;
}

function _executeDeposit(Strategy calldata strategy) 
    internal 
    returns (bool) 
{
    // Get tokens from user's vault balance
    uint256 userBalance = positions[strategy.user]
        .collateralByToken[strategy.fromToken];
    
    require(
        userBalance >= strategy.amount,
        "Insufficient vault balance"
    );
    
    // Deposit to Aave
    _depositToAave(
        strategy.fromToken,
        strategy.amount,
        strategy.user
    );
    
    // Update vault position
    positions[strategy.user].collateralByToken[strategy.fromToken] 
        -= strategy.amount;
    
    return true;
}
```

---

### **Phase 3: 1inch Fusion+ Integration (Week 3)**

#### **Fusion+ Order Creation**

```solidity
// interfaces/IFusionPlus.sol
interface IFusionPlus {
    struct Order {
        uint256 salt;
        address makerAsset;
        address takerAsset;
        address maker;
        address receiver;
        address allowedSender;
        uint256 makingAmount;
        uint256 takingAmount;
        uint256 auctionStartTime;
        uint256 auctionDuration;
        bytes makerAssetData;
        bytes takerAssetData;
    }
    
    function createOrder(Order calldata order) 
        external 
        returns (bytes32 orderHash);
    
    function fillOrder(
        Order calldata order,
        bytes calldata signature,
        uint256 makingAmount,
        uint256 takingAmount
    ) external returns (uint256, uint256);
}

// Add to LiquidityGuardVault.sol

IFusionPlus public constant FUSION_PLUS = 
    IFusionPlus(0x...); // 1inch Fusion+ contract address

mapping(bytes32 => bool) public activeFusionOrders;

function createFusionSwap(
    address user,
    address fromToken,
    address toToken,
    uint256 amountIn,
    uint256 minAmountOut,
    uint256 auctionDuration
) 
    external 
    onlyApprovedAgent(user)
    returns (bytes32 orderHash)
{
    // Create Fusion+ order
    IFusionPlus.Order memory order = IFusionPlus.Order({
        salt: uint256(keccak256(abi.encodePacked(user, block.timestamp))),
        makerAsset: fromToken,
        takerAsset: toToken,
        maker: address(this),
        receiver: address(this),
        allowedSender: address(0), // Any resolver
        makingAmount: amountIn,
        takingAmount: minAmountOut,
        auctionStartTime: block.timestamp,
        auctionDuration: auctionDuration,
        makerAssetData: "",
        takerAssetData: ""
    });
    
    // Approve token
    IERC20(fromToken).approve(address(FUSION_PLUS), amountIn);
    
    // Create order
    orderHash = FUSION_PLUS.createOrder(order);
    activeFusionOrders[orderHash] = true;
    
    return orderHash;
}
```

---

## 🧪 Testing Strategy

### **Local Testing (Hardhat Network)**

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/LiquidityGuardVault.test.ts

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run with coverage
npx hardhat coverage
```

### **Forked Testing (Sepolia Fork)**

```typescript
// hardhat.config.ts - already configured for forking

// test/LiquidityGuardVault.fork.test.ts
describe("LiquidityGuardVault - Forked Tests", function () {
  beforeEach(async function () {
    // Reset fork to specific block
    await ethers.provider.send("hardhat_reset", [{
      forking: {
        jsonRpcUrl: process.env.ALCHEMY_SEPOLIA_URL,
        blockNumber: 5000000
      }
    }]);
  });

  it("Should interact with real Aave V3 on Sepolia", async function () {
    // Test with actual Aave contracts
    const aavePool = await ethers.getContractAt(
      "IAaveV3Pool",
      "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951"
    );
    
    // ... test implementation
  });
});
```

### **Testnet Deployment & Testing**

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia DEPLOYED_ADDRESS

# Run integration tests
npx hardhat test test/integration.test.ts --network sepolia
```

---

## 🚀 Deployment Guide

### **Sepolia Testnet Deployment**

#### **Step 1: Prepare Deployment Script**

Create `scripts/deploy.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying LiquidityGuardVault to Sepolia...");

  // Supported tokens on Sepolia
  const supportedTokens = [
    "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", // WETH
    "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", // USDC (Aave)
    "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357", // DAI (Aave)
    "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0", // USDT (Aave)
  ];

  const LiquidityGuardVault = await ethers.getContractFactory(
    "LiquidityGuardVault"
  );
  
  const vault = await LiquidityGuardVault.deploy(supportedTokens);
  await vault.deployed();

  console.log("✅ LiquidityGuardVault deployed to:", vault.address);
  
  // Wait for 5 confirmations
  console.log("⏳ Waiting for confirmations...");
  await vault.deployTransaction.wait(5);
  
  console.log("✅ Deployment confirmed!");
  
  // Verify on Etherscan
  console.log("📝 Verifying on Etherscan...");
  try {
    await run("verify:verify", {
      address: vault.address,
      constructorArguments: [supportedTokens],
    });
    console.log("✅ Verified on Etherscan!");
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
  
  // Save deployment info
  const deployment = {
    network: "sepolia",
    address: vault.address,
    deployer: (await ethers.getSigners())[0].address,
    timestamp: new Date().toISOString(),
    supportedTokens,
  };
  
  const fs = require("fs");
  fs.writeFileSync(
    "deployment-sepolia.json",
    JSON.stringify(deployment, null, 2)
  );
  
  console.log("💾 Deployment info saved to deployment-sepolia.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

#### **Step 2: Deploy**

```bash
# Set environment variables
export ALCHEMY_SEPOLIA_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
export DEPLOYER_PRIVATE_KEY="your_private_key"
export ETHERSCAN_API_KEY="your_etherscan_key"

# Deploy
npx hardhat run scripts/deploy.ts --network sepolia

# Output:
# 🚀 Deploying LiquidityGuardVault to Sepolia...
# ✅ LiquidityGuardVault deployed to: 0x1234...
# ⏳ Waiting for confirmations...
# ✅ Deployment confirmed!
# 📝 Verifying on Etherscan...
# ✅ Verified on Etherscan!
# 💾 Deployment info saved to deployment-sepolia.json
```

#### **Step 3: Post-Deployment Setup**

```bash
# Interact with deployed contract
npx hardhat console --network sepolia

# In console:
const vault = await ethers.getContractAt(
  "LiquidityGuardVault",
  "0x1234..." // Your deployed address
);

// Add any additional setup
await vault.addSupportedToken("0x...");
```

---

### **Mainnet Deployment (Future)**

⚠️ **DO NOT deploy to mainnet without:**
1. ✅ Complete security audit ($15,000 - $50,000)
2. ✅ Extensive testnet testing (minimum 2 weeks)
3. ✅ Bug bounty program setup
4. ✅ Insurance coverage
5. ✅ Emergency response plan
6. ✅ Multi-sig wallet for admin functions

**Estimated Costs:**
- Security Audit: $15,000 - $50,000
- Bug Bounty: $10,000 initial pool
- Insurance: $5,000 - $20,000/year
- Deployment Gas: ~0.5 ETH ($1,000 - $2,000)
- **Total: $31,000 - $82,000**

**Timeline:**
- Week 1-2: Find audit firm (OpenZeppelin, Trail of Bits, etc.)
- Week 3-6: Audit process
- Week 7: Fix findings
- Week 8: Re-audit
- Week 9: Bug bounty launch
- Week 10: Mainnet deployment

---

## 🔗 Integration with Agents

### **Step 1: Update Cross-Chain Executor**

Edit `agents/cross_chain_executor.py`:

```python
import os
from web3 import Web3
from eth_account import Account
import json

# Load contract ABI
with open('liqx_contracts/artifacts/contracts/LiquidityGuardVault.sol/LiquidityGuardVault.json') as f:
    contract_json = json.load(f)
    VAULT_ABI = contract_json['abi']

# Contract address from deployment
VAULT_ADDRESS = os.getenv('VAULT_CONTRACT_ADDRESS', '0x...')

# Web3 setup
w3 = Web3(Web3.HTTPProvider(os.getenv('ALCHEMY_SEPOLIA_URL')))
vault_contract = w3.eth.contract(address=VAULT_ADDRESS, abi=VAULT_ABI)

# Agent wallet
agent_private_key = os.getenv('EXECUTOR_AGENT_PRIVATE_KEY')
agent_account = Account.from_key(agent_private_key)

async def execute_strategy_on_chain(strategy: RebalanceStrategy):
    """Execute strategy via smart contract"""
    
    # Build strategy struct
    strategy_struct = {
        'strategyId': Web3.keccak(text=strategy.strategy_id),
        'user': strategy.position_id,  # User address
        'strategyType': 4,  # REBALANCE enum value
        'fromProtocol': ADDRESS_ZERO,
        'toProtocol': LIDO_ADDRESS,
        'fromToken': WETH_ADDRESS,
        'toToken': STETH_ADDRESS,
        'amount': Web3.toWei(strategy.amount, 'ether'),
        'minAmountOut': Web3.toWei(strategy.amount * 0.99, 'ether'),  # 1% slippage
        'deadline': int(time.time()) + 3600,  # 1 hour deadline
        'extraData': b''
    }
    
    # Build transaction
    tx = vault_contract.functions.executeStrategy(
        strategy_struct
    ).buildTransaction({
        'from': agent_account.address,
        'gas': 500000,
        'gasPrice': w3.eth.gas_price,
        'nonce': w3.eth.getTransactionCount(agent_account.address),
    })
    
    # Sign transaction
    signed_tx = agent_account.sign_transaction(tx)
    
    # Send transaction
    tx_hash = w3.eth.sendRawTransaction(signed_tx.rawTransaction)
    
    # Wait for receipt
    tx_receipt = w3.eth.waitForTransactionReceipt(tx_hash)
    
    if tx_receipt['status'] == 1:
        ctx.logger.info(f"✅ Strategy executed on-chain: {tx_hash.hex()}")
        return True, tx_hash.hex()
    else:
        ctx.logger.error(f"❌ Strategy execution failed: {tx_hash.hex()}")
        return False, tx_hash.hex()
```

### **Step 2: Update .env**

```bash
# Add to .env
VAULT_CONTRACT_ADDRESS="0x1234..."  # From deployment
EXECUTOR_AGENT_PRIVATE_KEY="0x..."  # Agent wallet private key
EXECUTOR_AGENT_ADDRESS="0x..."      # Agent wallet address
```

### **Step 3: Test Integration**

```bash
# Start agents
./scripts/start_agents.sh

# In PRESENTATION_MODE, trigger event
python scripts/trigger_presentation.py --event market_crash --eth-drop 30

# Check executor logs for on-chain execution
tail -f logs/cross_chain_executor.log

# Should see:
# 📋 ROUTE RECEIVED
# ⚡ Executing strategy on-chain...
# ✅ Strategy executed on-chain: 0xabc123...
# 📊 Transaction confirmed in block 1234567
```

---

## 🔒 Security Considerations

### **Critical Security Checklist**

#### **1. Reentrancy Protection**
- ✅ Use `ReentrancyGuard` on all state-changing functions
- ✅ Follow Checks-Effects-Interactions pattern
- ✅ Update state before external calls

#### **2. Access Control**
- ✅ Use `onlyOwner` for admin functions
- ✅ Implement agent approval system
- ✅ Validate user permissions in every function

#### **3. Integer Overflow/Underflow**
- ✅ Use Solidity 0.8+ (automatic checks)
- ✅ Use SafeMath for any manual calculations

#### **4. Oracle Price Manipulation**
- ✅ Use Chainlink price feeds (not just CoinGecko)
- ✅ Implement price deviation checks
- ✅ Have circuit breakers for extreme price moves

#### **5. Flash Loan Attacks**
- ✅ Health factor checks after ALL operations
- ✅ Transaction amount limits
- ✅ Time delays for large operations

#### **6. Front-Running**
- ✅ Use 1inch Fusion+ (MEV protected)
- ✅ Implement slippage limits
- ✅ Consider commit-reveal schemes

#### **7. Emergency Controls**
- ✅ Pause functionality
- ✅ Emergency withdrawal (owner only)
- ✅ Circuit breakers for extreme scenarios

### **Audit Preparation Checklist**

Before sending for audit:
- [ ] 100% test coverage
- [ ] All functions documented (NatSpec)
- [ ] Deployment scripts tested
- [ ] Gas optimization complete
- [ ] Known issues documented
- [ ] Threat model created
- [ ] Previous audit reports reviewed

---

## ⚡ Gas Optimization

### **Optimization Techniques**

#### **1. Storage Optimization**
```solidity
// ❌ Bad - each uint256 uses full slot
struct Position {
    uint256 collateral;  // 32 bytes
    uint256 debt;        // 32 bytes
    uint256 healthFactor; // 32 bytes
}

// ✅ Good - pack into fewer slots
struct Position {
    uint128 collateral;   // 16 bytes |
    uint128 debt;         // 16 bytes | = 32 bytes (1 slot)
    uint128 healthFactor; // 16 bytes |
    uint64 lastUpdate;    // 8 bytes  |
    uint64 reserved;      // 8 bytes  | = 32 bytes (1 slot)
}
```

#### **2. Use Events for Historical Data**
```solidity
// ❌ Bad - store in array (expensive)
mapping(address => Strategy[]) public userStrategies;

// ✅ Good - emit events (cheaper)
event StrategyExecuted(bytes32 indexed strategyId, ...);
// Query events off-chain via The Graph
```

#### **3. Batch Operations**
```solidity
// Allow agents to execute multiple strategies in one tx
function executeBatch(Strategy[] calldata strategies) 
    external 
    returns (bool[] memory results);
```

#### **4. Use `calldata` Instead of `memory`**
```solidity
// ❌ Bad
function execute(Strategy memory strategy) external;

// ✅ Good
function execute(Strategy calldata strategy) external;
```

### **Gas Benchmarks**

Target gas costs:
- Deposit: <80,000 gas (~$2 at 30 gwei)
- Withdraw: <100,000 gas (~$3)
- Simple strategy execution: <200,000 gas (~$6)
- Complex rebalance: <400,000 gas (~$12)

---

## 📚 Resources

### **Smart Contract Development**
- Solidity Docs: https://docs.soliditylang.org
- OpenZeppelin: https://docs.openzeppelin.com/contracts
- Hardhat Docs: https://hardhat.org/docs

### **DeFi Protocols**
- Aave V3 Docs: https://docs.aave.com/developers/
- 1inch Fusion+: https://docs.1inch.io/docs/fusion-swap/introduction
- Lido Docs: https://docs.lido.fi
- Uniswap V3: https://docs.uniswap.org/protocol/introduction

### **Security**
- OpenZeppelin Security: https://www.openzeppelin.com/security-audits
- Trail of Bits: https://www.trailofbits.com
- Consensys Diligence: https://consensys.net/diligence/

### **Testing & Tools**
- Hardhat Network: https://hardhat.org/hardhat-network
- Etherscan Sepolia: https://sepolia.etherscan.io
- Tenderly: https://tenderly.co (transaction debugging)

---

## 🎯 Success Criteria

Your implementation is complete when:

- [ ] All core functions implemented and tested
- [ ] Aave V3 integration working on Sepolia
- [ ] 1inch Fusion+ orders can be created
- [ ] Agent approval system functional
- [ ] Safety mechanisms enforced (HF, limits, etc.)
- [ ] >90% test coverage
- [ ] Gas optimized (<400k gas per strategy)
- [ ] Deployed to Sepolia testnet
- [ ] Verified on Etherscan
- [ ] Integrated with Python agents
- [ ] End-to-end flow working (alert → strategy → execution → on-chain)
- [ ] Documentation complete

---

## 🚀 Next Steps After Completion

1. **Week 1-2:** Build and test contract on Sepolia
2. **Week 3:** Integrate with agents (update executor)
3. **Week 4:** End-to-end testing with real positions
4. **Post-Hackathon:** Security audit, mainnet prep

**You've got this! Build the future of DeFi safety! 🛡️**
