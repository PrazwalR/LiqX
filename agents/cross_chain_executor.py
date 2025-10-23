"""
Cross-Chain Executor Agent
Executes rebalancing transactions across chains with Fusion+ integration
"""

import os
import time
import asyncio
import json
from loguru import logger
from uagents import Agent, Context, Bureau
from uagents.setup import fund_agent_if_low
from agents.message_protocols import SwapRoute, ExecutionResult, HealthCheckRequest, HealthCheckResponse

# ═══════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════

AGENT_PORT = int(os.getenv('EXECUTOR_PORT', '8003'))
AGENT_SEED = os.getenv('AGENT_SEED_EXECUTOR', 'executor-seed-default')

# Deployment mode
DEPLOY_MODE = os.getenv('DEPLOY_MODE', 'local')  # 'local' or 'almanac'

# Operation modes
DEMO_MODE = os.getenv('DEMO_MODE', 'false').lower() == 'true'
PRESENTATION_MODE = os.getenv('PRESENTATION_MODE', 'false').lower() == 'true'
PRODUCTION_MODE = os.getenv('PRODUCTION_MODE', 'false').lower() == 'true'

# Position Monitor address (updated from config/agent_addresses.json)
POSITION_MONITOR_ADDRESS = "agent1qvvp0sl4xwj04jjheaqwl9na6n4ef8zqrv55qfw96jv2584ze0v6cehs64a"


# ═══════════════════════════════════════════════════════
# EXECUTOR AGENT
# ═══════════════════════════════════════════════════════

class CrossChainExecutor:
    """
    Executes rebalancing transactions with multi-step tracking

    Responsibilities:
    1. Receive SwapRoute from Swap Optimizer
    2. Execute multi-step transactions:
       - Withdraw from source protocol
       - Execute Fusion+ gasless swap
       - Deposit to target protocol
    3. Track execution progress
    4. Send ExecutionResult to Position Monitor
    """

    def __init__(self):
        # Initialize agent based on deployment mode
        if DEPLOY_MODE == 'almanac':
            # Almanac/Dorado deployment - use Agentverse mailbox
            self.agent = Agent(
                name="cross_chain_executor",
                seed=AGENT_SEED,
                port=AGENT_PORT,
                mailbox=True
            )
            logger.info(
                "Agent initialized in ALMANAC mode (Agentverse mailbox enabled)")
        else:
            # Local Bureau mode - use localhost endpoint
            self.agent = Agent(
                name="cross_chain_executor",
                seed=AGENT_SEED,
                port=AGENT_PORT,
                endpoint=[f"http://localhost:{AGENT_PORT}/submit"]
            )
            logger.info("Agent initialized in LOCAL mode (Bureau)")

        # Metrics
        self.start_time = time.time()
        self.executions_total = 0
        self.executions_success = 0
        self.executions_failed = 0

        # Setup handlers
        self._setup_handlers()

        logger.info(f"Cross-Chain Executor Agent initialized")
        logger.info(f"Agent address: {self.agent.address}")
        logger.info(f"Port: {AGENT_PORT}")

    def _setup_handlers(self):
        """Setup all message handlers"""

        @self.agent.on_event("startup")
        async def startup(ctx: Context):
            """Agent startup event"""
            logger.info("🚀 Cross-Chain Executor Agent starting...")
            logger.info(f"Agent address: {ctx.agent.address}")
            logger.info(f"Demo mode: {DEMO_MODE}")
            logger.success("✅ Cross-Chain Executor Agent ready!")

        @self.agent.on_message(model=SwapRoute)
        async def handle_swap_route(ctx: Context, sender: str, msg: SwapRoute):
            """Handle swap route from Swap Optimizer"""
            logger.warning("⚠️  SWAP ROUTE RECEIVED")
            logger.info(f"   Route ID: {msg.route_id}")
            logger.info(f"   From: {msg.from_token}")
            logger.info(f"   To: {msg.to_token}")
            logger.info(f"   Amount: ${msg.amount:.2f}")

            self.executions_total += 1

            # Parse transaction data
            try:
                tx_data = eval(msg.transaction_data) if isinstance(
                    msg.transaction_data, str) else msg.transaction_data

                logger.info(f"   Type: {tx_data.get('type', 'unknown')}")
                logger.info(f"   Gasless: {tx_data.get('gasless', False)}")
                logger.info(
                    f"   MEV Protected: {tx_data.get('mev_protected', False)}")

                # Execute transaction
                success = await self._execute_transaction(ctx, msg.route_id, tx_data)

                if success:
                    self.executions_success += 1
                    status = "success"
                    logger.success(f"✅ Execution successful: {msg.route_id}")
                else:
                    self.executions_failed += 1
                    status = "failed"
                    logger.error(f"❌ Execution failed: {msg.route_id}")

                # Send result back to Position Monitor
                result = ExecutionResult(
                    execution_id=msg.route_id,
                    status=status
                )

                await ctx.send(POSITION_MONITOR_ADDRESS, result)
                logger.info(f"   → Sent ExecutionResult to Position Monitor")

            except Exception as e:
                logger.error(f"Error executing route: {e}")
                self.executions_failed += 1

                # Send failure result
                result = ExecutionResult(
                    execution_id=msg.route_id,
                    status="failed"
                )
                await ctx.send(POSITION_MONITOR_ADDRESS, result)

        @self.agent.on_message(model=HealthCheckRequest)
        async def handle_health_check(ctx: Context, sender: str, msg: HealthCheckRequest):
            """Handle health check requests"""
            uptime = time.time() - self.start_time

            response = HealthCheckResponse(
                agent_name="cross_chain_executor",
                status="healthy",
                uptime=uptime,
                messages_processed=self.executions_total,
                timestamp=int(time.time())
            )

            await ctx.send(sender, response)
            logger.debug(f"Health check response sent to {sender[:10]}...")

    async def _execute_transaction(
        self,
        ctx: Context,
        route_id: str,
        tx_data: dict
    ) -> bool:
        """
        Execute multi-step transaction

        Returns:
            bool: True if successful, False otherwise
        """
        logger.info("🔄 Starting multi-step execution...")

        route_steps = tx_data.get('route_steps', [])

        if DEMO_MODE:
            logger.info("[DEMO] Simulating transaction execution")

            # Simulate each step
            for i, step in enumerate(route_steps, 1):
                action = step.get('action', 'unknown')
                protocol = step.get('protocol', step.get('dex', 'unknown'))
                amount = step.get('amount', 0)

                logger.info(
                    f"   Step {i}/{len(route_steps)}: {action.upper()}")
                logger.info(f"      Protocol: {protocol}")
                logger.info(f"      Amount: ${amount:.2f}")

                if action == 'withdraw':
                    logger.info(
                        f"      ✅ Simulated withdrawal from {protocol}")
                    await asyncio.sleep(0.5)  # Simulate transaction time

                elif action == 'fusion_swap':
                    logger.info(f"      ✅ Simulated Fusion+ gasless swap")
                    logger.info(f"      ⛽ Gas paid by: Resolvers (Gasless!)")
                    logger.info(
                        f"      🛡️  MEV Protection: Active (Dutch auction)")
                    await asyncio.sleep(1.0)  # Swap takes longer

                elif action == 'bridge':
                    via = step.get('via', 'unknown')
                    logger.info(
                        f"      ✅ Simulated cross-chain bridge via {via}")
                    await asyncio.sleep(1.5)  # Bridge takes longest

                elif action == 'deposit':
                    logger.info(f"      ✅ Simulated deposit to {protocol}")
                    await asyncio.sleep(0.5)

                else:
                    logger.warning(f"      ⚠️  Unknown action: {action}")

            logger.success("✅ All steps completed successfully (simulated)")
            return True

        else:
            # Real execution would go here
            logger.warning(
                "Real execution not implemented yet - use DEMO_MODE=true")
            return False

    def run(self):
        """Run the agent"""
        logger.info("=" * 60)
        logger.info("Cross-Chain Executor Agent - LiquidityGuard AI")
        logger.info("🔄 MULTI-STEP TRANSACTION EXECUTION")
        logger.info("=" * 60)
        logger.info(f"Agent Address: {self.agent.address}")
        logger.info(f"Port: {AGENT_PORT}")
        logger.info(f"Demo Mode: {DEMO_MODE}")
        logger.info(f"Position Monitor: {POSITION_MONITOR_ADDRESS[:10]}...")
        logger.info("=" * 60)
        self.agent.run()


# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════

if __name__ == "__main__":
    executor = CrossChainExecutor()
    executor.run()
