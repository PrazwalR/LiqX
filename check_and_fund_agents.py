#!/usr/bin/env python3
"""
Check Agent Balances and Fund via Dorado Faucet API

This script:
1. Derives wallet addresses from agent seeds
2. Checks balances on Dorado testnet
3. Funds agents with 0 balance via faucet API
4. Verifies funding was successful
"""

import os
import sys
import time
import requests
from dotenv import load_dotenv
from cosmpy.aerial.client import LedgerClient, NetworkConfig
from cosmpy.aerial.wallet import LocalWallet
from cosmpy.crypto.keypairs import PrivateKey

# Load environment
load_dotenv()

# Dorado Testnet Configuration
DORADO_RPC = "https://rpc-dorado.fetch.ai:443"
DORADO_CHAIN_ID = "dorado-1"
DORADO_FAUCET_API = "https://faucet-dorado.fetch.ai/api/v3/claims"

# Agent seeds from .env
AGENT_SEEDS = {
    "Position Monitor": os.getenv('AGENT_SEED_POSITION_MONITOR'),
    "Yield Optimizer": os.getenv('AGENT_SEED_YIELD_OPTIMIZER'),
    "Swap Optimizer": os.getenv('AGENT_SEED_SWAP_OPTIMIZER'),
    "Executor": os.getenv('AGENT_SEED_EXECUTOR')
}

print("=" * 80)
print("🔍 CHECKING DORADO TESTNET AGENT BALANCES")
print("=" * 80)
print()

# Step 1: Derive wallet addresses from seeds
print("📋 Deriving wallet addresses from agent seeds...")
print()

wallets = {}
for agent_name, seed in AGENT_SEEDS.items():
    if not seed:
        print(f"❌ Missing seed for {agent_name}")
        continue

    # Create wallet from seed
    private_key = PrivateKey(bytes.fromhex(seed))
    wallet = LocalWallet(private_key)
    address = str(wallet.address())

    wallets[agent_name] = {
        "address": address,
        "seed": seed
    }

    print(f"✅ {agent_name:20} → {address}")

print()
print("=" * 80)
print("💰 CHECKING BALANCES ON DORADO TESTNET")
print("=" * 80)
print()

# Step 2: Check balances using Dorado RPC
try:
    # Create network config for Dorado
    dorado_config = NetworkConfig(
        chain_id=DORADO_CHAIN_ID,
        url=DORADO_RPC,
        fee_minimum_gas_price=5000000000,
        fee_denomination="atestfet",
        staking_denomination="atestfet"
    )

    # Create ledger client
    ledger_client = LedgerClient(dorado_config)

    agents_to_fund = []

    for agent_name, info in wallets.items():
        address = info["address"]

        try:
            # Query balance
            balance = ledger_client.query_bank_balance(address)
            # Convert from atestfet to TESTFET
            balance_testfet = int(balance) / 10**18

            if balance_testfet > 0:
                print(f"✅ {agent_name:20} → {balance_testfet:.6f} TESTFET")
            else:
                print(f"⚠️  {agent_name:20} → 0 TESTFET (needs funding)")
                agents_to_fund.append((agent_name, address))

        except Exception as e:
            print(f"❌ {agent_name:20} → Error checking balance: {e}")
            agents_to_fund.append((agent_name, address))

    print()

    # Step 3: Fund agents with 0 balance
    if agents_to_fund:
        print("=" * 80)
        print(f"💸 FUNDING {len(agents_to_fund)} AGENTS VIA DORADO FAUCET")
        print("=" * 80)
        print()

        for agent_name, address in agents_to_fund:
            print(f"Requesting tokens for {agent_name} ({address})...")

            try:
                payload = {"address": address}
                response = requests.post(
                    DORADO_FAUCET_API,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=30
                )

                if response.status_code == 200:
                    result = response.json()
                    if result.get("status") == "ok":
                        uuid = result.get("uuid", "N/A")
                        print(f"✅ Funding request submitted (UUID: {uuid})")
                    else:
                        print(f"⚠️  Unexpected response: {result}")
                else:
                    print(
                        f"❌ Faucet error ({response.status_code}): {response.text}")

            except Exception as e:
                print(f"❌ Exception: {e}")

            print()
            time.sleep(2)  # Rate limiting

        print("⏳ Waiting 30 seconds for faucet transactions to process...")
        time.sleep(30)

        # Step 4: Verify funding
        print()
        print("=" * 80)
        print("✅ VERIFYING FUNDING")
        print("=" * 80)
        print()

        for agent_name, address in agents_to_fund:
            try:
                balance = ledger_client.query_bank_balance(address)
                balance_testfet = int(balance) / 10**18

                if balance_testfet > 0:
                    print(
                        f"✅ {agent_name:20} → {balance_testfet:.6f} TESTFET (FUNDED!)")
                else:
                    print(
                        f"⚠️  {agent_name:20} → Still 0 TESTFET (faucet may be delayed)")

            except Exception as e:
                print(f"❌ {agent_name:20} → Error: {e}")

    else:
        print("✅ All agents already have sufficient funds!")

    print()
    print("=" * 80)
    print("📊 FINAL SUMMARY")
    print("=" * 80)
    print()

    all_funded = True
    for agent_name, info in wallets.items():
        address = info["address"]

        try:
            balance = ledger_client.query_bank_balance(address)
            balance_testfet = int(balance) / 10**18

            status = "✅ READY" if balance_testfet >= 0.5 else "❌ INSUFFICIENT"
            print(f"{status} | {agent_name:20} | {balance_testfet:.6f} TESTFET")

            if balance_testfet < 0.5:
                all_funded = False

        except Exception as e:
            print(f"❌ ERROR | {agent_name:20} | {e}")
            all_funded = False

    print()
    print("=" * 80)

    if all_funded:
        print("🎉 ALL AGENTS READY FOR ALMANAC DEPLOYMENT!")
        print()
        print("Next step: Run the deployment script")
        print("  python deploy_individual_agents.py")
        print()
    else:
        print("⚠️  SOME AGENTS NEED MORE FUNDS")
        print()
        print("Options:")
        print("  1. Wait a few minutes and run this script again")
        print("  2. Use the block explorer faucet manually:")
        print("     https://explore-dorado.fetch.ai")
        print()

except Exception as e:
    print(f"❌ CRITICAL ERROR: {e}")
    print()
    print("Troubleshooting:")
    print("  1. Check internet connection")
    print("  2. Verify Dorado RPC is accessible:")
    print(f"     {DORADO_RPC}")
    print("  3. Check if cosmpy is installed:")
    print("     pip install cosmpy")
    sys.exit(1)

print("=" * 80)
