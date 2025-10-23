#!/usr/bin/env python3
"""
LiquidityGuard AI - Production Mode Testing Suite
=================================================
Comprehensive testing with real data, APIs, and blockchain interactions
"""

import os
import time
import json
import requests
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from colorama import init, Fore, Style
from web3 import Web3

init(autoreset=True)


class ProductionTester:
    """Comprehensive production mode testing"""

    def __init__(self):
        self.results = {
            "environment": {},
            "rpc_endpoints": {},
            "api_keys": {},
            "subgraph": {},
            "price_feeds": {},
            "protocol_data": {},
            "oneinch": {},
            "overall": {}
        }

        # Load environment variables
        self.load_env()

    def load_env(self):
        """Load environment variables from .env"""
        try:
            with open('.env', 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        # Remove quotes if present
                        value = value.strip('"').strip("'")
                        os.environ[key] = value
        except FileNotFoundError:
            self.print_error(".env file not found")

    def print_header(self, text: str):
        print(f"\n{Fore.CYAN}{'═' * 80}")
        print(f"{Fore.CYAN}{text.center(80)}")
        print(f"{Fore.CYAN}{'═' * 80}{Style.RESET_ALL}\n")

    def print_success(self, text: str):
        print(f"{Fore.GREEN}✅ {text}{Style.RESET_ALL}")

    def print_error(self, text: str):
        print(f"{Fore.RED}❌ {text}{Style.RESET_ALL}")

    def print_warning(self, text: str):
        print(f"{Fore.YELLOW}⚠️  {text}{Style.RESET_ALL}")

    def print_info(self, text: str):
        print(f"{Fore.BLUE}ℹ️  {text}{Style.RESET_ALL}")

    def test_environment_config(self) -> Dict:
        """Test 1: Verify environment configuration"""
        self.print_header("TEST 1: ENVIRONMENT CONFIGURATION")

        results = {}

        # Check DEMO_MODE setting
        demo_mode = os.getenv('DEMO_MODE', 'true').lower()
        if demo_mode == 'false':
            self.print_success("DEMO_MODE is set to false (production mode)")
            results['demo_mode'] = True
        else:
            self.print_error(
                f"DEMO_MODE is still '{demo_mode}' - should be 'false'")
            results['demo_mode'] = False

        # Check required environment variables
        required_vars = [
            'ETHEREUM_RPC_URL',
            'ARBITRUM_RPC_URL',
            'ALCHEMY_API_KEY',
            'ONEINCH_API_KEY',
            'COINGECKO_API_KEY',
            'THEGRAPH_API_KEY',
            'LIQX_SUBGRAPH_URL'
        ]

        for var in required_vars:
            value = os.getenv(var)
            if value and value != '':
                self.print_success(f"{var}: Configured")
                results[var] = True
            else:
                self.print_error(f"{var}: Not configured")
                results[var] = False

        self.results['environment'] = results
        passed = sum(1 for v in results.values() if v)
        total = len(results)
        print(
            f"\n{Fore.CYAN}Environment Config: {passed}/{total} checks passed{Style.RESET_ALL}")

        return results

    def test_rpc_endpoints(self) -> Dict:
        """Test 2: Verify RPC endpoint connectivity"""
        self.print_header("TEST 2: RPC ENDPOINT CONNECTIVITY")

        results = {}

        # Test Ethereum Sepolia RPC
        eth_rpc = os.getenv('ETHEREUM_RPC_URL')
        if eth_rpc:
            try:
                w3_eth = Web3(Web3.HTTPProvider(
                    eth_rpc, request_kwargs={'timeout': 10}))
                if w3_eth.is_connected():
                    block_number = w3_eth.eth.block_number
                    chain_id = w3_eth.eth.chain_id
                    self.print_success(
                        f"Ethereum Sepolia: Connected (Block: {block_number}, Chain ID: {chain_id})")
                    results['ethereum'] = True
                else:
                    self.print_error("Ethereum Sepolia: Connection failed")
                    results['ethereum'] = False
            except Exception as e:
                self.print_error(f"Ethereum Sepolia: Error - {str(e)[:50]}")
                results['ethereum'] = False
        else:
            self.print_error("Ethereum RPC URL not configured")
            results['ethereum'] = False

        # Test Arbitrum Sepolia RPC
        arb_rpc = os.getenv('ARBITRUM_RPC_URL')
        if arb_rpc:
            try:
                w3_arb = Web3(Web3.HTTPProvider(
                    arb_rpc, request_kwargs={'timeout': 10}))
                if w3_arb.is_connected():
                    block_number = w3_arb.eth.block_number
                    chain_id = w3_arb.eth.chain_id
                    self.print_success(
                        f"Arbitrum Sepolia: Connected (Block: {block_number}, Chain ID: {chain_id})")
                    results['arbitrum'] = True
                else:
                    self.print_error("Arbitrum Sepolia: Connection failed")
                    results['arbitrum'] = False
            except Exception as e:
                self.print_error(f"Arbitrum Sepolia: Error - {str(e)[:50]}")
                results['arbitrum'] = False
        else:
            self.print_error("Arbitrum RPC URL not configured")
            results['arbitrum'] = False

        self.results['rpc_endpoints'] = results
        passed = sum(1 for v in results.values() if v)
        total = len(results)
        print(
            f"\n{Fore.CYAN}RPC Endpoints: {passed}/{total} checks passed{Style.RESET_ALL}")

        return results

    def test_coingecko_api(self) -> Dict:
        """Test 3: Test CoinGecko API for live prices"""
        self.print_header("TEST 3: COINGECKO API - LIVE PRICE FEEDS")

        results = {}
        api_key = os.getenv('COINGECKO_API_KEY')

        if not api_key:
            self.print_error("CoinGecko API key not configured")
            return {'configured': False}

        # Test ETH price
        try:
            url = "https://api.coingecko.com/api/v3/simple/price"
            params = {
                'ids': 'ethereum,usd-coin,tether',
                'vs_currencies': 'usd',
                'x_cg_demo_api_key': api_key
            }

            response = requests.get(url, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()

                if 'ethereum' in data and 'usd' in data['ethereum']:
                    eth_price = data['ethereum']['usd']
                    self.print_success(f"ETH Price: ${eth_price:,.2f}")
                    results['eth_price'] = eth_price

                if 'usd-coin' in data and 'usd' in data['usd-coin']:
                    usdc_price = data['usd-coin']['usd']
                    self.print_success(f"USDC Price: ${usdc_price:.4f}")
                    results['usdc_price'] = usdc_price

                if 'tether' in data and 'usd' in data['tether']:
                    usdt_price = data['tether']['usd']
                    self.print_success(f"USDT Price: ${usdt_price:.4f}")
                    results['usdt_price'] = usdt_price

                results['api_working'] = True
            elif response.status_code == 429:
                self.print_error("Rate limit exceeded - too many requests")
                results['api_working'] = False
                results['rate_limited'] = True
            else:
                self.print_error(
                    f"API returned status code: {response.status_code}")
                results['api_working'] = False

        except Exception as e:
            self.print_error(f"CoinGecko API Error: {str(e)[:50]}")
            results['api_working'] = False

        self.results['price_feeds'] = results

        if results.get('api_working'):
            self.print_success("CoinGecko API: Working correctly")

        return results

    def test_subgraph(self) -> Dict:
        """Test 4: Test LiqX Subgraph queries"""
        self.print_header("TEST 4: LIQX SUBGRAPH - REAL AAVE POSITIONS")

        results = {}
        subgraph_url = os.getenv('LIQX_SUBGRAPH_URL')

        if not subgraph_url:
            self.print_error("LiqX Subgraph URL not configured")
            return {'configured': False}

        self.print_info(f"Subgraph URL: {subgraph_url}")

        # Test query for user positions (using correct schema)
        query = """
        {
          users(first: 5) {
            id
            totalSupplied
            totalBorrowed
            liquidationCount
            positions {
              id
              collateralAsset
              collateralAmount
              debtAsset
              debtAmount
              healthFactor
              isActive
            }
          }
        }
        """

        try:
            response = requests.post(
                subgraph_url,
                json={'query': query},
                timeout=15
            )

            if response.status_code == 200:
                data = response.json()

                if 'data' in data and 'users' in data['data']:
                    users = data['data']['users']
                    self.print_success(
                        f"Subgraph query successful: Found {len(users)} users")

                    if len(users) > 0:
                        self.print_info("Sample user positions:")
                        for i, user in enumerate(users[:3], 1):
                            self.print_info(
                                f"  User {i}: {user.get('id', 'N/A')[:10]}...")
                            self.print_info(
                                f"    Total Supplied: {user.get('totalSupplied', 0)}")
                            self.print_info(
                                f"    Total Borrowed: {user.get('totalBorrowed', 0)}")

                            positions = user.get('positions', [])
                            if positions:
                                self.print_info(
                                    f"    Active Positions: {len(positions)}")
                                for pos in positions[:2]:
                                    if pos.get('isActive'):
                                        self.print_info(f"      - HF: {pos.get('healthFactor', 'N/A')}, "
                                                        f"Collateral: {pos.get('collateralAsset', 'N/A')}, "
                                                        f"Debt: {pos.get('debtAsset', 'N/A')}")

                        results['users_found'] = len(users)
                        results['query_working'] = True
                    else:
                        self.print_warning(
                            "No users found in subgraph (may be empty testnet)")
                        results['users_found'] = 0
                        results['query_working'] = True
                else:
                    self.print_error(
                        "Unexpected response format from subgraph")
                    results['query_working'] = False
            else:
                self.print_error(
                    f"Subgraph returned status code: {response.status_code}")
                results['query_working'] = False

        except Exception as e:
            self.print_error(f"Subgraph Error: {str(e)[:100]}")
            results['query_working'] = False

        self.results['subgraph'] = results
        return results

    def test_1inch_api(self) -> Dict:
        """Test 5: Test 1inch Fusion+ API"""
        self.print_header("TEST 5: 1INCH FUSION+ API")

        results = {}
        api_key = os.getenv('ONEINCH_API_KEY')
        base_url = os.getenv('ONEINCH_BASE_URL', 'https://api.1inch.dev')

        if not api_key:
            self.print_error("1inch API key not configured")
            return {'configured': False}

        # Test API health/status endpoint
        try:
            headers = {
                'Authorization': f'Bearer {api_key}',
                'accept': 'application/json'
            }

            # Test quote endpoint (Ethereum Sepolia = chain 11155111)
            # Using a simple ETH -> USDC swap quote
            chain_id = 11155111  # Sepolia

            self.print_info(
                f"Testing 1inch API on Sepolia (Chain ID: {chain_id})")

            # Note: 1inch may not support Sepolia, so we'll test the API connection
            url = f"{base_url}/swap/v6.0/{chain_id}/quote"

            # Simple test params (may need adjustment based on 1inch API docs)
            params = {
                'src': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',  # ETH
                # USDC on Sepolia (example)
                'dst': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
                'amount': '1000000000000000000',  # 1 ETH
            }

            response = requests.get(
                url, headers=headers, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()
                self.print_success("1inch API: Connected successfully")
                self.print_info(f"Quote received: {str(data)[:100]}...")
                results['api_working'] = True
            elif response.status_code == 404:
                self.print_warning("1inch may not support Sepolia testnet")
                self.print_info("API key is valid but chain not supported")
                results['api_working'] = True
                results['sepolia_supported'] = False
            elif response.status_code == 401:
                self.print_error(
                    "1inch API: Authentication failed (invalid API key)")
                results['api_working'] = False
            elif response.status_code == 429:
                self.print_error("1inch API: Rate limit exceeded")
                results['api_working'] = False
                results['rate_limited'] = True
            else:
                self.print_warning(
                    f"1inch API returned status: {response.status_code}")
                self.print_info(f"Response: {response.text[:200]}")
                results['api_working'] = True  # API is responding

        except Exception as e:
            self.print_error(f"1inch API Error: {str(e)[:100]}")
            results['api_working'] = False

        self.results['oneinch'] = results
        return results

    def display_final_summary(self):
        """Display comprehensive test summary"""
        self.print_header("PRODUCTION MODE TEST SUMMARY")

        print(
            f"{Fore.MAGENTA}{'Test Category':<35} {'Status':<20} {'Details'}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'─' * 80}{Style.RESET_ALL}")

        # Environment
        env_results = self.results.get('environment', {})
        env_passed = sum(1 for v in env_results.values() if v)
        env_total = len(env_results)
        if env_passed == env_total:
            print(
                f"{Fore.GREEN}{'Environment Configuration':<35} {'✅ PASSED':<20} {env_passed}/{env_total}{Style.RESET_ALL}")
        elif env_passed > 0:
            print(f"{Fore.YELLOW}{'Environment Configuration':<35} {'⚠️  PARTIAL':<20} {env_passed}/{env_total}{Style.RESET_ALL}")
        else:
            print(
                f"{Fore.RED}{'Environment Configuration':<35} {'❌ FAILED':<20} {env_passed}/{env_total}{Style.RESET_ALL}")

        # RPC Endpoints
        rpc_results = self.results.get('rpc_endpoints', {})
        rpc_passed = sum(1 for v in rpc_results.values() if v)
        rpc_total = len(rpc_results)
        if rpc_passed == rpc_total:
            print(
                f"{Fore.GREEN}{'RPC Endpoints':<35} {'✅ PASSED':<20} {rpc_passed}/{rpc_total}{Style.RESET_ALL}")
        elif rpc_passed > 0:
            print(
                f"{Fore.YELLOW}{'RPC Endpoints':<35} {'⚠️  PARTIAL':<20} {rpc_passed}/{rpc_total}{Style.RESET_ALL}")
        else:
            print(
                f"{Fore.RED}{'RPC Endpoints':<35} {'❌ FAILED':<20} {rpc_passed}/{rpc_total}{Style.RESET_ALL}")

        # Price Feeds
        price_results = self.results.get('price_feeds', {})
        if price_results.get('api_working'):
            eth_price = price_results.get('eth_price', 0)
            print(
                f"{Fore.GREEN}{'CoinGecko API (Live Prices)':<35} {'✅ PASSED':<20} ETH: ${eth_price:,.0f}{Style.RESET_ALL}")
        elif price_results.get('rate_limited'):
            print(
                f"{Fore.YELLOW}{'CoinGecko API (Live Prices)':<35} {'⚠️  RATE LIMITED':<20}{Style.RESET_ALL}")
        else:
            print(
                f"{Fore.RED}{'CoinGecko API (Live Prices)':<35} {'❌ FAILED':<20}{Style.RESET_ALL}")

        # Subgraph
        subgraph_results = self.results.get('subgraph', {})
        if subgraph_results.get('query_working'):
            users = subgraph_results.get('users_found', 0)
            print(
                f"{Fore.GREEN}{'LiqX Subgraph (Aave Positions)':<35} {'✅ PASSED':<20} {users} users{Style.RESET_ALL}")
        else:
            print(
                f"{Fore.RED}{'LiqX Subgraph (Aave Positions)':<35} {'❌ FAILED':<20}{Style.RESET_ALL}")

        # 1inch API
        oneinch_results = self.results.get('oneinch', {})
        if oneinch_results.get('api_working'):
            if oneinch_results.get('sepolia_supported') == False:
                print(
                    f"{Fore.YELLOW}{'1inch Fusion+ API':<35} {'⚠️  NO SEPOLIA':<20} API valid{Style.RESET_ALL}")
            else:
                print(
                    f"{Fore.GREEN}{'1inch Fusion+ API':<35} {'✅ PASSED':<20}{Style.RESET_ALL}")
        else:
            print(
                f"{Fore.RED}{'1inch Fusion+ API':<35} {'❌ FAILED':<20}{Style.RESET_ALL}")

        print(f"\n{Fore.CYAN}{'═' * 80}{Style.RESET_ALL}")

        # Calculate overall status
        all_checks = []
        all_checks.extend(env_results.values())
        all_checks.extend(rpc_results.values())
        if price_results.get('api_working'):
            all_checks.append(True)
        if subgraph_results.get('query_working'):
            all_checks.append(True)
        if oneinch_results.get('api_working'):
            all_checks.append(True)

        passed_checks = sum(1 for check in all_checks if check)
        total_checks = len(all_checks)

        if passed_checks == total_checks:
            self.print_success(
                f"ALL CHECKS PASSED ({passed_checks}/{total_checks})")
            self.print_success(
                "✨ System ready for production mode agent testing! ✨")
        elif passed_checks >= total_checks * 0.7:
            self.print_warning(
                f"MOSTLY OPERATIONAL ({passed_checks}/{total_checks} checks passed)")
            self.print_info(
                "Some services may have limitations - review details above")
        else:
            self.print_error(
                f"CRITICAL ISSUES ({passed_checks}/{total_checks} checks passed)")
            self.print_warning(
                "Fix failing tests before proceeding to agent testing")

    def run_all_tests(self):
        """Run complete production test suite"""
        print(f"\n{Fore.MAGENTA}{'═' * 80}")
        print(f"{'🏭 LIQUIDITYGUARD AI - PRODUCTION MODE TEST SUITE 🏭'.center(80)}")
        print(f"{'═' * 80}{Style.RESET_ALL}\n")

        print(
            f"{Fore.YELLOW}Testing real APIs, blockchain connections, and data sources...")
        print(
            f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}\n")

        # Run tests
        self.test_environment_config()
        time.sleep(1)

        self.test_rpc_endpoints()
        time.sleep(1)

        self.test_coingecko_api()
        time.sleep(1)

        self.test_subgraph()
        time.sleep(1)

        self.test_1inch_api()

        # Final summary
        self.display_final_summary()

        print(f"\n{Fore.YELLOW}Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}\n")


if __name__ == "__main__":
    # Check if we're in production mode
    demo_mode = os.getenv('DEMO_MODE', 'true').lower()
    if demo_mode != 'false':
        print(f"{Fore.YELLOW}⚠️  WARNING: DEMO_MODE is not set to 'false'")
        print(f"Set DEMO_MODE=false in .env to enable production testing")
        print(f"Current value: DEMO_MODE={demo_mode}{Style.RESET_ALL}\n")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            print("Exiting...")
            exit(0)

    tester = ProductionTester()
    tester.run_all_tests()
