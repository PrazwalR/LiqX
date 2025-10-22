# 🌐 Almanac Deployment Guide - Complete Instructions

**Date**: October 22, 2025  
**Status**: Ready for Deployment  
**Network**: Fetch.ai Testnet (Dorado)

---

## 📋 Prerequisites Checklist

Before deploying to Almanac, ensure you have:

- [x] All 4 agents tested and working in Bureau mode
- [x] Agent seeds configured in `.env` file
- [ ] FET testnet tokens for each agent (minimum 0.5 FET each)
- [ ] 4 separate terminal windows ready
- [ ] Stable internet connection
- [ ] Access to https://faucet.fetch.ai

---

## 🏦 Step 1: Get Your Agent Addresses

Your agents have **deterministic addresses** based on their seeds in `.env`:

### Agent Addresses (Agent Protocol Format)

```
1. Position Monitor
   Agent Address: agent1qvvp0sl4xwj04jjheaqwl9na6n4ef8zqrv55qfw96jv2584ze0v6cehs64a
   Fetch Address: fetch1veww6pldq2jhsv9ehlljlwqs6dh7mx7cztvqhc
   Seed: AGENT_SEED_POSITION_MONITOR

2. Yield Optimizer
   Agent Address: agent1q0rtan6yrc6dgv62rlhtj2fn5na0zv4k8mj47ylw8luzyg6c0xxpspk9706
   Fetch Address: fetch1435780af4fs5u0fslvfp6pwnpjxa6la0l6ey5e
   Seed: AGENT_SEED_YIELD_OPTIMIZER

3. Swap Optimizer
   Agent Address: agent1q2d8jkuhml92c38ja5hs237g00y4h7v7s5f0q05c5m5uzu6kqnj0qq2t4xm
   Fetch Address: fetch162jd9smfv0eys0k3pye5qcly7456y6apkghzd2
   Seed: AGENT_SEED_SWAP_OPTIMIZER

4. Cross-Chain Executor
   Agent Address: agent1qtk56cc7z5499vuh43n5c4kzhve5u0khn7awcwsjn9eqfe3u2gsv7fwrrqq
   Fetch Address: fetch1hu4kt7xm0qjnk6ugk553v7ezfeszghe30lpcj6
   Seed: AGENT_SEED_EXECUTOR
```

---

## 💰 Step 2: Fund Your Agents

Each agent needs FET tokens to pay for Almanac registration.

### Get Testnet FET Tokens

1. **Visit Faucet**: https://faucet.fetch.ai
2. **Enter each Fetch Address** (one at a time)
3. **Request tokens** (you'll receive ~1 FET per request)
4. **Wait for confirmation** (~30 seconds)

### Required Amounts

- **Minimum per agent**: 0.5 FET
- **Recommended per agent**: 1.0 FET
- **Total needed**: 4 FET (for all agents)

### Verify Balances

Check balances on Fetch.ai explorer:
- **Explorer**: https://explore-dorado.fetch.ai
- Search for each fetch address
- Confirm balance shows > 0.5 FET

---

## 🚀 Step 3: Deploy Agents to Almanac

### Important: Deploy in Separate Terminals

**Why?** Each agent runs as a separate process and needs its own terminal to stay active.

### Deployment Commands

Open **4 terminal windows** and run these commands:

#### Terminal 1: Position Monitor

```bash
cd /Users/prazw/Desktop/LiqX
source venv/bin/activate
python deploy_individual_agents.py --agent position_monitor
```

**Expected Output**:
```
🚀 Deploying Position Monitor to Almanac...
Agent address: agent1qvvp0sl4x...
Agent name: position_monitor
INFO: [position_monitor]: Registering on Almanac...
SUCCESS: [position_monitor]: Registered successfully!
INFO: [position_monitor]: Starting agent...
```

---

#### Terminal 2: Yield Optimizer

```bash
cd /Users/prazw/Desktop/LiqX
source venv/bin/activate
python deploy_individual_agents.py --agent yield_optimizer
```

**Expected Output**:
```
🚀 Deploying Yield Optimizer to Almanac...
Agent address: agent1q0rtan6y...
Agent name: yield_optimizer
INFO: [yield_optimizer]: Registering on Almanac...
SUCCESS: [yield_optimizer]: Registered successfully!
INFO: [yield_optimizer]: Starting agent...
```

---

#### Terminal 3: Swap Optimizer

```bash
cd /Users/prazw/Desktop/LiqX
source venv/bin/activate
python deploy_individual_agents.py --agent swap_optimizer
```

**Expected Output**:
```
🚀 Deploying Swap Optimizer to Almanac...
Agent address: agent1q2d8jkuh...
Agent name: swap_optimizer
INFO: [swap_optimizer]: Registering on Almanac...
SUCCESS: [swap_optimizer]: Registered successfully!
INFO: [swap_optimizer]: Starting agent...
```

---

#### Terminal 4: Cross-Chain Executor

```bash
cd /Users/prazw/Desktop/LiqX
source venv/bin/activate
python deploy_individual_agents.py --agent cross_chain_executor
```

**Expected Output**:
```
🚀 Deploying Cross-Chain Executor to Almanac...
Agent address: agent1qtk56cc7...
Agent name: cross_chain_executor
INFO: [cross_chain_executor]: Registering on Almanac...
SUCCESS: [cross_chain_executor]: Registered successfully!
INFO: [cross_chain_executor]: Starting agent...
```

---

## ✅ Step 4: Verify Deployment

### Check Almanac Registration

1. **Visit Agentverse**: https://agentverse.ai
2. **Search for your agents** by address
3. **Verify all 4 agents appear** in search results
4. **Check status**: Should show "Online" or "Active"

### Check Agent Communication

In each terminal, you should see:

**Terminal 1 (Monitor)**:
```
INFO: [position_monitor]: Monitoring 1 positions...
WARNING: [position_monitor]: ⚠️ ALERT SENT: Position 0x742d35Cc... | HF: 1.09
```

**Terminal 2 (Optimizer)**:
```
WARNING: [yield_optimizer]: ⚠️ POSITION ALERT RECEIVED
INFO: [yield_optimizer]: Found Lido 7.50% (+2.30% improvement)
SUCCESS: [yield_optimizer]: ✅ Strategy sent successfully
```

**Terminal 3 (Swap)**:
```
WARNING: [swap_optimizer]: ⚠️ REBALANCE STRATEGY RECEIVED
INFO: [swap_optimizer]: Generating Fusion+ route...
SUCCESS: [swap_optimizer]: ✅ Swap route generated
```

**Terminal 4 (Executor)**:
```
WARNING: [cross_chain_executor]: ⚠️ SWAP ROUTE RECEIVED
INFO: [cross_chain_executor]: Starting multi-step execution...
SUCCESS: [cross_chain_executor]: ✅ Execution successful
```

---

## 🔍 Step 5: Monitor & Troubleshoot

### Common Issues

#### Issue: "I do not have enough funds to register"

**Solution**:
```bash
# Check balance
# Visit: https://explore-dorado.fetch.ai
# Search for your fetch address
# If balance < 0.5 FET, request more from faucet
```

#### Issue: "Failed to register on Almanac"

**Solution**:
```bash
# Wait 1 minute and restart the agent
# Press Ctrl+C to stop
# Run deployment command again
```

#### Issue: "Agent is not receiving messages"

**Solution**:
```bash
# Verify all 4 agents are running
# Check each terminal for "Online" status
# Wait 1-2 minutes for discovery
# Check Almanac registration at agentverse.ai
```

#### Issue: "Registration transaction failed"

**Solution**:
```bash
# Increase funding to 1.5 FET per agent
# Try again after 2 minutes
# Check network status: https://status.fetch.ai
```

---

## 📊 Expected Behavior After Deployment

### Timeline

```
T+0:00   All agents start and register on Almanac
T+0:30   Position Monitor begins monitoring (every 30s)
T+0:30   First health check detects risky position
T+0:31   Alert sent to Yield Optimizer via Almanac
T+0:32   Strategy calculated and sent to Swap Optimizer
T+0:33   Fusion+ route generated and sent to Executor
T+0:35   Execution simulated, result sent back to Monitor
T+0:36   Complete cycle finished ✅
```

### Continuous Operation

- Position Monitor checks every **30 seconds**
- Each cycle completes in **~5-6 seconds** (with Almanac)
- Agents communicate **cross-server** via Almanac
- All messages are **guaranteed delivery**

---

## 🎯 Differences: Bureau vs Almanac

| Aspect | Bureau Mode (Local) | Almanac Mode (Deployed) |
|--------|---------------------|-------------------------|
| **Communication** | Direct HTTP (localhost) | Almanac contract (global) |
| **Discovery** | Manual configuration | Automatic via Almanac |
| **Latency** | <1ms | ~1-2 seconds |
| **Reliability** | Single machine | Distributed, fault-tolerant |
| **Scalability** | Limited | Unlimited |
| **Cost** | Free | ~0.001 FET per message |
| **Registration** | Not needed | Required (0.5 FET) |
| **Deployment** | Single process | 4 separate processes |

---

## 🛑 Stopping Agents

To stop all agents:

### Option 1: Stop Individual Terminals

In each terminal window:
```bash
# Press Ctrl+C to stop gracefully
```

### Option 2: Kill All Processes

```bash
# Kill all agent processes
pkill -f "deploy_individual_agents.py"

# Or kill by port
lsof -ti:8000,8001,8002,8003 | xargs kill -9
```

---

## 🔄 Restarting Agents

If you need to restart an agent:

1. **Stop the agent** (Ctrl+C in its terminal)
2. **Wait 30 seconds** for Almanac to update
3. **Restart using the same command**
4. **Agent will re-register automatically**

---

## 📈 Cost Estimation

### Testnet (Current)

```
Registration: 0.5 FET per agent (one-time)
Messages: ~0.001 FET per message
Daily Messages: ~2,880 (every 30s)
Daily Cost: ~2.88 FET per day
Monthly Cost: ~86 FET per month

Total for 4 Agents:
- Setup: 2 FET (one-time)
- Daily: ~11.5 FET
- Monthly: ~344 FET
```

### Mainnet (Future)

FET tokens will need to be purchased. Costs scale linearly with message frequency.

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] All 4 agents registered on Almanac
- [ ] All agents show "Online" status on Agentverse
- [ ] Position Monitor sending alerts every 30s
- [ ] Yield Optimizer receiving and processing alerts
- [ ] Swap Optimizer generating Fusion+ routes
- [ ] Executor simulating transactions
- [ ] Complete message cycle working end-to-end
- [ ] All terminals showing active logs
- [ ] No errors in any terminal

---

## 🚀 Next Steps After Deployment

### Immediate (Today)

1. ✅ Deploy all 4 agents to Almanac
2. ✅ Verify registration and communication
3. ✅ Monitor logs for 1 hour
4. ✅ Test complete flow multiple times

### Short Term (This Week)

1. ⏳ Enable Chainlink price feeds (`USE_CHAINLINK=true`)
2. ⏳ Set `DEMO_MODE=false` for real API calls
3. ⏳ Test with real 1inch Fusion+ API
4. ⏳ Monitor gas costs and performance

### Medium Term (Next 2 Weeks)

1. ⏳ Add wallet integration for real transactions
2. ⏳ Security audit of all agents
3. ⏳ Load testing with multiple positions
4. ⏳ Prepare mainnet deployment plan

---

## 📞 Support & Resources

### Official Resources

- **Fetch.ai Docs**: https://docs.fetch.ai
- **uAgents Framework**: https://github.com/fetchai/uAgents
- **Agentverse**: https://agentverse.ai
- **Testnet Explorer**: https://explore-dorado.fetch.ai
- **Testnet Faucet**: https://faucet.fetch.ai

### Your Project Resources

- **Test Results**: `TEST_RESULTS_OCT_22_2025.md`
- **Chainlink Guide**: `CHAINLINK_INTEGRATION_GUIDE.md`
- **Workflow Docs**: `WORKFLOW_FLOWCHARTS.md`
- **Deployment Checklist**: `DEPLOYMENT_CHECKLIST.md`

---

## 🎊 You're Ready!

Your LiquidityGuard AI system is ready for Almanac deployment!

**Current Status**: ✅ All code complete  
**Current Mode**: Demo (local testing)  
**Next Mode**: Almanac (distributed deployment)  
**Final Mode**: Production (real transactions)

**Let's deploy! 🚀**
