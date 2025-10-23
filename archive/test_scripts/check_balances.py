#!/usr/bin/env python3
"""
Check Agent Balances on Dorado Testnet

Uses fetchd CLI or direct HTTP query to check balances
"""

import os
import subprocess
import requests
import json
from dotenv import load_dotenv
from uagents import Agent

load_dotenv()

# Agent configuration
AGENTS = {
    'Position Monitor': {
        'seed': os.getenv('AGENT_SEED_POSITION_MONITOR'),
        'wallet': 'fetch1veww6pldq2jhsv9ehlljlwqs6dh7mx7cztvqhc'
    },
    'Yield Optimizer': {
        'seed': os.getenv('AGENT_SEED_YIELD_OPTIMIZER'),
        'wallet': 'fetch1435780af4fs5u0fslvfp6pwnpjxa6la0l6ey5e'
    },
    'Swap Optimizer': {
        'seed': os.getenv('AGENT_SEED_SWAP_OPTIMIZER'),
        'wallet': 'fetch162jd9smfv0eys0k3pye5qcly7456y6apkghzd2'
    },
    'Executor': {
        'seed': os.getenv('AGENT_SEED_EXECUTOR'),
        'wallet': 'fetch1hu4kt7xm0qjnk6ugk553v7ezfeszghe30lpcj6'
    }
}

DORADO_LCD_API = "https://rest-dorado.fetch.ai"

print("=" * 80)
print("💰 CHECKING AGENT BALANCES ON DORADO TESTNET")
print("=" * 80)
print()

all_funded = True

for agent_name, info in AGENTS.items():
    wallet_address = info['wallet']

    try:
        # Query balance via LCD API
        url = f"{DORADO_LCD_API}/cosmos/bank/v1beta1/balances/{wallet_address}"
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            data = response.json()
            balances = data.get('balances', [])

            if balances:
                # Find atestfet balance
                testfet_balance = 0
                for balance in balances:
                    if balance.get('denom') == 'atestfet':
                        testfet_balance = int(
                            balance.get('amount', 0)) / 10**18
                        break

                if testfet_balance > 0:
                    print(f"✅ {agent_name:20} → {testfet_balance:.6f} TESTFET")
                else:
                    print(
                        f"⚠️  {agent_name:20} → 0 TESTFET (still waiting for faucet)")
                    all_funded = False
            else:
                print(f"⚠️  {agent_name:20} → 0 TESTFET (no balance data)")
                all_funded = False
        else:
            print(f"❌ {agent_name:20} → Error {response.status_code}")
            all_funded = False

    except Exception as e:
        print(f"❌ {agent_name:20} → Exception: {e}")
        all_funded = False

print()
print("=" * 80)

if all_funded:
    print("🎉 ALL AGENTS FUNDED! Ready to deploy to Almanac")
    print()
    print("Next step: Deploy agents")
    print("  Terminal 1: python agents/position_monitor.py")
    print("  Terminal 2: python agents/yield_optimizer.py")
    print("  Terminal 3: python agents/swap_optimizer.py")
    print("  Terminal 4: python agents/cross_chain_executor.py")
else:
    print("⏳ Some agents still need funds")
    print()
    print("Options:")
    print("  1. Wait 1-2 minutes and run this script again:")
    print("     python check_balances.py")
    print()
    print("  2. Request more tokens manually:")
    print("     python fund_agents.py")
    print()
    print("  3. Use block explorer faucet:")
    print("     https://explore-dorado.fetch.ai")

print("=" * 80)
