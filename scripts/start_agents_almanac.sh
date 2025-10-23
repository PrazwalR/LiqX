#!/bin/bash

# ═══════════════════════════════════════════════════════
# LIQUIDITYGUARD AI - ALMANAC AGENT STARTUP SCRIPT
# ═══════════════════════════════════════════════════════
# This script starts all agents in Almanac mode for Dorado testnet
# with proper environment configuration and SSL certificates

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════"
echo "🚀 Starting LiquidityGuard AI Agents - ALMANAC MODE"
echo "═══════════════════════════════════════════════════════"
echo ""

# Set working directory
cd "$(dirname "$0")/.."

# Load environment variables from .env
if [ -f .env ]; then
    # Use python-dotenv to safely load the .env file
    export $(python -c "
from dotenv import dotenv_values
import os
config = dotenv_values('.env')
for key, value in config.items():
    if value:
        print(f'{key}={value}')
" | xargs)
    echo "✅ Loaded .env file"
else
    echo "❌ Error: .env file not found!"
    exit 1
fi

# Verify critical environment variables
if [ -z "$AGENTVERSE_API_KEY" ]; then
    echo "❌ Error: AGENTVERSE_API_KEY not set in .env"
    exit 1
fi

if [ "$DEPLOY_MODE" != "almanac" ]; then
    echo "⚠️  Warning: DEPLOY_MODE is not set to 'almanac' (current: $DEPLOY_MODE)"
    echo "   Setting DEPLOY_MODE=almanac for this session"
    export DEPLOY_MODE="almanac"
fi

# Activate virtual environment
if [ -d .venv ]; then
    source .venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "❌ Error: Virtual environment not found at .venv/"
    exit 1
fi

# Set Python path
export PYTHONPATH="/Users/prazw/Desktop/LiqX:$PYTHONPATH"
echo "✅ PYTHONPATH set to: $PYTHONPATH"

# Set SSL certificate path (fixes macOS SSL verification issues)
export SSL_CERT_FILE=$(python -m certifi)
echo "✅ SSL_CERT_FILE set to: $SSL_CERT_FILE"

# Verify Python version
PYTHON_VERSION=$(python --version)
echo "✅ Using $PYTHON_VERSION"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "📋 Configuration Summary"
echo "═══════════════════════════════════════════════════════"
echo "DEPLOY_MODE: $DEPLOY_MODE"
echo "AGENTVERSE_URL: $AGENTVERSE_URL"
echo "AGENTVERSE_API_KEY: ${AGENTVERSE_API_KEY:0:20}..." # Show first 20 chars only
echo "SSL_CERT_FILE: $SSL_CERT_FILE"
echo ""

# Kill any existing agent processes
echo "🧹 Cleaning up any existing agent processes..."
pkill -f "python agents/position_monitor.py" 2>/dev/null || true
pkill -f "python agents/yield_optimizer.py" 2>/dev/null || true
pkill -f "python agents/swap_optimizer.py" 2>/dev/null || true
pkill -f "python agents/cross_chain_executor.py" 2>/dev/null || true
sleep 2
echo "✅ Cleanup complete"
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

echo "═══════════════════════════════════════════════════════"
echo "🚀 Starting Agents..."
echo "═══════════════════════════════════════════════════════"

# Start Position Monitor
echo ""
echo "1️⃣  Starting Position Monitor (Port: $POSITION_MONITOR_PORT)..."
python agents/position_monitor.py > logs/position_monitor.log 2>&1 &
POSITION_PID=$!
echo "   PID: $POSITION_PID"
sleep 2

# Start Yield Optimizer
echo ""
echo "2️⃣  Starting Yield Optimizer (Port: $YIELD_OPTIMIZER_PORT)..."
python agents/yield_optimizer.py > logs/yield_optimizer.log 2>&1 &
YIELD_PID=$!
echo "   PID: $YIELD_PID"
sleep 2

# Start Swap Optimizer
echo ""
echo "3️⃣  Starting Swap Optimizer (Port: $SWAP_OPTIMIZER_PORT)..."
python agents/swap_optimizer.py > logs/swap_optimizer.log 2>&1 &
SWAP_PID=$!
echo "   PID: $SWAP_PID"
sleep 2

# Start Cross-Chain Executor
echo ""
echo "4️⃣  Starting Cross-Chain Executor (Port: $EXECUTOR_PORT)..."
python agents/cross_chain_executor.py > logs/cross_chain_executor.log 2>&1 &
EXECUTOR_PID=$!
echo "   PID: $EXECUTOR_PID"
sleep 2

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ All Agents Started Successfully!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📊 Process IDs:"
echo "   Position Monitor:        $POSITION_PID"
echo "   Yield Optimizer:         $YIELD_PID"
echo "   Swap Optimizer:          $SWAP_PID"
echo "   Cross-Chain Executor:    $EXECUTOR_PID"
echo ""
echo "📁 Log files:"
echo "   Position Monitor:        logs/position_monitor.log"
echo "   Yield Optimizer:         logs/yield_optimizer.log"
echo "   Swap Optimizer:          logs/swap_optimizer.log"
echo "   Cross-Chain Executor:    logs/cross_chain_executor.log"
echo ""
echo "🌐 Agent HTTP Endpoints:"
echo "   Position Monitor:        http://localhost:$POSITION_MONITOR_PORT"
echo "   Yield Optimizer:         http://localhost:$YIELD_OPTIMIZER_PORT"
echo "   Swap Optimizer:          http://localhost:$SWAP_OPTIMIZER_PORT"
echo "   Cross-Chain Executor:    http://localhost:$EXECUTOR_PORT"
echo ""
echo "📝 To view logs in real-time:"
echo "   tail -f logs/position_monitor.log"
echo "   tail -f logs/yield_optimizer.log"
echo "   tail -f logs/swap_optimizer.log"
echo "   tail -f logs/cross_chain_executor.log"
echo ""
echo "🛑 To stop all agents:"
echo "   pkill -f 'python agents/'"
echo ""
echo "🔍 To check agent registration on Agentverse:"
echo "   Visit: https://agentverse.ai"
echo ""
echo "═══════════════════════════════════════════════════════"
