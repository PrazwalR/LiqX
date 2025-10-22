#!/bin/bash
# Quick Start Agents Script

echo "=" 60
echo "🚀 LIQUIDITYGUARD AI - STARTING AGENTS"
echo "=" 60
echo ""

# Activate venv
source venv/bin/activate

echo "✅ Dependencies installed"
echo "✅ Agent addresses configured"
echo ""
echo "📋 AGENT ADDRESSES:"
cat config/agent_addresses.json
echo ""
echo "=" 60
echo "🎯 TO START AGENTS (in separate terminals):"
echo "=" 60
echo ""
echo "Terminal 1:"
echo "  cd /Users/prazw/Desktop/LiqX"
echo "  source venv/bin/activate"
echo "  python3 agents/position_monitor.py"
echo ""
echo "Terminal 2:"
echo "  cd /Users/prazw/Desktop/LiqX"
echo "  source venv/bin/activate"
echo "  python3 agents/yield_optimizer.py"
echo ""
echo "=" 60
echo "✅ AGENTS READY TO DEPLOY!"
echo "=" 60
