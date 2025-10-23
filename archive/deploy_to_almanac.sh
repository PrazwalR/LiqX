#!/bin/bash

# ══════════════════════════════════════════════════════════════
# LiquidityGuard AI - Almanac Deployment Script
# ══════════════════════════════════════════════════════════════

echo "════════════════════════════════════════════════════════════════"
echo "🚀 LIQUIDITYGUARD AI - ALMANAC DEPLOYMENT"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Activate virtual environment
source venv/bin/activate

# Get agent addresses
echo "📋 Extracting agent addresses..."
echo ""

# Position Monitor
echo "1️⃣  Position Monitor"
MONITOR_ADDRESS=$(python -c "
from agents.position_monitor import PositionMonitorAgent
agent = PositionMonitorAgent()
print(f'Agent: {agent.agent.address}')
print(f'Wallet: {agent.agent.wallet.address()}')
")
echo "$MONITOR_ADDRESS"
echo ""

# Yield Optimizer
echo "2️⃣  Yield Optimizer"
OPTIMIZER_ADDRESS=$(python -c "
from agents.yield_optimizer import YieldOptimizerAgent
agent = YieldOptimizerAgent()
print(f'Agent: {agent.agent.address}')
print(f'Wallet: {agent.agent.wallet.address()}')
")
echo "$OPTIMIZER_ADDRESS"
echo ""

# Swap Optimizer
echo "3️⃣  Swap Optimizer"
SWAP_ADDRESS=$(python -c "
from agents.swap_optimizer import SwapOptimizerAgent
agent = SwapOptimizerAgent()
print(f'Agent: {agent.agent.address}')
print(f'Wallet: {agent.agent.wallet.address()}')
")
echo "$SWAP_ADDRESS"
echo ""

# Executor
echo "4️⃣  Executor"
EXECUTOR_ADDRESS=$(python -c "
from agents.cross_chain_executor import CrossChainExecutor
agent = CrossChainExecutor()
print(f'Agent: {agent.agent.address}')
print(f'Wallet: {agent.agent.wallet.address()}')
")
echo "$EXECUTOR_ADDRESS"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "💰 FUNDING INSTRUCTIONS"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "IMPORTANT: Each agent needs FET tokens to register on Almanac!"
echo ""
echo "📍 Get testnet FET tokens from:"
echo "   https://faucet.fetch.ai/"
echo ""
echo "💡 Fund each Wallet address listed above with ~0.5 FET"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🚦 DEPLOYMENT OPTIONS"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Option 1: Deploy ALL agents in separate terminals"
echo "  Terminal 1: python deploy_position_monitor.py"
echo "  Terminal 2: python deploy_yield_optimizer.py"
echo "  Terminal 3: python deploy_swap_optimizer.py"
echo "  Terminal 4: python deploy_executor.py"
echo ""
echo "Option 2: Deploy individually as needed"
echo "  python deploy_<agent_name>.py"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
read -p "Have you funded all wallets? (y/n): " funded

if [ "$funded" = "y" ] || [ "$funded" = "Y" ]; then
    echo ""
    echo "✅ Great! Choose deployment method:"
    echo ""
    echo "1) Start Position Monitor only"
    echo "2) Start Yield Optimizer only"
    echo "3) Start Swap Optimizer only"
    echo "4) Start Executor only"
    echo "5) Exit (deploy manually)"
    echo ""
    read -p "Enter choice (1-5): " choice
    
    case $choice in
        1)
            echo "Starting Position Monitor..."
            python deploy_position_monitor.py
            ;;
        2)
            echo "Starting Yield Optimizer..."
            python deploy_yield_optimizer.py
            ;;
        3)
            echo "Starting Swap Optimizer..."
            python deploy_swap_optimizer.py
            ;;
        4)
            echo "Starting Executor..."
            python deploy_executor.py
            ;;
        5)
            echo "Exiting. Deploy agents manually in separate terminals."
            ;;
        *)
            echo "Invalid choice. Exiting."
            ;;
    esac
else
    echo ""
    echo "⚠️  Please fund the wallet addresses first!"
    echo "   Visit: https://faucet.fetch.ai/"
    echo ""
    echo "Then run this script again."
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
