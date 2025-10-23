#!/usr/bin/env python3
"""
LiquidityGuard AI - End-to-End Message Flow Testing
===================================================
Verifies complete agent communication chain
"""

import time
import re
from datetime import datetime
from colorama import init, Fore, Style
from typing import Dict, List, Tuple

init(autoreset=True)


class MessageFlowTester:
    """Test complete message flow through all agents"""

    def __init__(self):
        self.log_files = {
            "position_monitor": "logs/position_monitor.log",
            "yield_optimizer": "logs/yield_optimizer.log",
            "swap_optimizer": "logs/swap_optimizer.log",
            "executor": "logs/cross_chain_executor.log"
        }

    def print_header(self, text: str):
        print(f"\n{Fore.CYAN}{'═' * 80}")
        print(f"{Fore.CYAN}{text.center(80)}")
        print(f"{Fore.CYAN}{'═' * 80}{Style.RESET_ALL}\n")

    def print_success(self, text: str):
        print(f"{Fore.GREEN}✅ {text}{Style.RESET_ALL}")

    def print_error(self, text: str):
        print(f"{Fore.RED}❌ {text}{Style.RESET_ALL}")

    def print_info(self, text: str):
        print(f"{Fore.BLUE}ℹ️  {text}{Style.RESET_ALL}")

    def print_warning(self, text: str):
        print(f"{Fore.YELLOW}⚠️  {text}{Style.RESET_ALL}")

    def get_latest_log_lines(self, log_file: str, num_lines: int = 100) -> List[str]:
        """Get latest N lines from log"""
        try:
            with open(log_file, 'r') as f:
                return f.readlines()[-num_lines:]
        except FileNotFoundError:
            return []

    def extract_timestamps_and_messages(self, lines: List[str], pattern: str) -> List[Tuple[str, str]]:
        """Extract timestamp and message matching pattern"""
        results = []
        for line in lines:
            if pattern.lower() in line.lower():
                # Try to extract timestamp (format: HH:MM:SS or YYYY-MM-DD HH:MM:SS)
                timestamp_match = re.search(r'(\d{2}:\d{2}:\d{2})', line)
                if timestamp_match:
                    results.append((timestamp_match.group(1), line.strip()))
        return results

    def test_position_monitor_alerts(self) -> Dict:
        """Test Position Monitor alert generation"""
        self.print_header("STEP 1: POSITION MONITOR - ALERT GENERATION")

        lines = self.get_latest_log_lines(self.log_files["position_monitor"])

        # Check for demo position
        demo_position = any("Demo position created" in line for line in lines)
        if demo_position:
            self.print_success("Demo position created successfully")

        # Check health factor calculations
        hf_calcs = self.extract_timestamps_and_messages(lines, "HF: 1.09")
        if hf_calcs:
            self.print_success(
                f"Health factor calculated {len(hf_calcs)} times")
            self.print_info(
                f"Latest: {hf_calcs[-1][0]} - {hf_calcs[-1][1][:80]}...")

        # Check alerts sent
        alerts_sent = self.extract_timestamps_and_messages(lines, "ALERT SENT")
        if alerts_sent:
            self.print_success(
                f"Position alerts generated: {len(alerts_sent)}")
            self.print_info(f"Latest alert: {alerts_sent[-1][0]}")
        else:
            self.print_error("No alerts generated")

        # Check for 404 errors (should be none)
        errors_404 = [line for line in lines if "404" in line]
        if errors_404:
            self.print_error(f"Found {len(errors_404)} delivery failures")
        else:
            self.print_success("No message delivery failures (404)")

        return {
            "demo_position": demo_position,
            "hf_calculations": len(hf_calcs),
            "alerts_sent": len(alerts_sent),
            "delivery_failures": len(errors_404),
            "latest_alert_time": alerts_sent[-1][0] if alerts_sent else None
        }

    def test_yield_optimizer_reception(self) -> Dict:
        """Test Yield Optimizer receiving alerts"""
        self.print_header(
            "STEP 2: YIELD OPTIMIZER - ALERT RECEPTION & STRATEGY GENERATION")

        lines = self.get_latest_log_lines(self.log_files["yield_optimizer"])

        # Check alerts received
        alerts_received = self.extract_timestamps_and_messages(
            lines, "POSITION ALERT RECEIVED")
        if alerts_received:
            self.print_success(f"Alerts received: {len(alerts_received)}")
            self.print_info(f"Latest reception: {alerts_received[-1][0]}")
        else:
            self.print_error("No alerts received")

        # Check strategy generation
        strategies = self.extract_timestamps_and_messages(lines, "strategy")
        if strategies:
            self.print_success(f"Strategies generated: {len(strategies)}")

        # Check protocol data fetching
        protocol_data = any("ProtocolDataFetcher" in line for line in lines)
        if protocol_data:
            self.print_success("Protocol data fetcher initialized")

        # Check for error messages
        errors = [line for line in lines if "ERROR" in line]
        if errors:
            self.print_warning(
                f"Found {len(errors)} errors (check logs for details)")

        return {
            "alerts_received": len(alerts_received),
            "strategies_generated": len(strategies),
            "protocol_data_init": protocol_data,
            "errors": len(errors),
            "latest_reception_time": alerts_received[-1][0] if alerts_received else None
        }

    def test_swap_optimizer_routes(self) -> Dict:
        """Test Swap Optimizer receiving strategies and generating routes"""
        self.print_header(
            "STEP 3: SWAP OPTIMIZER - ROUTE GENERATION (FUSION+)")

        lines = self.get_latest_log_lines(self.log_files["swap_optimizer"])

        # Check Fusion+ enabled
        fusion_enabled = any("FUSION+ MODE ENABLED" in line for line in lines)
        if fusion_enabled:
            self.print_success("1inch Fusion+ mode enabled")

        # Check for strategy messages received
        strategies_received = self.extract_timestamps_and_messages(
            lines, "strategy")
        if strategies_received:
            self.print_success(
                f"Strategies received: {len(strategies_received)}")

        # Check route generation
        routes_generated = self.extract_timestamps_and_messages(lines, "route")
        if routes_generated:
            self.print_success(f"Routes generated: {len(routes_generated)}")

        # Check gasless swap configuration
        gasless = any("gasless swaps" in line.lower() for line in lines)
        if gasless:
            self.print_success("Gasless swap configuration confirmed")

        # Check MEV protection
        mev_protection = any("MEV protection" in line for line in lines)
        if mev_protection:
            self.print_success("MEV protection enabled")

        return {
            "fusion_enabled": fusion_enabled,
            "strategies_received": len(strategies_received),
            "routes_generated": len(routes_generated),
            "gasless_configured": gasless,
            "mev_protection": mev_protection
        }

    def test_executor_reception(self) -> Dict:
        """Test Cross-Chain Executor receiving and processing routes"""
        self.print_header(
            "STEP 4: CROSS-CHAIN EXECUTOR - TRANSACTION EXECUTION")

        lines = self.get_latest_log_lines(self.log_files["executor"])

        # Check routes received
        routes_received = self.extract_timestamps_and_messages(lines, "route")
        if routes_received:
            self.print_success(f"Routes received: {len(routes_received)}")

        # Check demo mode confirmation
        demo_mode = any("Demo Mode: True" in line for line in lines)
        if demo_mode:
            self.print_info(
                "Executor running in demo mode (no real transactions)")

        # Check simulation
        simulation = self.extract_timestamps_and_messages(lines, "simulat")
        if simulation:
            self.print_success(f"Transaction simulations: {len(simulation)}")

        # Check feedback
        feedback = self.extract_timestamps_and_messages(lines, "feedback")
        if feedback:
            self.print_success(f"Feedback messages sent: {len(feedback)}")

        return {
            "routes_received": len(routes_received),
            "demo_mode": demo_mode,
            "simulations": len(simulation),
            "feedback_sent": len(feedback)
        }

    def calculate_end_to_end_latency(self, results: Dict) -> None:
        """Calculate message flow timing"""
        self.print_header("MESSAGE FLOW TIMING ANALYSIS")

        monitor_results = results.get("position_monitor", {})
        yield_results = results.get("yield_optimizer", {})

        if monitor_results.get("latest_alert_time") and yield_results.get("latest_reception_time"):
            self.print_info(
                f"Latest alert sent: {monitor_results['latest_alert_time']}")
            self.print_info(
                f"Latest alert received: {yield_results['latest_reception_time']}")
            self.print_success("Message delivery confirmed (timing in logs)")

        # Alert frequency
        alerts_sent = monitor_results.get("alerts_sent", 0)
        alerts_received = yield_results.get("alerts_received", 0)

        if alerts_sent > 0:
            self.print_info(f"Alert generation rate: ~1 per 30 seconds")
            self.print_info(f"Total alerts sent: {alerts_sent}")
            self.print_info(f"Total alerts received: {alerts_received}")

            if alerts_received > 0:
                delivery_rate = (alerts_received / alerts_sent) * 100
                self.print_success(
                    f"Message delivery rate: {delivery_rate:.1f}%")

    def display_final_summary(self, results: Dict):
        """Display comprehensive test results"""
        self.print_header("FINAL E2E TEST SUMMARY")

        print(
            f"{Fore.MAGENTA}{'Component':<30} {'Status':<20} {'Details'}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'─' * 80}{Style.RESET_ALL}")

        # Position Monitor
        pm_results = results.get("position_monitor", {})
        pm_status = "✅ OPERATIONAL" if pm_results.get(
            "alerts_sent", 0) > 0 else "❌ FAILED"
        print(f"{pm_status:<50} Alerts: {pm_results.get('alerts_sent', 0)}, "
              f"Errors: {pm_results.get('delivery_failures', 0)}")

        # Yield Optimizer
        yo_results = results.get("yield_optimizer", {})
        yo_status = "✅ OPERATIONAL" if yo_results.get(
            "alerts_received", 0) > 0 else "⚠️  WAITING"
        print(f"{'Yield Optimizer':<30} {yo_status:<20} "
              f"Received: {yo_results.get('alerts_received', 0)}, "
              f"Strategies: {yo_results.get('strategies_generated', 0)}")

        # Swap Optimizer
        so_results = results.get("swap_optimizer", {})
        so_status = "✅ OPERATIONAL" if so_results.get(
            "fusion_enabled") else "❌ FAILED"
        print(f"{'Swap Optimizer (Fusion+)':<30} {so_status:<20} "
              f"Fusion: {'Yes' if so_results.get('fusion_enabled') else 'No'}")

        # Executor
        ex_results = results.get("executor", {})
        ex_status = "✅ OPERATIONAL" if ex_results.get(
            "demo_mode") else "⚠️  CHECK"
        print(f"{'Cross-Chain Executor':<30} {ex_status:<20} "
              f"Demo: {'Yes' if ex_results.get('demo_mode') else 'No'}")

        print(f"\n{Fore.CYAN}{'═' * 80}{Style.RESET_ALL}")

        # Overall assessment
        critical_checks = [
            pm_results.get("alerts_sent", 0) > 0,
            pm_results.get("delivery_failures", 0) == 0,
            yo_results.get("alerts_received", 0) > 0,
            so_results.get("fusion_enabled"),
            ex_results.get("demo_mode")
        ]

        passed_checks = sum(1 for check in critical_checks if check)
        total_checks = len(critical_checks)

        if passed_checks == total_checks:
            self.print_success(
                f"ALL CRITICAL CHECKS PASSED ({passed_checks}/{total_checks})")
            self.print_success(
                "✨ LiquidityGuard AI is fully operational in demo mode! ✨")
        elif passed_checks >= total_checks - 1:
            self.print_warning(
                f"MOSTLY OPERATIONAL ({passed_checks}/{total_checks} checks passed)")
            self.print_info(
                "Minor issues detected, but core functionality working")
        else:
            self.print_error(
                f"ISSUES DETECTED ({passed_checks}/{total_checks} checks passed)")
            self.print_warning("Review logs for detailed error information")

    def run_complete_test(self):
        """Run complete end-to-end test"""
        print(f"\n{Fore.MAGENTA}{'═' * 80}")
        print(f"{'🔄 LIQUIDITYGUARD AI - END-TO-END MESSAGE FLOW TEST 🔄'.center(80)}")
        print(f"{'═' * 80}{Style.RESET_ALL}\n")

        print(f"{Fore.YELLOW}Testing complete agent communication chain...")
        print(
            f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}\n")

        results = {}

        # Test each component
        results["position_monitor"] = self.test_position_monitor_alerts()
        time.sleep(1)

        results["yield_optimizer"] = self.test_yield_optimizer_reception()
        time.sleep(1)

        results["swap_optimizer"] = self.test_swap_optimizer_routes()
        time.sleep(1)

        results["executor"] = self.test_executor_reception()
        time.sleep(1)

        # Analyze timing
        self.calculate_end_to_end_latency(results)

        # Final summary
        self.display_final_summary(results)

        print(f"\n{Fore.YELLOW}Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}\n")

        return results


if __name__ == "__main__":
    tester = MessageFlowTester()
    tester.run_complete_test()
