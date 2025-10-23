#!/usr/bin/env python3
"""
LiquidityGuard AI - Production Agent Testing
============================================
Test agents with real data from blockchain, subgraph, and APIs
"""

from data.price_feeds import get_price_feed_manager
from data.subgraph_fetcher import get_subgraph_fetcher
import os
import time
import asyncio
import requests
from datetime import datetime
from typing import Dict, List
from colorama import init, Fore, Style
from dotenv import load_dotenv

# Add project to path
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


init(autoreset=True)
load_dotenv()


class ProductionAgentTester:
    """Test agents with real production data"""

    def __init__(self):
        self.results = {}
        self.subgraph = get_subgraph_fetcher()
        self.price_manager = get_price_feed_manager()

        # Agent endpoints
        self.agents = {
            "position_monitor": "http://localhost:8000",
            "yield_optimizer": "http://localhost:8001",
            "swap_optimizer": "http://localhost:8002",
            "cross_chain_executor": "http://localhost:8003"
        }

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

    def test_agent_health(self) -> Dict:
        """Test 1: Check if all agents are running"""
        self.print_header("TEST 1: AGENT HEALTH CHECK")

        results = {}

        for name, url in self.agents.items():
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200 or response.status_code == 404:
                    self.print_success(f"{name}: Running on {url}")
                    results[name] = True
                else:
                    self.print_error(
                        f"{name}: Unexpected status {response.status_code}")
                    results[name] = False
            except Exception as e:
                self.print_error(f"{name}: Not responding ({str(e)[:30]})")
                results[name] = False

        passed = sum(1 for v in results.values() if v)
        total = len(results)
        print(
            f"\n{Fore.CYAN}Agent Health: {passed}/{total} agents running{Style.RESET_ALL}")

        self.results['agent_health'] = results
        return results

    async def test_subgraph_positions(self) -> Dict:
        """Test 2: Query real positions from subgraph"""
        self.print_header("TEST 2: REAL AAVE POSITIONS FROM SUBGRAPH")

        results = {}

        try:
            # Get risky positions (HF < 2.0)
            risky_positions = await self.subgraph.get_risky_positions(
                health_factor_threshold=2.0,
                limit=10
            )

            results['query_success'] = True
            results['risky_count'] = len(risky_positions)

            self.print_success(
                f"Found {len(risky_positions)} risky positions (HF < 2.0)")

            if len(risky_positions) > 0:
                self.print_info("Sample risky positions:")
                for i, pos in enumerate(risky_positions[:5], 1):
                    hf = float(pos.get('healthFactor', 0))
                    collateral = pos.get('collateralAsset', 'N/A')[:10]
                    debt = pos.get('debtAsset', 'N/A')[:10]

                    if hf < 1.3:
                        risk_level = f"{Fore.RED}CRITICAL"
                    elif hf < 1.5:
                        risk_level = f"{Fore.YELLOW}HIGH"
                    else:
                        risk_level = f"{Fore.BLUE}MODERATE"

                    self.print_info(
                        f"  {i}. HF: {hf:.3f} {risk_level}{Fore.BLUE} | "
                        f"Collateral: {collateral}... | Debt: {debt}..."
                    )
            else:
                self.print_warning(
                    "No risky positions found - all positions are healthy!")

            # Get critical positions (HF < 1.3)
            critical = await self.subgraph.get_critical_positions(limit=10)
            results['critical_count'] = len(critical)
            self.print_info(f"Critical positions (HF < 1.3): {len(critical)}")

            # Get recent liquidations
            liquidations = await self.subgraph.get_recent_liquidations(limit=5)
            results['liquidation_count'] = len(liquidations)
            self.print_info(f"Recent liquidations: {len(liquidations)}")

            # Get protocol stats
            protocol_stats = await self.subgraph.get_protocol_stats()
            if protocol_stats:
                tvl = protocol_stats.get('totalValueLocked', 'N/A')
                borrowed = protocol_stats.get('totalBorrowed', 'N/A')
                liq_count = protocol_stats.get('totalLiquidations', 'N/A')

                self.print_info(f"Protocol TVL: {tvl}")
                self.print_info(f"Total Borrowed: {borrowed}")
                self.print_info(f"Total Liquidations: {liq_count}")

                results['protocol_stats'] = True
            else:
                self.print_warning("No protocol stats available")
                results['protocol_stats'] = False

        except Exception as e:
            self.print_error(f"Subgraph query failed: {str(e)}")
            results['query_success'] = False

        self.results['subgraph'] = results
        return results

    async def test_live_prices(self) -> Dict:
        """Test 3: Get live token prices"""
        self.print_header("TEST 3: LIVE TOKEN PRICES")

        results = {}
        tokens = ['ETH', 'WETH', 'USDC', 'USDT', 'DAI']

        for token in tokens:
            try:
                price = await self.price_manager.get_token_price(token)
                if price > 0:
                    self.print_success(f"{token}: ${price:,.2f}")
                    results[token] = price
                else:
                    self.print_error(f"{token}: Failed to get price")
                    results[token] = None
            except Exception as e:
                self.print_error(f"{token}: Error - {str(e)[:30]}")
                results[token] = None

        passed = sum(1 for v in results.values() if v is not None)
        total = len(results)
        print(
            f"\n{Fore.CYAN}Price Feeds: {passed}/{total} tokens priced{Style.RESET_ALL}")

        self.results['prices'] = results
        return results

    def check_agent_logs(self) -> Dict:
        """Test 4: Analyze agent logs for real data processing"""
        self.print_header("TEST 4: AGENT LOG ANALYSIS")

        results = {}
        log_dir = "logs"

        log_files = {
            "position_monitor": f"{log_dir}/position_monitor.log",
            "yield_optimizer": f"{log_dir}/yield_optimizer.log",
            "swap_optimizer": f"{log_dir}/swap_optimizer.log",
            "cross_chain_executor": f"{log_dir}/cross_chain_executor.log"
        }

        for agent, log_path in log_files.items():
            try:
                if not os.path.exists(log_path):
                    self.print_error(f"{agent}: Log file not found")
                    results[agent] = False
                    continue

                with open(log_path, 'r') as f:
                    lines = f.readlines()
                    recent_lines = lines[-100:] if len(lines) > 100 else lines
                    log_text = ''.join(recent_lines)

                # Check for demo mode
                if 'Demo Mode: False' in log_text or 'Demo mode: False' in log_text:
                    self.print_success(f"{agent}: In PRODUCTION mode")
                    results[f"{agent}_production"] = True
                elif 'Demo Mode: True' in log_text or 'Demo mode: True' in log_text:
                    self.print_warning(f"{agent}: Still in DEMO mode")
                    results[f"{agent}_production"] = False
                else:
                    self.print_info(f"{agent}: Mode not determined from logs")
                    results[f"{agent}_production"] = None

                # Check for Almanac registration
                if 'Registration on Almanac API successful' in log_text:
                    self.print_success(f"{agent}: Registered on Almanac")
                    results[f"{agent}_almanac"] = True

                # Check for mailbox
                if 'Mailbox access token acquired' in log_text:
                    self.print_success(f"{agent}: Mailbox connected")
                    results[f"{agent}_mailbox"] = True

                # Check for errors
                error_count = log_text.count('ERROR')
                if error_count > 0:
                    self.print_warning(
                        f"{agent}: {error_count} errors in recent logs")
                    results[f"{agent}_errors"] = error_count

            except Exception as e:
                self.print_error(
                    f"{agent}: Log analysis failed - {str(e)[:30]}")
                results[agent] = False

        self.results['logs'] = results
        return results

    async def test_position_monitoring(self) -> Dict:
        """Test 5: Monitor positions and check for alerts"""
        self.print_header("TEST 5: POSITION MONITORING & ALERTS")

        results = {}

        # Check Position Monitor log for monitoring activity
        log_path = "logs/position_monitor.log"

        if not os.path.exists(log_path):
            self.print_error("Position Monitor log not found")
            return {'log_exists': False}

        with open(log_path, 'r') as f:
            log_text = f.read()

        # Count monitoring cycles
        monitoring_count = log_text.count(
            'Monitoring') + log_text.count('positions to monitor')
        self.print_info(f"Monitoring cycles logged: {monitoring_count}")
        results['monitoring_cycles'] = monitoring_count

        # Check for position checks
        position_checks = log_text.count(
            'Checking position') + log_text.count('Health Factor:')
        self.print_info(f"Position checks: {position_checks}")
        results['position_checks'] = position_checks

        # Check for alerts sent
        alerts_sent = log_text.count(
            'Sending alert') + log_text.count('ALERT') + log_text.count('Health Factor Alert')
        if alerts_sent > 0:
            self.print_success(f"Alerts sent: {alerts_sent}")
            results['alerts_sent'] = alerts_sent
        else:
            self.print_warning(
                "No alerts found in logs (positions may be healthy)")
            results['alerts_sent'] = 0

        # Check for subgraph queries
        subgraph_queries = log_text.count(
            'subgraph') + log_text.count('Subgraph')
        if subgraph_queries > 0:
            self.print_success(f"Subgraph queries: {subgraph_queries}")
            results['subgraph_queries'] = subgraph_queries
        else:
            self.print_warning("No subgraph queries detected")
            results['subgraph_queries'] = 0

        self.results['monitoring'] = results
        return results

    async def test_message_flow(self) -> Dict:
        """Test 6: Verify message flow between agents"""
        self.print_header("TEST 6: AGENT MESSAGE FLOW")

        results = {}

        # Check Yield Optimizer for received alerts
        yield_log = "logs/yield_optimizer.log"
        if os.path.exists(yield_log):
            with open(yield_log, 'r') as f:
                yield_text = f.read()

            alerts_received = yield_text.count(
                'Received alert') + yield_text.count('PositionAlert')
            strategies_generated = yield_text.count(
                'Generated strategy') + yield_text.count('YieldStrategy')

            self.print_info(
                f"Yield Optimizer - Alerts received: {alerts_received}")
            self.print_info(
                f"Yield Optimizer - Strategies generated: {strategies_generated}")

            results['yield_alerts'] = alerts_received
            results['yield_strategies'] = strategies_generated

        # Check Swap Optimizer for received strategies
        swap_log = "logs/swap_optimizer.log"
        if os.path.exists(swap_log):
            with open(swap_log, 'r') as f:
                swap_text = f.read()

            strategies_received = swap_text.count(
                'Received strategy') + swap_text.count('YieldStrategy')
            routes_generated = swap_text.count(
                'Generated route') + swap_text.count('SwapRoute')
            fusion_calls = swap_text.count(
                'Fusion+') + swap_text.count('1inch')

            self.print_info(
                f"Swap Optimizer - Strategies received: {strategies_received}")
            self.print_info(
                f"Swap Optimizer - Routes generated: {routes_generated}")
            self.print_info(
                f"Swap Optimizer - 1inch Fusion+ calls: {fusion_calls}")

            results['swap_strategies'] = strategies_received
            results['swap_routes'] = routes_generated
            results['fusion_calls'] = fusion_calls

        # Check Executor for received routes
        executor_log = "logs/cross_chain_executor.log"
        if os.path.exists(executor_log):
            with open(executor_log, 'r') as f:
                executor_text = f.read()

            routes_received = executor_text.count(
                'Received route') + executor_text.count('SwapRoute')
            simulations = executor_text.count(
                'Simulation') + executor_text.count('simulating')
            executions = executor_text.count(
                'Executing') + executor_text.count('execution')

            self.print_info(f"Executor - Routes received: {routes_received}")
            self.print_info(f"Executor - Simulations performed: {simulations}")
            self.print_info(f"Executor - Executions attempted: {executions}")

            results['executor_routes'] = routes_received
            results['executor_simulations'] = simulations
            results['executor_executions'] = executions

        # Calculate message delivery rate
        if results.get('yield_alerts', 0) > 0:
            delivery_rate = (results.get(
                'yield_alerts', 0) / max(results.get('monitoring', {}).get('alerts_sent', 1), 1)) * 100
            self.print_info(f"Alert delivery rate: {delivery_rate:.1f}%")
            results['delivery_rate'] = delivery_rate

        self.results['message_flow'] = results
        return results

    def display_final_summary(self):
        """Display comprehensive test summary"""
        self.print_header("PRODUCTION AGENT TEST SUMMARY")

        print(f"{Fore.MAGENTA}{'Test Category':<40} {'Result'}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'─' * 80}{Style.RESET_ALL}")

        # Agent Health
        agent_health = self.results.get('agent_health', {})
        running_agents = sum(1 for v in agent_health.values() if v)
        total_agents = len(agent_health)
        if running_agents == total_agents:
            print(
                f"{Fore.GREEN}{'Agent Health':<40} {running_agents}/{total_agents} running{Style.RESET_ALL}")
        else:
            print(
                f"{Fore.RED}{'Agent Health':<40} {running_agents}/{total_agents} running{Style.RESET_ALL}")

        # Subgraph
        subgraph = self.results.get('subgraph', {})
        if subgraph.get('query_success'):
            risky = subgraph.get('risky_count', 0)
            critical = subgraph.get('critical_count', 0)
            print(
                f"{Fore.GREEN}{'Subgraph Data':<40} {risky} risky, {critical} critical{Style.RESET_ALL}")
        else:
            print(f"{Fore.RED}{'Subgraph Data':<40} Query failed{Style.RESET_ALL}")

        # Price Feeds
        prices = self.results.get('prices', {})
        priced_tokens = sum(1 for v in prices.values() if v is not None)
        total_tokens = len(prices)
        if priced_tokens == total_tokens:
            print(
                f"{Fore.GREEN}{'Live Price Feeds':<40} {priced_tokens}/{total_tokens} tokens{Style.RESET_ALL}")
        else:
            print(
                f"{Fore.YELLOW}{'Live Price Feeds':<40} {priced_tokens}/{total_tokens} tokens{Style.RESET_ALL}")

        # Agent Logs
        logs = self.results.get('logs', {})
        production_agents = sum(1 for k, v in logs.items()
                                if '_production' in k and v == True)
        if production_agents >= 3:
            print(
                f"{Fore.GREEN}{'Production Mode':<40} {production_agents}/4 agents{Style.RESET_ALL}")
        else:
            print(
                f"{Fore.YELLOW}{'Production Mode':<40} {production_agents}/4 agents{Style.RESET_ALL}")

        # Monitoring
        monitoring = self.results.get('monitoring', {})
        cycles = monitoring.get('monitoring_cycles', 0)
        alerts = monitoring.get('alerts_sent', 0)
        print(
            f"{Fore.BLUE}{'Position Monitoring':<40} {cycles} cycles, {alerts} alerts{Style.RESET_ALL}")

        # Message Flow
        msg_flow = self.results.get('message_flow', {})
        yield_alerts = msg_flow.get('yield_alerts', 0)
        strategies = msg_flow.get('yield_strategies', 0)
        routes = msg_flow.get('swap_routes', 0)
        sims = msg_flow.get('executor_simulations', 0)
        print(f"{Fore.BLUE}{'Message Flow':<40} {yield_alerts} alerts → {strategies} strats → {routes} routes{Style.RESET_ALL}")

        print(f"\n{Fore.CYAN}{'═' * 80}{Style.RESET_ALL}")

        # Overall assessment
        if running_agents == total_agents and subgraph.get('query_success') and priced_tokens >= 3:
            self.print_success(
                "✨ ALL SYSTEMS OPERATIONAL - PRODUCTION READY ✨")
        elif running_agents >= 3 and subgraph.get('query_success'):
            self.print_warning("MOSTLY OPERATIONAL - Some issues detected")
        else:
            self.print_error("CRITICAL ISSUES - Review test details above")

    async def run_all_tests(self):
        """Run complete production agent test suite"""
        print(f"\n{Fore.MAGENTA}{'═' * 80}")
        print(f"{'🏭 PRODUCTION AGENT TEST SUITE 🏭'.center(80)}")
        print(f"{'Testing with Real Blockchain Data'.center(80)}")
        print(f"{'═' * 80}{Style.RESET_ALL}\n")

        print(f"{Fore.YELLOW}Starting comprehensive production testing...")
        print(
            f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}\n")

        # Run tests
        self.test_agent_health()
        await asyncio.sleep(1)

        await self.test_subgraph_positions()
        await asyncio.sleep(1)

        await self.test_live_prices()
        await asyncio.sleep(1)

        self.check_agent_logs()
        await asyncio.sleep(1)

        await self.test_position_monitoring()
        await asyncio.sleep(1)

        await self.test_message_flow()

        # Final summary
        self.display_final_summary()

        print(f"\n{Fore.YELLOW}Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}\n")


if __name__ == "__main__":
    # Verify we're in production mode
    demo_mode = os.getenv('DEMO_MODE', 'true').lower()
    if demo_mode != 'false':
        print(f"{Fore.YELLOW}⚠️  WARNING: DEMO_MODE is not set to 'false'")
        print(f"Current value: DEMO_MODE={demo_mode}")
        print(
            f"Set DEMO_MODE=false in .env for production testing{Style.RESET_ALL}\n")

    tester = ProductionAgentTester()
    asyncio.run(tester.run_all_tests())
