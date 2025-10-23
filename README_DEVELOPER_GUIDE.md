# 🛠️ LiquidityGuard AI - Developer Documentation

> **Complete developer guide for understanding, installing, testing, and extending the LiquidityGuard AI system.**

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [What's Already Built](#whats-already-built)
3. [Installation & Setup](#installation--setup)
4. [Testing Guide](#testing-guide)
5. [Architecture Deep Dive](#architecture-deep-dive)
6. [Smart Contract Requirements](#smart-contract-requirements)
7. [Frontend Requirements](#frontend-requirements)
8. [What You Should NOT Touch](#what-you-should-not-touch)
9. [Next Steps for Development](#next-steps-for-development)

---

## 🎯 Project Overview

**LiquidityGuard AI** is an autonomous multi-agent system that:
- Monitors DeFi positions for liquidation risk
- Optimizes yields across multiple protocols
- Executes gasless swaps using 1inch Fusion+
- Uses AI (MeTTa) for intelligent decision-making

**Tech Stack:**
- **Backend:** Python 3.13, Fetch.ai uAgents framework
- **Blockchain:** Ethereum Sepolia (testnet), will deploy to mainnet
- **Data:** The Graph (subgraph), CoinGecko API, Alchemy RPC
- **AI:** MeTTa reasoning engine (Python fallback implemented)
- **Smart Contracts:** Solidity (to be developed)
- **Frontend:** Next.js 15, React, TypeScript (to be developed)

---

## ✅ What's Already Built

### **1. Four Autonomous AI Agents**

All agents are **fully functional and tested**:

#### **Position Monitor** (`agents/position_monitor.py`)
- ✅ Monitors DeFi positions every 30 seconds
- ✅ Fetches data from The Graph subgraph
- ✅ Gets live prices from CoinGecko API
- ✅ Calculates health factors
- ✅ MeTTa AI risk assessment (urgency scoring)
- ✅ Sends alerts via Agentverse mailboxes
- ✅ Supports 3 modes: DEMO, PRESENTATION, PRODUCTION

**Endpoints:**
- HTTP: `http://0.0.0.0:8000`
- Agent Address: `agent1qvvp0sl4xwj04jjheaqwl9na6n4ef8zqrv55qfw96jv2584ze0v6cehs64a`

#### **Yield Optimizer** (`agents/yield_optimizer.py`)
- ✅ Receives position alerts
- ✅ Queries protocol APYs (Aave, Compound, Lido, etc.)
- ✅ Calculates optimal rebalancing strategies
- ✅ Considers gas costs and break-even periods
- ✅ MeTTa strategy scoring
- ✅ Sends strategies to Swap Optimizer

**Endpoints:**
- HTTP: `http://0.0.0.0:8001`
- Agent Address: `agent1q2d8kfyfy3fqnc62v3wf3z99nquhqa9nzqpsjd7jqldpzc9pze3nq5lz8vn`

#### **Swap Optimizer** (`agents/swap_optimizer.py`)
- ✅ Receives rebalancing strategies
- ✅ Queries 1inch Fusion+ API for routes
- ✅ Implements gasless swap logic
- ✅ MEV protection via Dutch auctions
- ✅ MeTTa route scoring
- ✅ Sends routes to Executor

**Endpoints:**
- HTTP: `http://0.0.0.0:8002`
- Agent Address: `agent1q2d8kfyfy3fqnc62v3wf3z99nquhqa9nzqpsjd7jqldpzc9pze3nq5lz8vn`

#### **Cross-Chain Executor** (`agents/cross_chain_executor.py`)
- ✅ Receives swap routes
- ✅ Executes multi-step transactions
- ✅ Simulates before executing (safety)
- ✅ Sends feedback to Position Monitor
- ⚠️ Currently in simulation mode (no real transactions yet)

**Endpoints:**
- HTTP: `http://0.0.0.0:8003`
- Agent Address: `agent1qvtks8445uqevmzx7lvyl9w0vx09f2ghu3cnqzpppv89cjrwv9wgx50pu73`

### **2. Data Layer**

#### **The Graph Subgraph** (`liq-x/`)
- ✅ Deployed to The Graph Studio
- ✅ Indexes Aave V3 Sepolia positions
- ✅ GraphQL API: `https://api.studio.thegraph.com/query/1704206/liq-x/v0.1.0`
- ✅ Returns positions with health factors, collateral, debt

**Query Example:**
```graphql
{
  aaveV3Positions(
    where: { healthFactor_lt: "1.5" }
    orderBy: healthFactor
    orderDirection: asc
    first: 100
  ) {
    id
    user
    healthFactor
    totalCollateralBase
    totalDebtBase
    availableBorrowsBase
  }
}
```

#### **Price Feeds** (`data/price_feeds.py`)
- ✅ CoinGecko API integration
- ✅ Supports 50+ tokens
- ✅ Caching to avoid rate limits
- ✅ Mock prices for demo mode
- ✅ Sepolia token address mapping

#### **Protocol Data** (`data/protocol_data.py`)
- ✅ APY data for multiple protocols
- ✅ Cross-chain support (Ethereum, Arbitrum, Solana, etc.)
- ✅ Demo mode with mock APYs

### **3. AI Reasoning**

#### **MeTTa Reasoner** (`agents/metta_reasoner.py`)
- ✅ Risk assessment (0-10 urgency scoring)
- ✅ Strategy scoring (0-100 viability)
- ✅ Route optimization scoring
- ✅ Python fallback when MeTTa not installed
- ⚠️ Full MeTTa interpreter integration pending

### **4. Testing & Deployment**

#### **Testing Scripts**
- ✅ `test_demo_mode.py` - Demo mode validation (archived)
- ✅ `test_production_mode.py` - Production ready validation (archived)
- ✅ Complete test results documented

#### **Deployment Scripts**
- ✅ `check_and_fund_agents.py` - Check and fund agent wallets
- ✅ `fund_agents.py` - Fund agents with TESTFET
- ✅ `deploy_individual_agents.py` - Deploy to Almanac
- ✅ `deploy_to_almanac.sh` - Batch deployment script

#### **Utilities**
- ✅ `scripts/trigger_presentation.py` - Manual demo triggers
- ✅ `scripts/start_agents.sh` - Start all agents
- ✅ `scripts/show_addresses.py` - Display agent addresses

### **5. Configuration**

#### **Environment Variables** (`.env`)
- ✅ Three operation modes (DEMO, PRESENTATION, PRODUCTION)
- ✅ Dynamic mode switching (no code changes needed)
- ✅ All API keys configured
- ✅ Agent addresses stored
- ✅ RPC endpoints configured

**Operation Modes:**
```bash
# DEMO MODE - Simulated data, no blockchain calls
DEMO_MODE=true
PRESENTATION_MODE=false
PRODUCTION_MODE=false

# PRESENTATION MODE - Real data + manual triggers
DEMO_MODE=false
PRESENTATION_MODE=true
PRODUCTION_MODE=false

# PRODUCTION MODE - Full autonomous operation (future)
DEMO_MODE=false
PRESENTATION_MODE=false
PRODUCTION_MODE=true
```

### **6. Documentation**

- ✅ `FINAL_TEST_RESULTS_OCT_22_2025.md` - Complete test results
- ✅ `PRESENTATION_MODE_GUIDE.md` - Judge presentation guide
- ✅ `AGENT_DUTIES_AND_1INCH_GUIDE.md` - Agent responsibilities
- ✅ `ALMANAC_DEPLOYMENT_GUIDE.md` - Deployment instructions
- ✅ `MAILBOX_CREATION_GUIDE.md` - Agentverse setup

---

## 🚀 Installation & Setup

### **Prerequisites**

```bash
# Required
- Python 3.13+
- Node.js 18+ (for subgraph)
- pnpm (for package management)
- Git

# Optional
- MeTTa interpreter (AI reasoning)
- Alchemy API key (Ethereum RPC)
- CoinGecko API key (price feeds)
- 1inch API key (Fusion+ swaps)
```

### **Step 1: Clone & Install**

```bash
# Clone repository
git clone <repository-url>
cd LiqX

# Create Python virtual environment
python3.13 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies (for subgraph)
pnpm install
```

### **Step 2: Configure Environment**

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your API keys:
nano .env
```

**Required Configuration:**
```bash
# Agent Addresses (already configured)
POSITION_MONITOR_ADDRESS="agent1qvvp..."
YIELD_OPTIMIZER_ADDRESS="agent1q2d8..."
SWAP_OPTIMIZER_ADDRESS="agent1q2d8..."
CROSS_CHAIN_EXECUTOR_ADDRESS="agent1qvtk..."

# API Keys
ALCHEMY_API_KEY="your_alchemy_key"
COINGECKO_API_KEY="your_coingecko_key"
ONEINCH_API_KEY="your_1inch_key"

# Operation Mode (choose one)
DEMO_MODE=true              # Start with demo mode
PRESENTATION_MODE=false
PRODUCTION_MODE=false

# Deployment Mode
DEPLOY_MODE="almanac"       # Use Agentverse mailboxes
```

### **Step 3: Fund Agents (Testnet Only)**

```bash
# Check agent balances
python check_and_fund_agents.py

# Fund agents with TESTFET (if needed)
python fund_agents.py
```

### **Step 4: Create Log Directory**

```bash
mkdir -p logs
```

---

## 🧪 Testing Guide

### **Test 1: Demo Mode (Simulated Data)**

**Purpose:** Test the system with simulated data (no blockchain calls)

```bash
# 1. Configure for demo mode
nano .env
# Set: DEMO_MODE=true, PRESENTATION_MODE=false

# 2. Start all agents
./scripts/start_agents.sh

# Or manually:
source .venv/bin/activate
export PYTHONPATH=/Users/prazw/Desktop/LiqX

python agents/position_monitor.py > logs/position_monitor.log 2>&1 &
python agents/yield_optimizer.py > logs/yield_optimizer.log 2>&1 &
python agents/swap_optimizer.py > logs/swap_optimizer.log 2>&1 &
python agents/cross_chain_executor.py > logs/cross_chain_executor.log 2>&1 &

# 3. Monitor logs (in separate terminals)
tail -f logs/position_monitor.log
tail -f logs/yield_optimizer.log
tail -f logs/swap_optimizer.log
tail -f logs/cross_chain_executor.log

# 4. Verify demo mode is working
grep "DEMO" logs/*.log
grep "Mock price" logs/position_monitor.log
grep "Demo position created" logs/position_monitor.log

# 5. Check message flow
grep "ALERT SENT" logs/position_monitor.log
grep "POSITION ALERT RECEIVED" logs/yield_optimizer.log
grep "Profitable strategy found" logs/yield_optimizer.log
grep "Fusion+" logs/swap_optimizer.log

# 6. Stop agents
lsof -ti:8000,8001,8002,8003 | xargs kill -9
pkill -9 -f "python.*agents"
```

**Expected Results:**
- ✅ Demo position created (HF=1.09, $6,400 collateral)
- ✅ Mock prices set (ETH=$3,200, stablecoins=$1.00)
- ✅ Alerts sent and received
- ✅ Profitable strategies found (+2.30% APY)
- ✅ Fusion+ routes generated
- ✅ End-to-end message flow working

---

### **Test 2: Production Ready Mode (Real Data)**

**Purpose:** Test with real blockchain data from Aave V3 Sepolia

```bash
# 1. Configure for production ready mode
nano .env
# Set: DEMO_MODE=false, PRESENTATION_MODE=true

# 2. Verify API keys are set
grep -E "ALCHEMY_API_KEY|COINGECKO_API_KEY" .env

# 3. Start all agents
./scripts/start_agents.sh

# 4. Monitor logs
tail -f logs/position_monitor.log

# 5. Verify real data
grep "Found .* risky positions from subgraph" logs/position_monitor.log
grep "Live prices" logs/position_monitor.log
grep "WETH=\\$" logs/position_monitor.log

# 6. Check subgraph integration
curl -X POST \
  https://api.studio.thegraph.com/query/1704206/liq-x/v0.1.0 \
  -H "Content-Type: application/json" \
  -d '{"query": "{ aaveV3Positions(first: 5) { id user healthFactor } }"}'

# 7. Check CoinGecko prices
python -c "
from data.price_feeds import PriceFeedManager
import asyncio
pfm = PriceFeedManager()
price = asyncio.run(pfm.get_token_price('WETH'))
print(f'WETH Price: \${price:.2f}')
"

# 8. Test manual triggers (optional)
python scripts/trigger_presentation.py --event market_crash --eth-drop 30
python scripts/trigger_presentation.py --event alert_position
python scripts/trigger_presentation.py --event price_drop --token WETH --price 2500

# 9. Stop agents
lsof -ti:8000,8001,8002,8003 | xargs kill -9
pkill -9 -f "python.*agents"
```

**Expected Results:**
- ✅ 20+ real Aave V3 Sepolia positions loaded
- ✅ Live prices from CoinGecko (WETH=$3,800+)
- ✅ Health factors calculated from real data
- ✅ Alerts sent based on actual risk thresholds
- ✅ 90%+ message delivery rate
- ✅ <5 second alert latency

---

### **Test 3: Message Flow Validation**

```bash
# Start agents and wait 2 minutes, then:

echo "=== MESSAGE FLOW TEST ==="
echo ""
echo "Position Monitor → Yield Optimizer:"
SENT=$(grep -c "ALERT SENT" logs/position_monitor.log)
RECEIVED=$(grep -c "POSITION ALERT RECEIVED" logs/yield_optimizer.log)
echo "  Sent: $SENT"
echo "  Received: $RECEIVED"
echo "  Delivery Rate: $(awk "BEGIN {printf \"%.1f%%\", ($RECEIVED/$SENT)*100}")"
echo ""
echo "Yield Optimizer → Swap Optimizer:"
STRATEGIES=$(grep -c "STRATEGY SENT" logs/yield_optimizer.log)
ROUTES=$(grep -c "Fusion+" logs/swap_optimizer.log)
echo "  Strategies Sent: $STRATEGIES"
echo "  Routes Generated: $ROUTES"
echo ""
echo "Swap Optimizer → Executor:"
ROUTES_SENT=$(grep -c "Sending route" logs/swap_optimizer.log)
echo "  Routes Sent: $ROUTES_SENT"
```

---

## 🏗️ Architecture Deep Dive

### **Agent Communication Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    FETCH.AI AGENTVERSE                           │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Mailbox 1   │  │  Mailbox 2   │  │  Mailbox 3   │          │
│  │ (Monitor)    │  │ (Optimizer)  │  │ (Swap)       │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                    LOCAL ENVIRONMENT                             │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Position   │  │    Yield     │  │     Swap     │          │
│  │   Monitor    │→→│  Optimizer   │→→│  Optimizer   │→→        │
│  │   :8000      │  │   :8001      │  │   :8002      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                              ↓                    │
│                                    ┌──────────────┐              │
│                                    │   Executor   │              │
│                                    │   :8003      │              │
│                                    └──────────────┘              │
└─────────────────────────────────────────────────────────────────┘
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATA SOURCES                                  │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  The Graph   │  │  CoinGecko   │  │  1inch API   │          │
│  │  (Positions) │  │  (Prices)    │  │  (Swaps)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### **Message Protocol Definitions**

All message models are defined in `agents/message_protocols.py`:

#### **1. PositionAlert**
```python
class PositionAlert(Model):
    alert_id: str                    # Unique alert identifier
    position_id: str                 # Blockchain position address
    user_address: str                # User's wallet address
    protocol: str                    # "aave", "compound", etc.
    chain: str                       # "ethereum", "arbitrum", etc.
    health_factor: float             # Current health factor
    collateral_usd: float            # Collateral value in USD
    debt_usd: float                  # Debt value in USD
    collateral_tokens: Dict[str, float]  # {"WETH": 31.25, ...}
    debt_tokens: Dict[str, float]    # {"USDC": 75000, ...}
    risk_level: str                  # "LOW", "MODERATE", "HIGH", "CRITICAL"
    urgency_score: int               # 0-10 (from MeTTa)
    timestamp: str                   # ISO 8601 timestamp
```

#### **2. RebalanceStrategy**
```python
class RebalanceStrategy(Model):
    strategy_id: str                 # Unique strategy identifier
    alert_id: str                    # Related alert
    position_id: str                 # Target position
    action_type: str                 # "rebalance", "reduce_debt", "add_collateral"
    current_protocol: str            # Current protocol name
    target_protocol: str             # Target protocol name
    from_token: str                  # Token to move from
    to_token: str                    # Token to move to
    amount: float                    # Amount to move
    current_apy: float               # Current APY
    target_apy: float                # Target APY
    apy_improvement: float           # Percentage improvement
    estimated_cost: float            # Gas + fees in USD
    expected_hf_improvement: float   # Expected HF after action
    metta_score: float               # Strategy score (0-100)
    reasoning: str                   # Why this strategy was chosen
    timestamp: str
```

#### **3. SwapRoute**
```python
class SwapRoute(Model):
    route_id: str                    # Unique route identifier
    strategy_id: str                 # Related strategy
    from_token: str                  # Source token
    to_token: str                    # Destination token
    from_chain: str                  # Source chain
    to_chain: str                    # Destination chain
    amount_in: str                   # Amount in (wei/smallest unit)
    amount_out_min: str              # Minimum acceptable output
    route_type: str                  # "direct", "bridge", "multi-hop"
    fusion_enabled: bool             # Using 1inch Fusion+
    gas_estimate: float              # Estimated gas in USD
    mev_protected: bool              # MEV protection active
    route_steps: List[Dict]          # Detailed route steps
    estimated_execution_time: int    # Seconds
    metta_score: float               # Route quality score
    timestamp: str
```

#### **4. ExecutionFeedback**
```python
class ExecutionFeedback(Model):
    feedback_id: str                 # Unique feedback identifier
    route_id: str                    # Related route
    strategy_id: str                 # Related strategy
    position_id: str                 # Target position
    success: bool                    # Execution succeeded?
    tx_hash: Optional[str]           # Transaction hash (if real tx)
    steps_completed: List[str]       # Which steps succeeded
    new_health_factor: Optional[float]  # New HF after execution
    actual_cost: float               # Actual gas + fees spent
    execution_time: int              # Actual execution time (seconds)
    error_message: Optional[str]     # Error details if failed
    timestamp: str
```

#### **5. PresentationTrigger**
```python
class PresentationTrigger(Model):
    trigger_id: str                  # Unique trigger identifier
    trigger_type: str                # "market_crash", "alert_position", "price_drop"
    secret: str                      # Security secret (must match .env)
    target_position_id: Optional[str]  # For alert_position
    eth_price_drop_percent: Optional[int]  # For market_crash
    custom_price: Optional[float]    # For price_drop
    target_token: Optional[str]      # For price_drop
    timestamp: str
```

---

## 🔐 Smart Contract Requirements

### **Overview**

We need a **Vault Smart Contract** that:
1. Holds user funds securely
2. Allows agents to execute strategies on behalf of users
3. Implements security measures (timelocls, limits, etc.)
4. Supports multiple protocols (Aave, Compound, Lido, etc.)
5. Enables cross-chain operations

### **Core Requirements**

#### **1. User Fund Management**

```solidity
// Users should be able to:
- Deposit collateral (ETH, WETH, USDC, etc.)
- Withdraw funds (with safety checks)
- View their position status
- Approve/revoke agent permissions
```

**Functions Needed:**
```solidity
function deposit(address token, uint256 amount) external payable;
function withdraw(address token, uint256 amount) external;
function getPosition(address user) external view returns (Position memory);
function approveAgent(address agent) external;
function revokeAgent(address agent) external;
```

#### **2. Agent Permissions**

```solidity
// Agents should be able to:
- Execute approved strategies only
- Cannot withdraw user funds directly
- Actions must be within safety limits
- All actions are logged on-chain
```

**Functions Needed:**
```solidity
function executeStrategy(
    address user,
    StrategyType strategyType,
    address fromProtocol,
    address toProtocol,
    address fromToken,
    address toToken,
    uint256 amount,
    bytes calldata data
) external onlyApprovedAgent;

function simulateStrategy(...) external view returns (SimulationResult);
```

#### **3. Multi-Protocol Support**

**Protocols to Support:**
- Aave V3 (lending/borrowing)
- Compound V3 (lending/borrowing)
- Lido (ETH staking)
- Rocket Pool (ETH staking)
- Uniswap V3 (swaps)
- 1inch (aggregated swaps)

**Interface Example:**
```solidity
interface IProtocolAdapter {
    function deposit(address token, uint256 amount) external;
    function withdraw(address token, uint256 amount) external;
    function borrow(address token, uint256 amount) external;
    function repay(address token, uint256 amount) external;
    function getAPY(address token) external view returns (uint256);
    function getHealthFactor(address user) external view returns (uint256);
}
```

#### **4. Safety Mechanisms**

```solidity
// Required Safety Features:
- Minimum health factor enforcement (e.g., HF must stay > 1.2)
- Maximum transaction amounts (e.g., max 50% of collateral per tx)
- Time delays for large operations (24-48 hours)
- Emergency pause functionality
- Withdrawal limits per timeframe
- Slippage protection
```

**Example:**
```solidity
contract SafetyGuard {
    uint256 public constant MIN_HEALTH_FACTOR = 1.2e18;
    uint256 public constant MAX_SINGLE_TX_PERCENT = 50; // 50% max
    uint256 public constant LARGE_TX_TIMELOCK = 24 hours;
    
    modifier maintainsHealthFactor(address user) {
        _;
        require(getHealthFactor(user) >= MIN_HEALTH_FACTOR, "HF too low");
    }
    
    modifier withinTxLimit(address user, uint256 amount) {
        uint256 totalCollateral = getUserCollateral(user);
        require(amount <= totalCollateral * MAX_SINGLE_TX_PERCENT / 100, "Amount too large");
        _;
    }
}
```

#### **5. 1inch Fusion+ Integration**

```solidity
// Must support 1inch Fusion+ orders:
- Create Fusion+ orders on-chain
- Validate resolver execution
- Handle gasless swaps
- Implement MEV protection
```

**Interface:**
```solidity
interface IFusionPlusVault {
    function createFusionOrder(
        address fromToken,
        address toToken,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 auctionDuration,
        address[] calldata allowedResolvers
    ) external returns (bytes32 orderHash);
    
    function executeFusionOrder(
        bytes32 orderHash,
        uint256 actualAmountOut,
        bytes calldata resolverData
    ) external onlyResolver;
}
```

#### **6. Cross-Chain Support**

```solidity
// For future cross-chain operations:
- LayerZero integration (preferred)
- Or Axelar/Wormhole
- Bridge assets between chains
- Execute strategies on multiple chains
```

**Example:**
```solidity
interface ICrossChainVault {
    function bridgeAndExecute(
        uint16 destinationChain,
        address destinationProtocol,
        address token,
        uint256 amount,
        bytes calldata strategyData
    ) external payable;
}
```

### **Contract Architecture**

```
LiquidityGuardVault (Main Contract)
    ├── UserManager (deposits, withdrawals, permissions)
    ├── AgentManager (agent approvals, execution limits)
    ├── ProtocolRouter (routes calls to protocol adapters)
    │   ├── AaveV3Adapter
    │   ├── CompoundV3Adapter
    │   ├── LidoAdapter
    │   └── RocketPoolAdapter
    ├── SwapRouter (handles token swaps)
    │   ├── UniswapV3Adapter
    │   ├── OneInchAdapter
    │   └── FusionPlusAdapter
    ├── SafetyGuard (validates all operations)
    └── CrossChainBridge (optional, future)
```

### **Development Steps**

1. **Phase 1: Core Vault** (Week 1-2)
   - User deposit/withdrawal
   - Basic position tracking
   - Agent permission system
   
2. **Phase 2: Protocol Integration** (Week 3-4)
   - Aave V3 adapter
   - Basic strategy execution
   - Health factor tracking
   
3. **Phase 3: Advanced Features** (Week 5-6)
   - 1inch Fusion+ integration
   - Multiple protocol adapters
   - Safety mechanisms
   
4. **Phase 4: Testing & Audit** (Week 7-8)
   - Comprehensive testing
   - Security audit
   - Gas optimization

### **Testing Requirements**

```solidity
// Test scenarios:
1. User deposits and withdraws funds
2. Agent executes strategy (deposit 10 ETH to Aave)
3. Agent rebalances position (move from Aave to Lido)
4. Health factor drops below threshold (should revert)
5. Large transaction requires timelock
6. Emergency pause stops all operations
7. 1inch Fusion+ gasless swap execution
8. Cross-chain bridge and execute
9. Unauthorized agent tries to execute (should revert)
10. Slippage exceeds limit (should revert)
```

### **Security Considerations**

⚠️ **CRITICAL:**
- **Reentrancy protection** on all state-changing functions
- **Access control** for agent functions
- **Input validation** for all user inputs
- **Oracle price manipulation** protection
- **Flash loan attack** protection
- **Proxy upgrade** pattern for future updates
- **Pause mechanism** for emergencies

### **Gas Optimization**

- Use `uint256` for storage packing
- Minimize storage reads/writes
- Use events for off-chain tracking
- Batch operations where possible
- Consider ERC-4626 for vault standard

### **Example Contract Structure**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract LiquidityGuardVault is Ownable, ReentrancyGuard, Pausable {
    
    // Structs
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
        address fromToken;
        address toToken;
        uint256 amount;
        uint256 executionTime;
        bool executed;
    }
    
    enum StrategyType {
        REBALANCE,
        REDUCE_DEBT,
        ADD_COLLATERAL,
        CROSS_CHAIN
    }
    
    // State
    mapping(address => Position) public positions;
    mapping(address => mapping(address => bool)) public approvedAgents;
    mapping(bytes32 => Strategy) public strategies;
    
    // Constants
    uint256 public constant MIN_HEALTH_FACTOR = 1.2e18;
    uint256 public constant MAX_TX_PERCENT = 50;
    
    // Events
    event Deposited(address indexed user, address indexed token, uint256 amount);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);
    event StrategyQueued(bytes32 indexed strategyId, address indexed user);
    event StrategyExecuted(bytes32 indexed strategyId, bool success);
    event AgentApproved(address indexed user, address indexed agent);
    event AgentRevoked(address indexed user, address indexed agent);
    
    // Modifiers
    modifier onlyApprovedAgent(address user) {
        require(approvedAgents[user][msg.sender], "Agent not approved");
        _;
    }
    
    modifier maintainsHealthFactor(address user) {
        _;
        require(getHealthFactor(user) >= MIN_HEALTH_FACTOR, "HF too low");
    }
    
    // Core Functions
    function deposit(address token, uint256 amount) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        // Implementation
    }
    
    function withdraw(address token, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        maintainsHealthFactor(msg.sender) 
    {
        // Implementation
    }
    
    function executeStrategy(
        address user,
        StrategyType strategyType,
        address fromToken,
        address toToken,
        uint256 amount,
        bytes calldata data
    ) 
        external 
        onlyApprovedAgent(user) 
        nonReentrant 
        whenNotPaused 
        maintainsHealthFactor(user) 
    {
        // Implementation
    }
    
    function getHealthFactor(address user) public view returns (uint256) {
        // Implementation
    }
    
    // Admin Functions
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
```

---

## 🎨 Frontend Requirements

### **Overview**

Build a **Next.js 15** frontend that:
1. Connects user wallets (MetaMask, WalletConnect)
2. Displays user positions and health factors
3. Shows agent activity in real-time
4. Allows users to approve/manage agents
5. Provides analytics and historical data
6. Supports both Demo and Production modes

### **Tech Stack**

```javascript
// Required
- Next.js 15 (App Router)
- React 18+
- TypeScript
- TailwindCSS (styling)
- Ethers.js v6 or Viem (blockchain interaction)
- Wagmi (wallet connection)
- TanStack Query (data fetching)
- Zustand or Jotai (state management)
- Chart.js or Recharts (charts/graphs)

// Optional
- Framer Motion (animations)
- shadcn/ui (component library)
- Vercel (deployment)
```

### **Pages & Routes**

#### **1. Landing Page** `/`
```
Hero Section:
- Catchy headline: "Your AI Guardian for DeFi"
- Value proposition
- "Connect Wallet" CTA
- Live stats: Total Value Protected, Positions Monitored, etc.

Features Section:
- 24/7 Monitoring
- AI-Powered Decisions
- Gasless Transactions
- Cross-Protocol Optimization

How It Works:
- Step-by-step explanation with animations
- Visual workflow diagram

Testimonials/Social Proof:
- (Future) User reviews
- Protocol partnerships

Footer:
- Links, social media, docs
```

#### **2. Dashboard** `/dashboard`
```
Top Bar:
- Wallet connection status
- Network selector (Ethereum, Arbitrum, etc.)
- Total portfolio value
- Agent status indicator (🟢 Active / 🔴 Inactive)

Main Panel:
┌─────────────────────────────────────────────────┐
│  Your Positions                                  │
│  ┌───────────────────────────────────────────┐ │
│  │ Aave V3 - Ethereum                       │ │
│  │ Collateral: 31.25 WETH ($100,000)       │ │
│  │ Debt: 75,000 USDC                        │ │
│  │ Health Factor: 1.33  [████████░░] SAFE  │ │
│  │ Current APY: 5.20%                       │ │
│  └───────────────────────────────────────────┘ │
│                                                  │
│  ┌───────────────────────────────────────────┐ │
│  │ Lido - Ethereum                          │ │
│  │ Staked: 12.5 ETH ($40,000)              │ │
│  │ APY: 7.50%                               │ │
│  │ Rewards: 0.0234 ETH                      │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

Side Panel:
┌─────────────────────────────────────────────────┐
│  Agent Activity (Live)                          │
│  ┌───────────────────────────────────────────┐ │
│  │ 🔍 Monitoring 3 positions...             │ │
│  │ 10 seconds ago                            │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ ⚠️ Alert: Position HF dropped to 1.12   │ │
│  │ 2 minutes ago                             │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ 💡 Strategy: Rebalance to Lido           │ │
│  │ Expected: +2.3% APY                       │ │
│  │ 2 minutes ago                             │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ ✅ Executed: Moved 20 ETH to Lido        │ │
│  │ Tx: 0xabc1...                            │ │
│  │ 5 minutes ago                             │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

Bottom Charts:
- Portfolio value over time (line chart)
- APY comparison across protocols (bar chart)
- Health factor history (line chart)
```

#### **3. Positions** `/positions`
```
Detailed view of all positions:
- Table with sortable columns
- Filter by protocol, chain, risk level
- Export data (CSV, JSON)
- Detailed metrics per position
```

#### **4. Agents** `/agents`
```
Agent Management:
┌─────────────────────────────────────────────────┐
│  Your Approved Agents                           │
│  ┌───────────────────────────────────────────┐ │
│  │ ✅ Position Monitor                       │ │
│  │ Address: agent1qvvp...                   │ │
│  │ Status: Active 🟢                         │ │
│  │ Last Activity: 10 seconds ago            │ │
│  │ [Revoke Access]                          │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ ✅ Yield Optimizer                        │ │
│  │ Address: agent1q2d8...                   │ │
│  │ Status: Active 🟢                         │ │
│  │ Strategies Executed: 12                   │ │
│  │ [Revoke Access]                          │ │
│  └───────────────────────────────────────────┘ │
│                                                  │
│  [+ Approve New Agent]                          │
└─────────────────────────────────────────────────┘

Agent Statistics:
- Total actions taken
- Success rate
- Gas saved (via Fusion+)
- APY improvement total
```

#### **5. Analytics** `/analytics`
```
Comprehensive Analytics:
- Portfolio performance over time
- APY comparison: manual vs agent-managed
- Gas costs saved
- Liquidation risks prevented
- Best performing strategies
- Protocol utilization breakdown
```

#### **6. History** `/history`
```
Transaction History:
- All agent actions
- User deposits/withdrawals
- Filterable by date, type, agent
- Export functionality
- Detailed transaction view (modal)
```

#### **7. Settings** `/settings`
```
User Preferences:
- Risk tolerance (Conservative / Moderate / Aggressive)
- Notification preferences (email, telegram, push)
- Minimum health factor threshold
- Maximum transaction amount per strategy
- Preferred protocols
- Auto-approve strategies (on/off)
```

#### **8. Demo Mode** `/demo`
```
Interactive Demo:
- Pre-loaded demo positions
- "Trigger Market Crash" button
- Watch agents respond in real-time
- Animated workflow
- No wallet connection needed
- Perfect for presentations
```

### **Key Components**

#### **1. Wallet Connection**
```typescript
// components/WalletConnect.tsx
import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  
  return (
    <div>
      {!isConnected ? (
        <button onClick={() => connect({ connector: connectors[0] })}>
          Connect Wallet
        </button>
      ) : (
        <div>
          <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          <button onClick={() => disconnect()}>Disconnect</button>
        </div>
      )}
    </div>
  )
}
```

#### **2. Position Card**
```typescript
// components/PositionCard.tsx
interface Position {
  id: string
  protocol: string
  chain: string
  collateral: { token: string; amount: number; valueUSD: number }[]
  debt: { token: string; amount: number; valueUSD: number }[]
  healthFactor: number
  currentAPY: number
}

export function PositionCard({ position }: { position: Position }) {
  const riskLevel = getRiskLevel(position.healthFactor)
  const riskColor = {
    SAFE: 'text-green-500',
    MODERATE: 'text-yellow-500',
    HIGH: 'text-orange-500',
    CRITICAL: 'text-red-500'
  }[riskLevel]
  
  return (
    <div className="border rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3>{position.protocol} - {position.chain}</h3>
        <span className={riskColor}>{riskLevel}</span>
      </div>
      
      <div className="space-y-2">
        <div>
          <label>Collateral:</label>
          {position.collateral.map(c => (
            <div key={c.token}>
              {c.amount} {c.token} (${c.valueUSD.toLocaleString()})
            </div>
          ))}
        </div>
        
        <div>
          <label>Debt:</label>
          {position.debt.map(d => (
            <div key={d.token}>
              {d.amount} {d.token} (${d.valueUSD.toLocaleString()})
            </div>
          ))}
        </div>
        
        <div>
          <label>Health Factor:</label>
          <HealthFactorBar value={position.healthFactor} />
        </div>
        
        <div>
          <label>Current APY:</label>
          <span>{position.currentAPY}%</span>
        </div>
      </div>
    </div>
  )
}
```

#### **3. Agent Activity Feed**
```typescript
// components/AgentActivityFeed.tsx
import { useQuery } from '@tanstack/react-query'

export function AgentActivityFeed() {
  const { data: activities } = useQuery({
    queryKey: ['agent-activities'],
    queryFn: fetchAgentActivities,
    refetchInterval: 5000 // Poll every 5 seconds
  })
  
  return (
    <div className="space-y-2">
      <h3>Agent Activity (Live)</h3>
      {activities?.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  )
}

function ActivityItem({ activity }: { activity: Activity }) {
  const icon = {
    monitoring: '🔍',
    alert: '⚠️',
    strategy: '💡',
    execution: '⚡',
    success: '✅',
    failure: '❌'
  }[activity.type]
  
  return (
    <div className="border-l-4 border-blue-500 pl-4 py-2">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span>{activity.message}</span>
      </div>
      <span className="text-sm text-gray-500">
        {formatRelativeTime(activity.timestamp)}
      </span>
    </div>
  )
}
```

#### **4. Demo Mode Controller**
```typescript
// components/DemoController.tsx
export function DemoController() {
  const [isRunning, setIsRunning] = useState(false)
  
  const triggerMarketCrash = async () => {
    setIsRunning(true)
    await fetch('/api/trigger-demo', {
      method: 'POST',
      body: JSON.stringify({ event: 'market_crash', ethDrop: 30 })
    })
  }
  
  return (
    <div className="space-y-4">
      <h2>Interactive Demo</h2>
      <p>Watch our AI agents respond to a market crash in real-time!</p>
      
      <button 
        onClick={triggerMarketCrash}
        disabled={isRunning}
        className="bg-red-500 text-white px-6 py-3 rounded-lg"
      >
        {isRunning ? 'Crash in Progress...' : 'Trigger Market Crash (-30%)'}
      </button>
      
      {isRunning && (
        <div className="space-y-2">
          <Step status="complete">Market crash detected</Step>
          <Step status="active">Calculating strategies...</Step>
          <Step status="pending">Executing rebalance...</Step>
          <Step status="pending">Position secured!</Step>
        </div>
      )}
    </div>
  )
}
```

### **API Routes (Next.js)**

```typescript
// app/api/positions/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userAddress = searchParams.get('address')
  
  // Fetch from The Graph
  const positions = await fetchPositionsFromSubgraph(userAddress)
  
  return Response.json(positions)
}

// app/api/agents/activity/route.ts
export async function GET() {
  // Fetch recent agent activities from logs or database
  const activities = await fetchAgentActivities()
  
  return Response.json(activities)
}

// app/api/trigger-demo/route.ts
export async function POST(request: Request) {
  const { event, ethDrop } = await request.json()
  
  // Call Python agent trigger script
  const result = await triggerPresentationMode(event, ethDrop)
  
  return Response.json(result)
}

// app/api/analytics/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userAddress = searchParams.get('address')
  const timeframe = searchParams.get('timeframe') || '30d'
  
  // Calculate analytics
  const analytics = await calculateAnalytics(userAddress, timeframe)
  
  return Response.json(analytics)
}
```

### **State Management**

```typescript
// store/usePositionsStore.ts
import { create } from 'zustand'

interface PositionsState {
  positions: Position[]
  isLoading: boolean
  error: string | null
  fetchPositions: (address: string) => Promise<void>
  refreshPositions: () => void
}

export const usePositionsStore = create<PositionsState>((set, get) => ({
  positions: [],
  isLoading: false,
  error: null,
  
  fetchPositions: async (address) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/positions?address=${address}`)
      const positions = await response.json()
      set({ positions, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },
  
  refreshPositions: () => {
    const { fetchPositions } = get()
    // Re-fetch using current address
  }
}))
```

### **Real-Time Updates**

```typescript
// hooks/useRealtimeAgentActivity.ts
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export function useRealtimeAgentActivity() {
  const queryClient = useQueryClient()
  
  // Poll every 5 seconds
  const { data } = useQuery({
    queryKey: ['agent-activity'],
    queryFn: () => fetch('/api/agents/activity').then(r => r.json()),
    refetchInterval: 5000
  })
  
  // Optional: WebSocket for instant updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws')
    
    ws.onmessage = (event) => {
      const activity = JSON.parse(event.data)
      queryClient.setQueryData(['agent-activity'], (old: any[]) => 
        [activity, ...old]
      )
    }
    
    return () => ws.close()
  }, [])
  
  return data
}
```

### **UI/UX Guidelines**

**Design Principles:**
1. **Clarity:** Users should understand their position status at a glance
2. **Trust:** Show agent activity transparently (all decisions visible)
3. **Speed:** Real-time updates, fast loading
4. **Safety:** Warnings for risky actions, confirmation modals
5. **Education:** Tooltips explaining DeFi concepts

**Color Scheme:**
```css
/* Risk Levels */
--safe: #10b981       /* green-500 */
--moderate: #f59e0b   /* amber-500 */
--high: #f97316       /* orange-500 */
--critical: #ef4444   /* red-500 */

/* Agent Status */
--active: #10b981     /* green-500 */
--inactive: #6b7280   /* gray-500 */
--processing: #3b82f6 /* blue-500 */

/* Primary */
--primary: #6366f1    /* indigo-500 */
--secondary: #8b5cf6  /* violet-500 */
```

**Animations:**
- Smooth transitions (300ms)
- Loading skeletons
- Success/error toast notifications
- Pulsing indicators for live data
- Confetti for successful strategy execution

### **Responsive Design**

```typescript
// Mobile-first approach
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  gap-4
">
  {positions.map(p => <PositionCard key={p.id} position={p} />)}
</div>
```

### **Accessibility**

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus indicators

---

## ⚠️ What You Should NOT Touch

### **Critical Files - DO NOT MODIFY:**

1. **.env** - Configuration file
   - Contains all API keys and agent addresses
   - If you need to change modes, edit carefully
   - DO NOT commit to git (in .gitignore)

2. **agents/position_monitor.py** - Core monitoring logic
   - Tested and working
   - Only touch if fixing bugs
   - Don't change monitoring intervals without testing

3. **agents/yield_optimizer.py** - Strategy calculation
   - AI reasoning logic is tuned
   - Don't modify MeTTa scoring without understanding

4. **agents/swap_optimizer.py** - Route optimization
   - 1inch Fusion+ integration is delicate
   - Don't change API endpoints

5. **agents/cross_chain_executor.py** - Transaction execution
   - Security-critical code
   - Modifying could cause loss of funds

6. **agents/message_protocols.py** - Message definitions
   - All agents depend on these
   - Changing will break communication

7. **data/price_feeds.py** - Price feed logic
   - CoinGecko integration is tested
   - Rate limiting is carefully configured

8. **The Graph Subgraph** (liq-x/)
   - Already deployed and syncing
   - Re-deploying requires new endpoint update everywhere

### **Files You CAN Modify:**

1. **Smart Contracts** (liqx_contracts/)
   - All contracts to be written by you
   - Follow requirements in this doc

2. **Frontend** (src/)
   - Build according to requirements
   - Use Next.js 15 app router

3. **Documentation** (*.md)
   - Update as you build
   - Add your own notes

4. **Test Scripts** (archive/test_scripts/)
   - Archived, not critical
   - Can modify or create new ones

### **Environment Variables to Keep:**

```bash
# DO NOT CHANGE:
POSITION_MONITOR_ADDRESS="agent1qvvp0sl4xwj04jjheaqwl9na6n4ef8zqrv55qfw96jv2584ze0v6cehs64a"
YIELD_OPTIMIZER_ADDRESS="agent1q2d8kfyfy3fqnc62v3wf3z99nquhqa9nzqpsjd7jqldpzc9pze3nq5lz8vn"
SWAP_OPTIMIZER_ADDRESS="agent1q2d8kfyfy3fqnc62v3wf3z99nquhqa9nzqpsjd7jqldpzc9pze3nq5lz8vn"
CROSS_CHAIN_EXECUTOR_ADDRESS="agent1qvtks8445uqevmzx7lvyl9w0vx09f2ghu3cnqzpppv89cjrwv9wgx50pu73"
DEPLOY_MODE="almanac"

# CAN ADD YOUR KEYS:
YOUR_WALLET_PRIVATE_KEY="..."
YOUR_INFURA_KEY="..."
```

---

## 🚀 Next Steps for Development

### **Phase 1: Smart Contract Development** (2-3 weeks)

**Week 1:**
- [ ] Set up Hardhat/Foundry project
- [ ] Write core Vault contract
- [ ] Implement user deposit/withdrawal
- [ ] Add basic position tracking
- [ ] Write unit tests

**Week 2:**
- [ ] Implement Aave V3 adapter
- [ ] Add agent permission system
- [ ] Implement strategy execution
- [ ] Add safety mechanisms
- [ ] More tests

**Week 3:**
- [ ] Add 1inch Fusion+ integration
- [ ] Implement multiple protocol adapters
- [ ] Gas optimization
- [ ] Integration tests
- [ ] Deploy to Sepolia testnet

**Deliverables:**
- ✅ Working vault contract on Sepolia
- ✅ Comprehensive test suite (>90% coverage)
- ✅ Deployment scripts
- ✅ Contract documentation

### **Phase 2: Frontend Development** (3-4 weeks)

**Week 1:**
- [ ] Next.js 15 project setup
- [ ] Design system (Tailwind + components)
- [ ] Wallet connection (wagmi)
- [ ] Landing page
- [ ] Dashboard layout

**Week 2:**
- [ ] Position cards and display
- [ ] Agent activity feed
- [ ] Real-time updates
- [ ] Analytics page
- [ ] History page

**Week 3:**
- [ ] Agent management page
- [ ] Settings page
- [ ] Demo mode page
- [ ] Charts and graphs
- [ ] Mobile responsive

**Week 4:**
- [ ] Smart contract integration
- [ ] Transaction flows
- [ ] Error handling
- [ ] Testing (Playwright/Cypress)
- [ ] Polish & animations

**Deliverables:**
- ✅ Fully functional frontend on Vercel
- ✅ Connected to smart contracts
- ✅ Real-time agent activity
- ✅ Demo mode for presentations

### **Phase 3: Integration & Testing** (1-2 weeks)

**Week 1:**
- [ ] Connect frontend to agents
- [ ] End-to-end testing
- [ ] Bug fixes
- [ ] Performance optimization

**Week 2:**
- [ ] Security review
- [ ] Gas optimization
- [ ] User testing
- [ ] Documentation updates

**Deliverables:**
- ✅ Fully integrated system
- ✅ All tests passing
- ✅ Ready for security audit

### **Phase 4: Security Audit & Mainnet Prep** (2-3 weeks)

- [ ] Internal security review
- [ ] External audit (if budget allows)
- [ ] Fix audit findings
- [ ] Mainnet deployment plan
- [ ] Emergency procedures
- [ ] Monitoring setup

**Deliverables:**
- ✅ Audit report
- ✅ All issues fixed
- ✅ Ready for mainnet

---

## 📞 Getting Help

### **If You're Stuck:**

1. **Read the docs:** Check all README files and guides
2. **Check logs:** Most issues are logged in `logs/` directory
3. **Test in demo mode:** Use `DEMO_MODE=true` to test safely
4. **Review test results:** See `FINAL_TEST_RESULTS_OCT_22_2025.md`
5. **Ask questions:** Document what you tried first

### **Common Issues:**

**Agents won't start:**
```bash
# Check if ports are in use
lsof -ti:8000,8001,8002,8003

# Kill existing processes
pkill -9 -f "python.*agents"

# Check .env configuration
grep -E "DEMO_MODE|PRESENTATION_MODE" .env
```

**No alerts being sent:**
```bash
# Check Position Monitor logs
tail -f logs/position_monitor.log

# Verify subgraph is working
curl -X POST https://api.studio.thegraph.com/query/1704206/liq-x/v0.1.0 \
  -d '{"query": "{ aaveV3Positions(first: 1) { id } }"}'
```

**Message delivery issues:**
```bash
# Check mailbox connections
grep "Mailbox access token acquired" logs/*.log

# Verify agents are registered
grep "Registration.*successful" logs/*.log
```

### **Resources:**

- **Fetch.ai Docs:** https://docs.fetch.ai
- **The Graph Docs:** https://thegraph.com/docs
- **1inch Fusion+ Docs:** https://docs.1inch.io/docs/fusion-swap/introduction
- **Aave V3 Docs:** https://docs.aave.com/developers/
- **Next.js Docs:** https://nextjs.org/docs

---

## 📝 Development Checklist

Before starting, ensure you have:

- [ ] Read this entire document
- [ ] Installed all prerequisites
- [ ] Configured .env file
- [ ] Tested demo mode successfully
- [ ] Tested production ready mode successfully
- [ ] Understood agent communication flow
- [ ] Reviewed smart contract requirements
- [ ] Reviewed frontend requirements
- [ ] Know what NOT to touch
- [ ] Have questions written down

---

**Ready to build? Let's make DeFi safer together! 🚀**
