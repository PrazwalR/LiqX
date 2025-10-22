#!/usr/bin/env python3
"""
Print Agent Address Without Starting
"""
from uagents import Agent
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()


# Create agents with seeds to get addresses
position_monitor_seed = os.getenv("AGENT_SEED_POSITION_MONITOR")
yield_optimizer_seed = os.getenv("AGENT_SEED_YIELD_OPTIMIZER")
swap_optimizer_seed = os.getenv("AGENT_SEED_SWAP_OPTIMIZER")
executor_seed = os.getenv("AGENT_SEED_EXECUTOR")
demo_seed = os.getenv("AGENT_SEED_DEMO")

print("=" * 70)
print("🚀 LIQUIDITYGUARD AI - AGENT ADDRESSES")
print("=" * 70)
print()

agents = [
    ("Position Monitor", position_monitor_seed, "8000"),
    ("Yield Optimizer", yield_optimizer_seed, "8001"),
    ("Swap Optimizer", swap_optimizer_seed, "8002"),
    ("Executor", executor_seed, "8003"),
    ("Demo Simulator", demo_seed, "8004"),
]

addresses = {}

for name, seed, port in agents:
    agent = Agent(name=name.lower().replace(
        " ", "_"), seed=seed, port=int(port))
    print(f"✅ {name}")
    print(f"   Address: {agent.address}")
    print(f"   Port: {port}")
    print()
    addresses[name.lower().replace(" ", "_")] = str(agent.address)

print("=" * 70)
print("📋 AGENT ADDRESSES JSON (copy to config/agent_addresses.json)")
print("=" * 70)
print()
print("{")
for i, (key, addr) in enumerate(addresses.items()):
    comma = "," if i < len(addresses) - 1 else ""
    print(f'  "{key}": "{addr}"{comma}')
print("}")
print()

print("=" * 70)
print("🎯 TO START AGENTS:")
print("=" * 70)
print("Terminal 1: python3 agents/position_monitor.py")
print("Terminal 2: python3 agents/yield_optimizer.py")
print()
