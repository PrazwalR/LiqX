# 🔄 LIQUIDITYGUARD AI - WORKFLOW FLOWCHARTS

## Overview: Demo Mode vs Normal (Production) Mode

---

## 📊 COMPLETE SYSTEM FLOWCHART

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LIQUIDITYGUARD AI SYSTEM                         │
│                                                                     │
│  User Position on Aave                                              │
│  - 2 ETH collateral ($7,700)                                        │
│  - 5,000 USDC debt                                                  │
│  - Health Factor: 1.31 ⚠️                                           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ Monitors every 30s
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AGENT 1: POSITION MONITOR (Port 8000)                              │
│  ═══════════════════════════════════════════════════════════       │
│                                                                     │
│  1. Fetch collateral price (ETH = $3,850)                          │
│  2. Calculate health factor: HF = (collateral × LTV) / debt        │
│  3. MeTTa AI risk assessment                                        │
│  4. If HF < 1.5 → Generate PositionAlert                           │
│                                                                     │
│  ┌──────────────────────────────────────────┐                      │
│  │ DEMO MODE          │ NORMAL MODE         │                      │
│  ├────────────────────┼─────────────────────┤                      │
│  │ Mock price: $3,850 │ Chainlink Oracle   │                      │
│  │ Demo position data │ Real blockchain     │                      │
│  │ Local testing      │ Mainnet monitoring  │                      │
│  └──────────────────────────────────────────┘                      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ PositionAlert Message
                           │ {user, protocol, HF, collateral, debt}
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AGENT 2: YIELD OPTIMIZER (Port 8001)                               │
│  ═══════════════════════════════════════════════════════════       │
│                                                                     │
│  1. Receive PositionAlert                                           │
│  2. Fetch current APY (Aave: 5.2%)                                 │
│  3. Scan alternative protocols                                      │
│  4. Find best yield (Lido: 7.5%)                                   │
│  5. Calculate profitability                                         │
│  6. MeTTa AI strategy scoring                                       │
│  7. Generate RebalanceStrategy                                      │
│                                                                     │
│  ┌──────────────────────────────────────────┐                      │
│  │ DEMO MODE          │ NORMAL MODE         │                      │
│  ├────────────────────┼─────────────────────┤                      │
│  │ Mock APY data      │ Real protocol APIs  │                      │
│  │ Lido: 7.5%         │ Defillama/Subgraph  │                      │
│  │ Aave: 5.2%         │ Live rates          │                      │
│  │ Instant calc       │ On-chain queries    │                      │
│  └──────────────────────────────────────────┘                      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ RebalanceStrategy Message
                           │ {from: aave, to: lido, amount, APY_improvement}
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AGENT 3: SWAP OPTIMIZER (Port 8002)                                │
│  ═══════════════════════════════════════════════════════════       │
│                                                                     │
│  1. Receive RebalanceStrategy                                       │
│  2. Parse protocols (aave → lido)                                  │
│  3. Check if same-chain or cross-chain                             │
│  4. Query 1inch Fusion+ API for best route                         │
│  5. MeTTa AI route scoring                                          │
│  6. Generate SwapRoute with transaction data                        │
│                                                                     │
│  ┌──────────────────────────────────────────┐                      │
│  │ DEMO MODE          │ NORMAL MODE         │                      │
│  ├────────────────────┼─────────────────────┤                      │
│  │ Mock Fusion+ route │ Real 1inch API call │                      │
│  │ Simulated pricing  │ Live quotes         │                      │
│  │ Demo tx data       │ Actual calldata     │                      │
│  │ Instant response   │ API latency (~1s)   │                      │
│  │ ✅ Gasless: YES    │ ✅ Gasless: YES     │                      │
│  │ ✅ MEV Protect: YES│ ✅ MEV Protect: YES │                      │
│  └──────────────────────────────────────────┘                      │
│                                                                     │
│  Route Steps:                                                       │
│  1. Withdraw 2 ETH from Aave                                       │
│  2. Swap via 1inch Fusion+ (gasless!)                              │
│  3. Deposit to Lido (get stETH)                                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ SwapRoute Message
                           │ {route_id, from_token, to_token, tx_data}
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AGENT 4: CROSS-CHAIN EXECUTOR (Port 8003)                          │
│  ═══════════════════════════════════════════════════════════       │
│                                                                     │
│  1. Receive SwapRoute                                               │
│  2. Parse transaction data                                          │
│  3. Execute multi-step transaction                                  │
│     - Step 1: Withdraw from source                                 │
│     - Step 2: Execute Fusion+ swap                                 │
│     - Step 3: Deposit to target                                    │
│  4. Generate ExecutionResult                                        │
│                                                                     │
│  ┌──────────────────────────────────────────┐                      │
│  │ DEMO MODE          │ NORMAL MODE         │                      │
│  ├────────────────────┼─────────────────────┤                      │
│  │ ✅ SIMULATE only   │ ⚠️  REAL EXECUTION  │                      │
│  │ Log steps          │ Sign transactions    │                      │
│  │ No blockchain      │ Broadcast to network │                      │
│  │ Instant (~2s)      │ Block confirmations  │                      │
│  │ No gas cost        │ Real gas (or $0!)   │                      │
│  │ No risk            │ Real funds moved     │                      │
│  └──────────────────────────────────────────┘                      │
│                                                                     │
│  Execution Flow:                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Withdraw     │→ │ Fusion+ Swap │→ │ Deposit      │             │
│  │ from Aave    │  │ (Gasless!)   │  │ to Lido      │             │
│  │ 2 ETH        │  │ ETH → stETH  │  │ Earn 7.5%    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ ExecutionResult Message
                           │ {execution_id, status: "success"}
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AGENT 1: POSITION MONITOR (Feedback Loop)                          │
│  ═══════════════════════════════════════════════════════════       │
│                                                                     │
│  1. Receive ExecutionResult                                         │
│  2. Log success/failure                                             │
│  3. Update position tracking                                        │
│  4. Continue monitoring                                             │
│                                                                     │
│  ┌──────────────────────────────────────────┐                      │
│  │ DEMO MODE          │ NORMAL MODE         │                      │
│  ├────────────────────┼─────────────────────┤                      │
│  │ Log: "✅ Success!" │ Re-fetch position    │                      │
│  │ Demo state update  │ Verify on-chain     │                      │
│  │ Continue testing   │ Updated HF          │                      │
│  └──────────────────────────────────────────┘                      │
│                                                                     │
│  ✅ Liquidation Risk Reduced!                                       │
│  New APY: 7.5% (up from 5.2%)                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔀 DECISION POINTS - Demo vs Normal

### Decision Point 1: Mode Selection (Startup)

```
                    System Starts
                          │
                          ▼
                ┌──────────────────┐
                │ Check .env file  │
                │ DEMO_MODE=?      │
                └────────┬─────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
   DEMO_MODE=true               DEMO_MODE=false
         │                               │
         ▼                               ▼
┌─────────────────┐           ┌─────────────────┐
│   DEMO PATH     │           │  NORMAL PATH    │
│                 │           │                 │
│ - Mock data     │           │ - Real APIs     │
│ - No blockchain │           │ - Mainnet       │
│ - Safe testing  │           │ - Real funds    │
│ - Instant       │           │ - Actual gas    │
└─────────────────┘           └─────────────────┘
```

---

## 📍 DETAILED SPLIT POINTS

### Split 1: Position Monitor - Price Fetching

```
Position Monitor checks position
           │
           ▼
    Get ETH price
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
DEMO MODE     NORMAL MODE
    │             │
    ▼             ▼
Mock Price    Chainlink Oracle
$3,850.63     API call to oracle
(hardcoded)   (live mainnet data)
    │             │
    └──────┬──────┘
           │
           ▼
Calculate Health Factor
```

### Split 2: Yield Optimizer - APY Data

```
Yield Optimizer needs APY data
           │
           ▼
    Fetch protocol APYs
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
DEMO MODE     NORMAL MODE
    │             │
    ▼             ▼
Mock APYs     Real APIs
Lido: 7.5%    Defillama API
Aave: 5.2%    Subgraph queries
(hardcoded)   (live rates)
    │             │
    └──────┬──────┘
           │
           ▼
Calculate best strategy
```

### Split 3: Swap Optimizer - 1inch Fusion+

```
Swap Optimizer generates route
           │
           ▼
Query 1inch Fusion+ API
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
DEMO MODE     NORMAL MODE
    │             │
    ▼             ▼
Mock Route    Real API Call
Demo tx data  GET /quoter/v2.0/1/quote
Instant       Actual pricing
No API call   API key used
    │             │
    │             ▼
    │      Check 1inch Portal
    │      (see real requests)
    │             │
    └──────┬──────┘
           │
           ▼
Generate SwapRoute message
```

### Split 4: Executor - Transaction Execution

```
Executor receives SwapRoute
           │
           ▼
Execute multi-step transaction
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
DEMO MODE     NORMAL MODE
    │             │
    ▼             ▼
SIMULATE      REAL EXECUTION
    │             │
    ▼             ▼
Log steps     Sign with wallet
2 seconds     Broadcast to network
No gas        Real gas (or $0 Fusion+)
No risk       Real funds moved
    │             │
    ▼             ▼
Success log   Wait for confirmations
    │             │
    └──────┬──────┘
           │
           ▼
Send ExecutionResult
```

---

## 🎯 COMPARISON TABLE

| Feature | DEMO MODE | NORMAL MODE |
|---------|-----------|-------------|
| **Price Data** | Mock ($3,850) | Chainlink Oracle (live) |
| **APY Data** | Hardcoded (Lido 7.5%) | Defillama API (real-time) |
| **1inch API** | Mock response | Real API calls |
| **Execution** | Simulated (logs only) | Real transactions |
| **Gas Costs** | $0 (no txs) | Real gas (or $0 with Fusion+) |
| **Risk** | None (safe testing) | Real funds at risk |
| **Speed** | Instant (~2s) | Block confirmations (~1-3 min) |
| **Blockchain** | None | Ethereum Mainnet |
| **Wallet** | Not needed | Required (private key) |
| **1inch Portal** | No requests shown | Shows API requests |
| **Testing** | ✅ Perfect for dev | ⚠️ Use small amounts |

---

## 🔄 WORKFLOW COMPARISON

### DEMO MODE Flow (Current)
```
1. Position Monitor
   └─→ Mock ETH price: $3,850
   └─→ Demo position: 2 ETH, 5000 USDC
   └─→ Calculate HF: 1.31 ✓
   
2. Yield Optimizer
   └─→ Mock APYs loaded
   └─→ Find best: Lido 7.5% ✓
   └─→ Calculate profit: $177/year ✓
   
3. Swap Optimizer
   └─→ Generate mock Fusion+ route ✓
   └─→ No API call made
   └─→ Demo tx data created ✓
   
4. Executor
   └─→ SIMULATE execution ✓
   └─→ Log: Withdraw → Swap → Deposit
   └─→ No blockchain interaction
   └─→ 2 seconds total ✓
   
5. Feedback
   └─→ Log: "✅ Success!" ✓
   └─→ Continue monitoring ✓

Total Time: ~2 seconds
Cost: $0
Risk: None
```

### NORMAL MODE Flow (Production)
```
1. Position Monitor
   └─→ Call Chainlink Oracle
   └─→ Real blockchain position data
   └─→ Calculate HF: (live) ✓
   
2. Yield Optimizer
   └─→ Query Defillama API
   └─→ Query protocol subgraphs
   └─→ Real-time APY data ✓
   
3. Swap Optimizer
   └─→ Call 1inch Fusion+ API ✓
   └─→ Real pricing quotes
   └─→ Check 1inch Portal (requests visible)
   
4. Executor
   └─→ REAL EXECUTION ⚠️
   └─→ Sign transaction with wallet
   └─→ Broadcast to Ethereum
   └─→ Wait for confirmations
   └─→ 1-3 minutes total
   
5. Feedback
   └─→ Query blockchain for new state
   └─→ Verify execution on Etherscan
   └─→ Updated position ✓

Total Time: 1-3 minutes
Cost: Gas fees (or $0 with Fusion+ for swap)
Risk: Real funds moved
```

---

## 🚦 SWITCHING BETWEEN MODES

### Enable Demo Mode (Safe Testing)
```bash
# In .env file
DEMO_MODE=true

# What happens:
✅ Mock data used
✅ No API calls to 1inch
✅ No blockchain transactions
✅ Instant execution
✅ Safe for development
```

### Enable Normal Mode (Production)
```bash
# In .env file
DEMO_MODE=false

# What happens:
⚠️  Real API calls to 1inch
⚠️  Real blockchain queries
⚠️  Actual transactions (if wallet connected)
⚠️  Gas costs (or $0 with Fusion+)
⚠️  Real funds at risk

# You'll see in 1inch Developer Portal:
📊 API requests appearing
📊 Quote responses
📊 Rate limiting stats
```

---

## 🎬 VISUAL TIMELINE

### Demo Mode Timeline
```
0s    ┃ Position Monitor detects HF 1.31
      ┃
0.1s  ┃ Alert sent to Yield Optimizer
      ┃
0.2s  ┃ Strategy calculated (Lido 7.5%)
      ┃
0.3s  ┃ Strategy sent to Swap Optimizer
      ┃
0.4s  ┃ Mock Fusion+ route generated
      ┃
0.5s  ┃ Route sent to Executor
      ┃
0.6s  ┃ ► Step 1: Simulate withdraw (0.5s)
1.1s  ┃ ► Step 2: Simulate swap (1.0s)
2.1s  ┃ ► Step 3: Simulate deposit (0.5s)
      ┃
2.6s  ┃ ExecutionResult sent to Monitor
      ┃
2.7s  ┃ ✅ Complete! Position updated
```

### Normal Mode Timeline
```
0s    ┃ Position Monitor queries Chainlink (~2s)
      ┃
2s    ┃ Real position data retrieved
      ┃ Alert sent to Yield Optimizer
      ┃
3s    ┃ Query Defillama API (~1s)
      ┃ Query protocol subgraphs (~2s)
      ┃
6s    ┃ Strategy calculated
      ┃ Strategy sent to Swap Optimizer
      ┃
7s    ┃ Call 1inch Fusion+ API (~1s)
      ┃ (Request appears in 1inch Portal)
      ┃
8s    ┃ Real quote received
      ┃ Route sent to Executor
      ┃
9s    ┃ ► Step 1: Sign & broadcast withdraw
      ┃ ► Wait for confirmation (~15s)
      ┃
24s   ┃ ► Step 2: Execute Fusion+ swap
      ┃ ► Gasless! Resolvers handle it (~30s)
      ┃
54s   ┃ ► Step 3: Sign & broadcast deposit
      ┃ ► Wait for confirmation (~15s)
      ┃
69s   ┃ ExecutionResult sent to Monitor
      ┃
70s   ┃ Query blockchain for new state (~2s)
      ┃
72s   ┃ ✅ Complete! Verify on Etherscan
```

---

## 📋 SUMMARY

**Key Differences:**

1. **Data Sources**
   - Demo: Hardcoded mock data
   - Normal: Live APIs and oracles

2. **API Calls**
   - Demo: No external calls
   - Normal: Real 1inch Fusion+ API (visible in portal)

3. **Execution**
   - Demo: Simulation only (logs)
   - Normal: Real blockchain transactions

4. **Speed**
   - Demo: ~2 seconds
   - Normal: ~1-3 minutes

5. **Cost**
   - Demo: $0
   - Normal: Gas fees (or $0 for swap with Fusion+)

6. **Risk**
   - Demo: None
   - Normal: Real funds

**When to Use:**

- **Demo Mode**: Development, testing, demonstrations, learning
- **Normal Mode**: Production, real liquidation protection, actual yield optimization

**Current Status:**
- ✅ Demo mode: Fully tested, 100% working
- ⏭️ Normal mode: Ready to enable (set DEMO_MODE=false)
