#!/usr/bin/env python3
"""
LiquidityGuard AI - Demo Mode Testing Suite
============================================
Comprehensive testing of all agent interactions in demo mode
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Dict, List, Optional
import requests
from colorama import init, Fore, Style

# Initialize colorama
init(autoreset=True)


class DemoTester:
    """Comprehensive demo mode testing for LiquidityGuard AI"""

    def __init__(self):
        self.agents = {
            "position_monitor": {"port": 8000, "name": "Position Monitor"},
            "yield_optimizer": {"port": 8001, "name": "Yield Optimizer"},
            "swap_optimizer": {"port": 8002, "name": "Swap Optimizer"},
            "executor": {"port": 8003, "name": "Cross-Chain Executor"}
        }

        self.test_results = {
            "startup": {},
            "almanac_registration": {},
            "demo_position": {},
            "alert_generation": {},
            "message_flow": {},
            "mailbox": {}
        }

        self.log_files = {
            "position_monitor": "logs/position_monitor.log",
            "yield_optimizer": "logs/yield_optimizer.log",
            "swap_optimizer": "logs/swap_optimizer.log",
            "executor": "logs/cross_chain_executor.log"
        }

    def print_header(self, text: str):
        """Print formatted section header"""
        print(f"\n{Fore.CYAN}{'═' * 70}")
        print(f"{Fore.CYAN}{text.center(70)}")
        print(f"{Fore.CYAN}{'═' * 70}{Style.RESET_ALL}\n")

    def print_success(self, text: str):
        """Print success message"""
        print(f"{Fore.GREEN}✅ {text}{Style.RESET_ALL}")

    def print_error(self, text: str):
        """Print error message"""
        print(f"{Fore.RED}❌ {text}{Style.RESET_ALL}")

    def print_warning(self, text: str):
        """Print warning message"""
        print(f"{Fore.YELLOW}⚠️  {text}{Style.RESET_ALL}")

    def print_info(self, text: str):
        """Print info message"""
        print(f"{Fore.BLUE}ℹ️  {text}{Style.RESET_ALL}")

    def test_agent_http_endpoint(self, agent_key: str) -> bool:
        """Test if agent HTTP endpoint is accessible"""
        agent = self.agents[agent_key]
        port = agent["port"]
        name = agent["name"]

        try:
            response = requests.get(f"http://localhost:{port}/", timeout=5)
            # 404 is OK, means server is running
            if response.status_code in [200, 404]:
                self.print_success(
                    f"{name} HTTP endpoint accessible on port {port}")
                return True
            else:
                self.print_error(
                    f"{name} returned status code {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            self.print_error(
                f"{name} HTTP endpoint not accessible on port {port}")
            return False
        except Exception as e:
            self.print_error(f"{name} endpoint test failed: {str(e)}")
            return False

    def check_log_for_pattern(self, agent_key: str, pattern: str,
                              description: str) -> bool:
        """Check if log file contains a specific pattern"""
        log_file = self.log_files[agent_key]
        agent_name = self.agents[agent_key]["name"]

        try:
            with open(log_file, 'r') as f:
                log_content = f.read()
                if pattern in log_content:
                    self.print_success(f"{agent_name}: {description}")
                    return True
                else:
                    self.print_error(
                        f"{agent_name}: {description} - NOT FOUND")
                    return False
        except FileNotFoundError:
            self.print_error(f"{agent_name}: Log file not found - {log_file}")
            return False

    def extract_agent_address(self, agent_key: str) -> Optional[str]:
        """Extract agent address from log file"""
        log_file = self.log_files[agent_key]

        try:
            with open(log_file, 'r') as f:
                for line in f:
                    if "Agent address: agent1" in line:
                        # Extract agent address
                        parts = line.split("Agent address: ")
                        if len(parts) > 1:
                            address = parts[1].strip()
                            return address
            return None
        except FileNotFoundError:
            return None

    def count_log_occurrences(self, agent_key: str, pattern: str) -> int:
        """Count how many times a pattern appears in log"""
        log_file = self.log_files[agent_key]

        try:
            with open(log_file, 'r') as f:
                return f.read().count(pattern)
        except FileNotFoundError:
            return 0

    def get_latest_log_lines(self, agent_key: str, num_lines: int = 50) -> List[str]:
        """Get latest N lines from log file"""
        log_file = self.log_files[agent_key]

        try:
            with open(log_file, 'r') as f:
                lines = f.readlines()
                return lines[-num_lines:]
        except FileNotFoundError:
            return []

    def test_startup_and_registration(self):
        """Test 1: Agent Startup & Almanac Registration"""
        self.print_header("TEST 1: AGENT STARTUP & ALMANAC REGISTRATION")

        print(
            f"{Fore.YELLOW}Waiting 10 seconds for agents to initialize...{Style.RESET_ALL}")
        time.sleep(10)

        results = {}

        for agent_key in self.agents.keys():
            agent_name = self.agents[agent_key]["name"]
            print(f"\n{Fore.MAGENTA}Testing {agent_name}...{Style.RESET_ALL}")

            agent_results = {
                "http_endpoint": self.test_agent_http_endpoint(agent_key),
                "almanac_mode": self.check_log_for_pattern(
                    agent_key,
                    "Agent initialized in ALMANAC mode",
                    "Initialized in ALMANAC mode"
                ),
                "agent_address": self.extract_agent_address(agent_key),
                "almanac_api_success": self.check_log_for_pattern(
                    agent_key,
                    "Registration on Almanac API successful",
                    "Registered on Almanac API"
                ),
                "almanac_contract": self.check_log_for_pattern(
                    agent_key,
                    "Almanac contract registration",
                    "Almanac contract registration"
                ),
                "mailbox_client": self.check_log_for_pattern(
                    agent_key,
                    "Starting mailbox client",
                    "Mailbox client started"
                )
            }

            if agent_results["agent_address"]:
                self.print_info(
                    f"Agent Address: {agent_results['agent_address']}")

            results[agent_key] = agent_results

        self.test_results["startup"] = results

        # Summary
        print(f"\n{Fore.CYAN}{'─' * 70}{Style.RESET_ALL}")
        total_tests = len(self.agents) * 6
        passed_tests = sum(
            1 for agent_results in results.values()
            for test_result in [
                agent_results["http_endpoint"],
                agent_results["almanac_mode"],
                bool(agent_results["agent_address"]),
                agent_results["almanac_api_success"],
                agent_results["almanac_contract"],
                agent_results["mailbox_client"]
            ]
            if test_result
        )

        print(f"{Fore.CYAN}Startup & Registration: {passed_tests}/{total_tests} tests passed{Style.RESET_ALL}")

    def test_demo_position_creation(self):
        """Test 2: Demo Position Creation"""
        self.print_header("TEST 2: DEMO POSITION CREATION")

        # Check if Position Monitor created demo position
        demo_position_created = self.check_log_for_pattern(
            "position_monitor",
            "✅ Demo position created",
            "Demo position created"
        )

        # Check position details
        has_collateral = self.check_log_for_pattern(
            "position_monitor",
            "Collateral: 2.0 ETH",
            "Collateral amount: 2.0 ETH"
        )

        has_debt = self.check_log_for_pattern(
            "position_monitor",
            "Debt: 5000.0 USDC",
            "Debt amount: 5000.0 USDC"
        )

        # Check mock prices initialized
        mock_prices = self.check_log_for_pattern(
            "position_monitor",
            "Mock prices initialized",
            "Mock prices initialized"
        )

        # Check monitoring started
        monitoring_started = self.check_log_for_pattern(
            "position_monitor",
            "Monitoring 1 positions",
            "Position monitoring started"
        )

        self.test_results["demo_position"] = {
            "created": demo_position_created,
            "has_collateral": has_collateral,
            "has_debt": has_debt,
            "mock_prices": mock_prices,
            "monitoring_started": monitoring_started
        }

        passed = sum([demo_position_created, has_collateral, has_debt,
                     mock_prices, monitoring_started])
        print(
            f"\n{Fore.CYAN}Demo Position: {passed}/5 tests passed{Style.RESET_ALL}")

    def test_alert_generation(self):
        """Test 3: Alert Generation & MeTTa Assessment"""
        self.print_header("TEST 3: ALERT GENERATION & RISK ASSESSMENT")

        # Check health factor calculation
        health_factor = self.check_log_for_pattern(
            "position_monitor",
            "HF: 1.09",
            "Health factor calculated (HF: 1.09)"
        )

        # Check critical risk detection
        critical_risk = self.check_log_for_pattern(
            "position_monitor",
            "Risk: CRITICAL",
            "Critical risk level detected"
        )

        # Check MeTTa risk assessment
        metta_assessment = self.check_log_for_pattern(
            "position_monitor",
            "MeTTa Risk Assessment",
            "MeTTa risk assessment performed"
        )

        # Count how many alerts were sent
        alert_count = self.count_log_occurrences(
            "position_monitor", "ALERT SENT")

        if alert_count > 0:
            self.print_success(f"Generated {alert_count} position alerts")
        else:
            self.print_error("No alerts generated yet")

        # Check urgency score
        urgency = self.check_log_for_pattern(
            "position_monitor",
            "Urgency: 8/10",
            "High urgency score (8/10)"
        )

        self.test_results["alert_generation"] = {
            "health_factor": health_factor,
            "critical_risk": critical_risk,
            "metta_assessment": metta_assessment,
            "alert_count": alert_count,
            "urgency": urgency
        }

        passed = sum([health_factor, critical_risk, metta_assessment,
                     alert_count > 0, urgency])
        print(
            f"\n{Fore.CYAN}Alert Generation: {passed}/5 tests passed{Style.RESET_ALL}")

    def test_message_delivery(self):
        """Test 4: Message Delivery & Mailbox Status"""
        self.print_header("TEST 4: MESSAGE DELIVERY & MAILBOX STATUS")

        # Check for message delivery failures (404 errors)
        delivery_failures = self.count_log_occurrences(
            "position_monitor",
            "404: No registered address found"
        )

        if delivery_failures > 0:
            self.print_warning(
                f"Found {delivery_failures} message delivery failures (mailboxes not created)")
            self.print_info(
                "This is expected - mailboxes need to be created manually")
        else:
            self.print_success("No message delivery failures detected")

        # Check mailbox access token
        for agent_key in self.agents.keys():
            mailbox_token = self.check_log_for_pattern(
                agent_key,
                "Mailbox access token acquired",
                f"{self.agents[agent_key]['name']}: Mailbox token acquired"
            )

        # Check for successful message sends
        messages_sent = self.count_log_occurrences(
            "position_monitor", "ALERT SENT")

        # Check if Yield Optimizer received any messages
        messages_received_yield = self.count_log_occurrences(
            "yield_optimizer",
            "received"
        )

        self.test_results["message_flow"] = {
            "delivery_failures": delivery_failures,
            "messages_sent": messages_sent,
            "messages_received_yield": messages_received_yield
        }

        print(f"\n{Fore.CYAN}Message Flow Status:{Style.RESET_ALL}")
        print(f"  Messages sent by Position Monitor: {messages_sent}")
        print(
            f"  Messages received by Yield Optimizer: {messages_received_yield}")
        print(f"  Delivery failures (404): {delivery_failures}")

    def test_integration_points(self):
        """Test 5: Integration Points"""
        self.print_header("TEST 5: INTEGRATION POINTS")

        # Check Fusion+ mode in Swap Optimizer
        fusion_enabled = self.check_log_for_pattern(
            "swap_optimizer",
            "FUSION+ MODE ENABLED",
            "1inch Fusion+ integration enabled"
        )

        # Check 1inch API configuration
        oneinch_config = self.check_log_for_pattern(
            "swap_optimizer",
            "1inch Fusion+: Configured",
            "1inch Fusion+ configured"
        )

        # Check protocol data fetcher
        protocol_data = self.check_log_for_pattern(
            "yield_optimizer",
            "ProtocolDataFetcher initialized",
            "Protocol data fetcher initialized"
        )

        # Check price feed manager
        price_feed = self.check_log_for_pattern(
            "position_monitor",
            "PriceFeedManager initialized",
            "Price feed manager initialized"
        )

        passed = sum([fusion_enabled, oneinch_config,
                     protocol_data, price_feed])
        print(
            f"\n{Fore.CYAN}Integration Points: {passed}/4 tests passed{Style.RESET_ALL}")

    def display_final_summary(self):
        """Display comprehensive test summary"""
        self.print_header("FINAL TEST SUMMARY")

        print(
            f"{Fore.MAGENTA}{'Test Category':<30} {'Status':<20} {'Details'}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'─' * 70}{Style.RESET_ALL}")

        # Startup tests
        startup_results = self.test_results.get("startup", {})
        startup_passed = sum(
            1 for agent_results in startup_results.values()
            for test_result in [
                agent_results.get("http_endpoint", False),
                agent_results.get("almanac_mode", False),
                bool(agent_results.get("agent_address")),
                agent_results.get("almanac_api_success", False),
                agent_results.get("mailbox_client", False)
            ]
            if test_result
        )
        startup_total = len(startup_results) * 5

        if startup_passed == startup_total:
            print(f"{Fore.GREEN}{'Startup & Registration':<30} {'✅ PASSED':<20} {startup_passed}/{startup_total}{Style.RESET_ALL}")
        else:
            print(f"{Fore.YELLOW}{'Startup & Registration':<30} {'⚠️  PARTIAL':<20} {startup_passed}/{startup_total}{Style.RESET_ALL}")

        # Demo position
        demo_results = self.test_results.get("demo_position", {})
        demo_passed = sum(1 for v in demo_results.values() if v)
        demo_total = len(demo_results)

        if demo_passed == demo_total:
            print(
                f"{Fore.GREEN}{'Demo Position Creation':<30} {'✅ PASSED':<20} {demo_passed}/{demo_total}{Style.RESET_ALL}")
        else:
            print(f"{Fore.YELLOW}{'Demo Position Creation':<30} {'⚠️  PARTIAL':<20} {demo_passed}/{demo_total}{Style.RESET_ALL}")

        # Alert generation
        alert_results = self.test_results.get("alert_generation", {})
        alert_passed = sum(1 for k, v in alert_results.items()
                           if (isinstance(v, bool) and v) or (isinstance(v, int) and v > 0))
        alert_total = len(alert_results)

        if alert_passed >= alert_total - 1:  # Allow 1 failure
            print(
                f"{Fore.GREEN}{'Alert Generation':<30} {'✅ PASSED':<20} {alert_passed}/{alert_total}{Style.RESET_ALL}")
        else:
            print(
                f"{Fore.YELLOW}{'Alert Generation':<30} {'⚠️  PARTIAL':<20} {alert_passed}/{alert_total}{Style.RESET_ALL}")

        # Message flow
        msg_results = self.test_results.get("message_flow", {})
        messages_sent = msg_results.get("messages_sent", 0)
        delivery_failures = msg_results.get("delivery_failures", 0)

        if messages_sent > 0 and delivery_failures > 0:
            print(f"{Fore.YELLOW}{'Message Delivery':<30} {'⚠️  NEEDS MAILBOX':<20} Sent: {messages_sent}, Failed: {delivery_failures}{Style.RESET_ALL}")
        elif messages_sent > 0:
            print(
                f"{Fore.GREEN}{'Message Delivery':<30} {'✅ PASSED':<20} Sent: {messages_sent}{Style.RESET_ALL}")
        else:
            print(
                f"{Fore.RED}{'Message Delivery':<30} {'❌ FAILED':<20} No messages sent{Style.RESET_ALL}")

        print(f"\n{Fore.CYAN}{'═' * 70}{Style.RESET_ALL}")

        # Next steps
        if delivery_failures > 0:
            print(f"\n{Fore.YELLOW}⚠️  ACTION REQUIRED:{Style.RESET_ALL}")
            print(f"   Message delivery is failing because mailboxes are not created.")
            print(f"   Visit agent inspector links and create mailboxes:\n")

            for agent_key, agent_data in startup_results.items():
                agent_name = self.agents[agent_key]["name"]
                agent_address = agent_data.get("agent_address", "unknown")
                port = self.agents[agent_key]["port"]
                print(f"   {agent_name}:")
                print(
                    f"   https://agentverse.ai/inspect/?uri=http%3A//127.0.0.1%3A{port}&address={agent_address}\n")

    def run_all_tests(self):
        """Run complete test suite"""
        print(f"\n{Fore.MAGENTA}{'═' * 70}")
        print(f"{'🧪 LIQUIDITYGUARD AI - DEMO MODE TEST SUITE 🧪'.center(70)}")
        print(f"{'═' * 70}{Style.RESET_ALL}\n")

        print(f"{Fore.YELLOW}Starting comprehensive demo mode testing...")
        print(
            f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}\n")

        # Run tests
        self.test_startup_and_registration()
        time.sleep(2)

        self.test_demo_position_creation()
        time.sleep(2)

        self.test_alert_generation()
        time.sleep(2)

        self.test_message_delivery()
        time.sleep(2)

        self.test_integration_points()

        # Final summary
        self.display_final_summary()

        print(f"\n{Fore.YELLOW}Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}\n")


if __name__ == "__main__":
    tester = DemoTester()
    tester.run_all_tests()
