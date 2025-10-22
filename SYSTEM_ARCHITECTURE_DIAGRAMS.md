# 🎨 LiquidityGuard AI - System Architecture Diagrams

---

## 📊 Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LIQUIDITYGUARD AI SYSTEM                             │
│                     AI-Powered Liquidation Protection                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   EXTERNAL SERVICES  │
└──────────────────────┘
         │
         ├─── 🔗 Chainlink Oracles (Price Feeds)
         ├─── 📊 CoinGecko API (Backup Prices)
         ├─── 🔥 1inch Fusion+ API (Gasless Swaps)
         ├─── 📈 DeFi Llama (Protocol APYs)
         ├─── 🌉 LayerZero Bridge (Cross-Chain)
         ├─── 🌐 The Graph (Position Data)
         └─── 🤖 MeTTa AI (Symbolic Reasoning)
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FETCH.AI ALMANAC                                 │
│                       (Decentralized Agent Registry)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                   │
                   │ Agents Register & Discover
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ Agent 1 │  │ Agent 2 │  │ Agent 3 │  │ Agent 4 │
│ Monitor │  │ Optimizer│  │  Swap   │  │ Executor│
│ Port:   │  │ Port:   │  │ Port:   │  │ Port:   │
│ 8000    │  │ 8001    │  │ 8002    │  │ 8003    │
└─────────┘  └─────────┘  └─────────┘  └─────────┘
```

---

## 🔄 Complete Message Flow (End-to-End)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STEP-BY-STEP EXECUTION                               │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: POSITION MONITORING
════════════════════════════════════════════════════════════════════════════════
┌──────────────────────────────────────────────────────────────────────────┐
│  🏠 POSITION MONITOR AGENT (Port 8000)                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Every 30 seconds:                                                       │
│  1. Fetch prices from Chainlink/CoinGecko                               │
│     ├─ ETH: $3,200                                                       │
│     ├─ USDC: $1.00                                                       │
│     └─ WBTC: $45,000                                                     │
│                                                                          │
│  2. Monitor Demo Position:                                               │
│     ├─ User: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0               │
│     ├─ Protocol: Aave (Ethereum)                                         │
│     ├─ Collateral: 2.0 ETH = $6,400                                     │
│     └─ Debt: $5,000 USDC                                                │
│                                                                          │
│  3. Calculate Health Factor:                                             │
│     HF = (Collateral × Liquidation Threshold) / Debt                     │
│     HF = ($6,400 × 0.85) / $5,000                                        │
│     HF = $5,440 / $5,000                                                 │
│     HF = 1.09 ⚠️ CRITICAL!                                               │
│                                                                          │
│  4. MeTTa AI Risk Assessment:                                            │
│     ├─ Risk Level: CRITICAL                                              │
│     ├─ Liquidation Probability: 85%                                      │
│     ├─ Urgency Score: 8/10                                               │
│     └─ Priority: EMERGENCY                                               │
│                                                                          │
│  5. ⚠️ SEND ALERT ⚠️                                                     │
│     └─ To: Yield Optimizer (agent1q0rtan6y...)                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ [PositionAlert]
                                    │ {
                                    │   user_address: "0x742d35...",
                                    │   health_factor: 1.09,
                                    │   collateral_value: 6400,
                                    │   debt_value: 5000,
                                    │   risk_level: "critical"
                                    │ }
                                    ▼

STEP 2: YIELD OPTIMIZATION
════════════════════════════════════════════════════════════════════════════════
┌──────────────────────────────────────────────────────────────────────────┐
│  💰 YIELD OPTIMIZER AGENT (Port 8001)                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. ⚠️ ALERT RECEIVED                                                    │
│     ├─ User: 0x742d35...                                                 │
│     ├─ Health Factor: 1.09 (CRITICAL!)                                   │
│     └─ Current Protocol: Aave (Ethereum)                                 │
│                                                                          │
│  2. Query DeFi Llama for Current APY:                                    │
│     └─ Aave ETH: 5.20%                                                   │
│                                                                          │
│  3. Find Best Alternative Yields:                                        │
│     ┌─────────────────────────────────────────────┐                     │
│     │ Protocol      Chain      Asset   APY        │                     │
│     ├─────────────────────────────────────────────┤                     │
│     │ Aave         Ethereum    ETH     5.20% ⬅ NOW│                     │
│     │ Compound     Ethereum    ETH     6.80%      │                     │
│     │ Lido         Ethereum    ETH     7.50% ⬅ ✅ │                     │
│     │ Kamino       Solana      SOL     9.10%      │ (cross-chain)      │
│     │ Drift        Solana      USDC    8.30%      │ (cross-chain)      │
│     └─────────────────────────────────────────────┘                     │
│                                                                          │
│  4. Calculate Profitability (Lido):                                      │
│     ├─ APY Improvement: 7.50% - 5.20% = +2.30%                          │
│     ├─ Annual Extra: $6,400 × 2.30% = $147.20/year                      │
│     ├─ Rebalancing Cost: ~$50 (gas + fees)                              │
│     └─ Break-even: ($50 × 12) / $147.20 = 4.1 months ✅                 │
│                                                                          │
│  5. MeTTa AI Strategy Scoring:                                           │
│     ├─ APY Score: 18.4/30 (based on improvement)                        │
│     ├─ Break-even Score: 10/20 (4.1 months)                             │
│     ├─ Urgency Score: 12/15 (HF 1.09 critical)                          │
│     ├─ Amount Score: 2/35 ($6,400 position)                             │
│     └─ Total Score: 42.4/100 (PROFITABLE!)                              │
│                                                                          │
│  6. Build Rebalancing Strategy:                                          │
│     ├─ Step 1: Withdraw from Aave                                        │
│     ├─ Step 2: Swap via 1inch Fusion+ (GASLESS!)                        │
│     └─ Step 3: Deposit to Lido                                           │
│                                                                          │
│  7. ✅ SEND STRATEGY ✅                                                  │
│     └─ To: Swap Optimizer (agent1q2d8jkuh...)                           │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ [RebalanceStrategy]
                                    │ {
                                    │   strategy_id: "a39de7f4...",
                                    │   source_protocol: "aave",
                                    │   target_protocol: "lido",
                                    │   amount: 6400,
                                    │   apy_improvement: 2.30,
                                    │   execution_method: "direct_swap",
                                    │   priority: "emergency"
                                    │ }
                                    ▼

STEP 3: FUSION+ SWAP ROUTE GENERATION
════════════════════════════════════════════════════════════════════════════════
┌──────────────────────────────────────────────────────────────────────────┐
│  🔥 SWAP OPTIMIZER AGENT (Port 8002)                                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. ⚠️ STRATEGY RECEIVED                                                 │
│     ├─ From: Aave (Ethereum)                                             │
│     ├─ To: Lido (Ethereum)                                               │
│     ├─ Amount: $6,400 (2 ETH)                                            │
│     └─ Priority: EMERGENCY                                               │
│                                                                          │
│  2. Detect Execution Path:                                               │
│     ├─ Same Chain? YES (Ethereum → Ethereum)                            │
│     ├─ Method: Direct Swap (no bridge needed)                           │
│     └─ Use 1inch Fusion+ for gasless swap                               │
│                                                                          │
│  3. Query 1inch Fusion+ API:                                             │
│     POST https://api.1inch.dev/fusion/quoter/v2.0/1/quote/receive       │
│     {                                                                    │
│       "srcTokenAddress": "0xEeeee...EEeE",  // ETH                      │
│       "dstTokenAddress": "0xae7ab...",      // stETH (Lido)             │
│       "amount": "2000000000000000000",       // 2 ETH                   │
│       "walletAddress": "0x742d35...",                                    │
│       "enableEstimate": true                                             │
│     }                                                                    │
│                                                                          │
│  4. Fusion+ Quote Response:                                              │
│     ├─ Destination Amount: 1.996 stETH (0.2% slippage)                  │
│     ├─ Recommended Preset: "fast"                                        │
│     ├─ Auction Duration: 30 seconds                                      │
│     ├─ Gas Paid By: RESOLVERS (User pays $0!)                           │
│     └─ MEV Protection: ACTIVE (Dutch auction)                            │
│                                                                          │
│  5. Generate SwapRoute:                                                  │
│     ├─ Route ID: ef13047b-5985-4fc1-8dcf-966e528275e5                   │
│     ├─ Type: fusion_plus                                                 │
│     ├─ Gasless: YES ✅                                                   │
│     ├─ MEV Protected: YES ✅                                             │
│     └─ Better Pricing: YES ✅ (competitive resolvers)                    │
│                                                                          │
│  6. MeTTa Route Scoring:                                                 │
│     └─ Route Score: 46.0/100 (good route!)                              │
│                                                                          │
│  7. ✅ SEND ROUTE ✅                                                     │
│     └─ To: Cross-Chain Executor (agent1qtk56cc7...)                     │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ [SwapRoute]
                                    │ {
                                    │   route_id: "ef13047b...",
                                    │   from_token: "aave",
                                    │   to_token: "lido",
                                    │   amount: 6400,
                                    │   transaction_data: {
                                    │     type: "fusion_plus",
                                    │     gasless: true,
                                    │     mev_protected: true,
                                    │     steps: [...]
                                    │   }
                                    │ }
                                    ▼

STEP 4: MULTI-STEP EXECUTION
════════════════════════════════════════════════════════════════════════════════
┌──────────────────────────────────────────────────────────────────────────┐
│  ⚡ CROSS-CHAIN EXECUTOR AGENT (Port 8003)                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. ⚠️ SWAP ROUTE RECEIVED                                               │
│     ├─ Route ID: ef13047b...                                             │
│     ├─ Type: fusion_plus                                                 │
│     └─ Steps: 3 (Withdraw → Swap → Deposit)                             │
│                                                                          │
│  2. Execute Step 1/3: WITHDRAW                                           │
│     ┌────────────────────────────────────────────┐                      │
│     │ Action: Withdraw from Aave                 │                      │
│     │ Protocol: Aave V3 (Ethereum)               │                      │
│     │ Amount: 2.0 ETH ($6,400)                   │                      │
│     │ Status: ✅ SIMULATED SUCCESS               │                      │
│     │ Duration: ~500ms                           │                      │
│     └────────────────────────────────────────────┘                      │
│                                                                          │
│  3. Execute Step 2/3: FUSION+ SWAP                                       │
│     ┌────────────────────────────────────────────┐                      │
│     │ Action: Execute 1inch Fusion+ Swap         │                      │
│     │ Protocol: 1inch_fusion_plus                │                      │
│     │ From: 2.0 ETH                              │                      │
│     │ To: 1.996 stETH (Lido)                     │                      │
│     │ Gasless: YES ⛽ (Resolvers pay!)           │                      │
│     │ MEV Protected: YES 🛡️ (Dutch auction)     │                      │
│     │ Status: ✅ SIMULATED SUCCESS               │                      │
│     │ Duration: ~1000ms (auction + execution)    │                      │
│     └────────────────────────────────────────────┘                      │
│                                                                          │
│  4. Execute Step 3/3: DEPOSIT                                            │
│     ┌────────────────────────────────────────────┐                      │
│     │ Action: Deposit to Lido                    │                      │
│     │ Protocol: Lido (Ethereum)                  │                      │
│     │ Amount: 1.996 stETH (~$6,387)              │                      │
│     │ New APY: 7.50% (+2.30% improvement!)       │                      │
│     │ Status: ✅ SIMULATED SUCCESS               │                      │
│     │ Duration: ~500ms                           │                      │
│     └────────────────────────────────────────────┘                      │
│                                                                          │
│  5. Calculate Results:                                                   │
│     ├─ Total Execution Time: ~2.0 seconds                               │
│     ├─ Gas Cost: $0 (GASLESS!)                                           │
│     ├─ Protocol Fee: ~$12.80 (0.2%)                                     │
│     ├─ New Health Factor: 1.08 → 1.28 (SAFER!)                          │
│     └─ Annual Extra Yield: $147.20                                       │
│                                                                          │
│  6. ✅ SEND RESULT ✅                                                    │
│     └─ To: Position Monitor (agent1qvvp0sl4x...)                        │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ [ExecutionResult]
                                    │ {
                                    │   execution_id: "ef13047b...",
                                    │   status: "success"
                                    │ }
                                    ▼

STEP 5: FEEDBACK CONFIRMATION
════════════════════════════════════════════════════════════════════════════════
┌──────────────────────────────────────────────────────────────────────────┐
│  🏠 POSITION MONITOR AGENT (Feedback Loop)                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. ✅ EXECUTION RESULT RECEIVED                                         │
│     ├─ Execution ID: ef13047b...                                         │
│     ├─ Status: SUCCESS                                                   │
│     └─ From: Executor (agent1qtk56cc7...)                               │
│                                                                          │
│  2. Update Position Status:                                              │
│     ┌─────────────────────────────────────────────────────────┐         │
│     │ BEFORE:                    AFTER:                       │         │
│     │ ├─ Protocol: Aave          ├─ Protocol: Lido            │         │
│     │ ├─ APY: 5.20%              ├─ APY: 7.50% (+2.30%!)     │         │
│     │ ├─ HF: 1.09 (CRITICAL)     ├─ HF: 1.28 (SAFER!)        │         │
│     │ ├─ Risk: EMERGENCY         ├─ Risk: MODERATE            │         │
│     │ └─ Urgency: 8/10           └─ Urgency: 5/10             │         │
│     └─────────────────────────────────────────────────────────┘         │
│                                                                          │
│  3. Log Success:                                                         │
│     ✅ Rebalancing execution successful!                                │
│     ✅ Position moved to Lido (7.50% APY)                               │
│     ✅ Health factor improved: 1.09 → 1.28                              │
│     🎉 Liquidation risk reduced!                                         │
│                                                                          │
│  4. Continue Monitoring:                                                 │
│     └─ Next check in 30 seconds...                                      │
└──────────────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════════════════
                            🎉 FLOW COMPLETE! 🎉
════════════════════════════════════════════════════════════════════════════════

Total Time: ~2 seconds
Messages Sent: 4 (Alert → Strategy → Route → Result)
Gas Cost: $0 (GASLESS!)
Position Status: SAVED! ✅
Annual Extra Yield: $147.20 (+2.30% APY)
```

---

## 🔀 Alternative Flows

### **Cross-Chain Rebalancing (Ethereum → Solana)**

```
If Best Yield = Kamino (Solana) 9.1%:

1. Withdraw from Aave (Ethereum)
         ↓
2. Swap ETH → PYUSD (1inch Fusion+)
         ↓
3. Bridge PYUSD via LayerZero (Ethereum → Solana)
         ↓
4. Swap PYUSD → SOL (Jupiter on Solana)
         ↓
5. Deposit SOL to Kamino (Solana)

Estimated Time: ~10 minutes (vs 2 seconds for same-chain)
Bridge Fee: ~$15 (vs $0 for same-chain)
```

---

## 🎯 Agent Communication Patterns

### **Bureau Mode (Local Testing)**

```
┌─────────────────────────────────────────────────────┐
│                    BUREAU                           │
│            (Single Process Container)               │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Position Monitor ─┐                         │  │
│  │                    │                         │  │
│  │  Yield Optimizer  ─┼─> Direct Communication │  │
│  │                    │   (In-Memory Messages)  │  │
│  │  Swap Optimizer   ─┤                         │  │
│  │                    │                         │  │
│  │  Executor         ─┘                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Pros:                                              │
│  ✅ Fast (<1ms latency)                             │
│  ✅ No network required                             │
│  ✅ Easy debugging                                  │
│                                                     │
│  Cons:                                              │
│  ❌ Single machine only                             │
│  ❌ Not globally discoverable                       │
└─────────────────────────────────────────────────────┘
```

### **Almanac Mode (Production)**

```
                    ┌─────────────────────┐
                    │   FETCH.AI ALMANAC  │
                    │  (Global Registry)  │
                    └──────────┬──────────┘
                               │
                               │ Agents Register & Discover
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
    │ Agent 1 │          │ Agent 2 │          │ Agent 3 │
    │ Server 1│◄────────►│ Server 2│◄────────►│ Server 3│
    │ (Tokyo) │          │ (London)│          │ (NYC)   │
    └─────────┘          └─────────┘          └─────────┘
         │                     │                     │
         └─────────────────────┴─────────────────────┘
                               │
                      Messages routed globally
                      via Almanac smart contract

Pros:
✅ Globally distributed
✅ Fault-tolerant (agents can restart)
✅ Scalable (add more agents easily)
✅ Production-ready

Cons:
❌ Slower (~1-2 sec latency)
❌ Requires FET tokens for registration
❌ Network dependent
```

---

## 🧠 MeTTa AI Decision Tree

```
┌─────────────────────────────────────────────────────────┐
│          METTA AI RISK ASSESSMENT LOGIC                 │
└─────────────────────────────────────────────────────────┘

Input: Health Factor (HF)
       ↓
   ┌───────────────┐
   │ HF < 1.0?     │
   └───┬───────┬───┘
       │Yes    │No
       ▼       │
   LIQUIDATED! │
       ▲       │
       │       ▼
       │   ┌───────────────┐
       │   │ HF < 1.3?     │
       │   └───┬───────┬───┘
       │       │Yes    │No
       │       ▼       │
       │   CRITICAL    │
       │   Urgency: 8  │
       │       ▲       │
       │       │       ▼
       │       │   ┌───────────────┐
       │       │   │ HF < 1.5?     │
       │       │   └───┬───────┬───┘
       │       │       │Yes    │No
       │       │       ▼       │
       │       │    HIGH       │
       │       │   Urgency: 6  │
       │       │       ▲       │
       │       │       │       ▼
       │       │       │   ┌───────────────┐
       │       │       │   │ HF < 1.8?     │
       │       │       │   └───┬───────┬───┘
       │       │       │       │Yes    │No
       │       │       │       ▼       │
       │       │       │   MODERATE    │
       │       │       │   Urgency: 4  │
       │       │       │       ▲       │
       │       │       │       │       ▼
       │       │       │       │    SAFE
       │       │       │       │   Urgency: 2
       │       │       │       │
       └───────┴───────┴───────┴────────┘
                       │
                       ▼
              ┌────────────────┐
              │ Assess Market  │
              │ Volatility     │
              └────────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │ Calculate      │
              │ Liquidation    │
              │ Probability    │
              └────────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │ Generate       │
              │ Recommended    │
              │ Actions        │
              └────────────────┘
```

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA SOURCES                                  │
└─────────────────────────────────────────────────────────────────────┘
         │
         ├─── PRICES (every 60s)
         │    ├─ Chainlink Oracles (on-chain, Ethereum)
         │    ├─ CoinGecko API (off-chain, all chains)
         │    └─ Mock Prices (demo mode)
         │
         ├─── PROTOCOL APYs (every 5 minutes)
         │    ├─ DeFi Llama API (aggregated)
         │    ├─ Protocol-specific APIs
         │    └─ Mock APYs (demo mode)
         │
         ├─── POSITION DATA (real-time)
         │    ├─ The Graph Subgraph (Aave V3)
         │    ├─ Direct RPC calls (Ethereum)
         │    └─ Mock Positions (demo mode)
         │
         └─── SWAP QUOTES (on-demand)
              ├─ 1inch Fusion+ API (gasless swaps)
              ├─ LayerZero Bridge API (cross-chain)
              └─ Mock Routes (demo mode)
                     │
                     ▼
         ┌───────────────────────┐
         │   CACHING LAYER       │
         │   (60s TTL)           │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  AGENTS CONSUME DATA  │
         └───────────────────────┘
```

---

**Generated**: October 22, 2025  
**Status**: ✅ Complete System Architecture Documented

🎯 **Use these diagrams to understand the complete system flow!**
