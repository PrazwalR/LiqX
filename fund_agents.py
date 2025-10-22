#!/usr/bin/env python3
"""
Fund Agents via Faucet API
Automated funding for all LiquidityGuard AI agents
"""

import os
import time
import requests

# Minimal Funding Script
import requests

AGENT_ADDRESSES = [
    "fetch1veww6pldq2jhsv9ehlljlwqs6dh7mx7cztvqhc",
    "fetch1435780af4fs5u0fslvfp6pwnpjxa6la0l6ey5e",
    "fetch162jd9smfv0eys0k3pye5qcly7456y6apkghzd2",
    "fetch1hu4kt7xm0qjnk6ugk553v7ezfeszghe30lpcj6"
]

FAUCET_API = "https://faucet-dorado.fetch.ai/api/v3/claims"


def fund_agent(address):
    payload = {"address": address}
    try:
        response = requests.post(FAUCET_API, json=payload, timeout=30)
        if response.status_code == 200:
            print(f"✅ Requested tokens for {address}")
        else:
            print(f"❌ Error for {address}: {response.text}")
    except Exception as e:
        print(f"❌ Exception for {address}: {e}")


if __name__ == "__main__":
    for addr in AGENT_ADDRESSES:
        fund_agent(addr)
    print(f"{'='*80}\n")
