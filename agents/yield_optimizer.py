"""
LiquidityGuard AI - Yield Optimizer Agent

Analyzes position alerts and calculates optimal rebalancing strategies.

Features:
- Receives position alerts
- Queries protocol APYs
- Calculates optimal yield strategies
- Sends rebalancing instructions
- Demo mode support
"""

from agents.message_protocols import (
    PositionAlert,
    RebalanceStrategy,
    RebalanceStep,
    HealthCheckRequest,
    HealthCheckResponse
)
from agents.metta_reasoner import get_metta_reasoner
from data.price_feeds import get_price_feed_manager
from data.protocol_data import get_protocol_data_fetcher
from uagents import Agent, Context
import os
import time
import uuid
from typing import Dict, List, Optional
from dotenv import load_dotenv
from loguru import logger

# Import data fetchers
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


load_dotenv()


# ═══════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════

AGENT_SEED = os.getenv('AGENT_SEED_YIELD_OPTIMIZER', 'optimizer-seed-default')
AGENT_PORT = int(os.getenv('YIELD_OPTIMIZER_PORT', '8001'))
SWAP_OPTIMIZER_ADDRESS = None  # Will be set after registration
EXECUTOR_ADDRESS = None  # Will be set after registration

# Deployment mode
DEPLOY_MODE = os.getenv('DEPLOY_MODE', 'local')  # 'local' or 'almanac'

# Strategy parameters
MIN_APY_IMPROVEMENT = 1.0  # Minimum 1% APY improvement to trigger
MIN_AMOUNT_USD = 1000.0  # Minimum $1000 to move
GAS_COST_ESTIMATE = 50.0  # Estimated gas cost in USD
BRIDGE_FEE_ESTIMATE = 15.0  # Estimated bridge fee in USD

# Operation modes
DEMO_MODE = os.getenv('DEMO_MODE', 'false').lower() == 'true'
PRESENTATION_MODE = os.getenv('PRESENTATION_MODE', 'false').lower() == 'true'
PRODUCTION_MODE = os.getenv('PRODUCTION_MODE', 'false').lower() == 'true'


# ═══════════════════════════════════════════════════════
# YIELD OPTIMIZER AGENT
# ═══════════════════════════════════════════════════════

class YieldOptimizerAgent:
    """Yield Optimizer Agent Implementation"""

    # Agent Addresses (updated from config/agent_addresses.json)
    POSITION_MONITOR_ADDRESS = "agent1qvvp0sl4xwj04jjheaqwl9na6n4ef8zqrv55qfw96jv2584ze0v6cehs64a"
    SWAP_OPTIMIZER_ADDRESS = "agent1q2d8jkuhml92c38ja5hs237g00y4h7v7s5f0q05c5m5uzu6kqnj0qq2t4xm"

    def __init__(self):
        # Initialize agent based on deployment mode
        if DEPLOY_MODE == 'almanac':
            # Almanac/Dorado deployment - use Agentverse mailbox
            self.agent = Agent(
                name="yield_optimizer",
                seed=AGENT_SEED,
                port=AGENT_PORT,
                mailbox=True
            )
            logger.info(
                "Agent initialized in ALMANAC mode (Agentverse mailbox enabled)")
        else:
            # Local Bureau mode - use localhost endpoint
            self.agent = Agent(
                name="yield_optimizer",
                seed=AGENT_SEED,
                port=AGENT_PORT,
                endpoint=[f"http://localhost:{AGENT_PORT}/submit"]
            )
            logger.info("Agent initialized in LOCAL mode (Bureau)")

        # State
        self.protocol_fetcher = get_protocol_data_fetcher()
        self.price_manager = get_price_feed_manager()
        self.metta_reasoner = get_metta_reasoner()
        self.active_strategies: Dict[str, Dict] = {}
        self.start_time = time.time()
        self.messages_processed = 0
        self.errors_count = 0

        # Setup message handlers
        self._setup_handlers()

        logger.info(f"Yield Optimizer Agent initialized")
        logger.info(f"Agent address: {self.agent.address}")
        logger.info(f"Port: {AGENT_PORT}")

    def _setup_handlers(self):
        """Setup all message handlers"""

        @self.agent.on_event("startup")
        async def startup(ctx: Context):
            """Agent startup event"""
            logger.info("🚀 Yield Optimizer Agent starting...")
            logger.info(f"Agent address: {ctx.agent.address}")
            logger.info(f"Agent name: {ctx.agent.name}")

            # Fund agent if needed (testnet)

            logger.success("✅ Yield Optimizer Agent ready!")

        @self.agent.on_message(model=PositionAlert)
        async def handle_position_alert(ctx: Context, sender: str, msg: PositionAlert):
            """Handle position alert from Position Monitor"""
            logger.warning(f"⚠️  POSITION ALERT RECEIVED")
            logger.info(f"   User: {msg.user_address[:10]}...")
            logger.info(f"   Protocol: {msg.protocol} ({msg.chain})")
            logger.info(f"   Health Factor: {msg.health_factor:.2f}")
            logger.info(f"   Risk Level: {msg.risk_level.upper()}")
            logger.info(f"   Collateral: ${msg.collateral_value:.2f}")
            logger.info(f"   Debt: ${msg.debt_value:.2f}")

            try:
                # Calculate optimal strategy
                strategy = await self._calculate_strategy(ctx, msg)

                if strategy:
                    # Store active strategy
                    self.active_strategies[strategy.strategy_id] = {
                        "alert": msg,
                        "strategy": strategy,
                        "created_at": time.time()
                    }

                    # Send to executors
                    await self._send_strategy(ctx, strategy)

                    self.messages_processed += 1
                else:
                    logger.warning("No profitable strategy found")

            except Exception as e:
                logger.error(f"Error handling alert: {e}")
                self.errors_count += 1

        @self.agent.on_message(model=HealthCheckRequest)
        async def handle_health_check(ctx: Context, sender: str, msg: HealthCheckRequest):
            """Respond to health check requests"""
            uptime = int(time.time() - self.start_time)

            response = HealthCheckResponse(
                agent_name="yield_optimizer",
                status="healthy" if self.errors_count < 10 else "degraded",
                uptime_seconds=uptime,
                messages_processed=self.messages_processed,
                last_activity=int(time.time()),
                errors_count=self.errors_count,
                timestamp=int(time.time())
            )

            await ctx.send(sender, response)
            logger.debug(f"📋 Health check response sent to {sender}")

    async def _calculate_strategy(
        self,
        ctx: Context,
        alert: PositionAlert
    ) -> Optional[RebalanceStrategy]:
        """Calculate optimal rebalancing strategy"""
        logger.info("🧮 Calculating optimal strategy...")

        # 1. Get current APY
        current_apy = await self.protocol_fetcher.get_protocol_apy(
            alert.protocol,
            alert.chain,
            alert.collateral_token
        )

        if not current_apy:
            logger.warning(f"Failed to get current APY for {alert.protocol}")
            current_apy = 5.0  # Default fallback

        logger.info(f"   Current APY: {current_apy:.2f}%")

        # 2. Find best alternative yield
        best_yield = await self.protocol_fetcher.find_best_yield(
            alert.collateral_token,
            exclude_protocols=[alert.protocol]
        )

        if not best_yield:
            logger.warning("No alternative yields found")
            return None

        logger.info(
            f"   Best Alternative: {best_yield['protocol']} ({best_yield['chain']})")
        logger.info(f"   Alternative APY: {best_yield['apy']:.2f}%")

        # 3. Calculate profitability
        apy_improvement = best_yield['apy'] - current_apy

        if apy_improvement < MIN_APY_IMPROVEMENT:
            logger.info(
                f"   APY improvement ({apy_improvement:.2f}%) below minimum ({MIN_APY_IMPROVEMENT:.2f}%)")
            return None

        # Calculate annual extra yield
        annual_extra = (alert.collateral_value * apy_improvement) / 100

        # Estimate costs
        total_cost = GAS_COST_ESTIMATE
        if alert.chain != best_yield['chain']:
            total_cost += BRIDGE_FEE_ESTIMATE

        # Check if profitable (ROI > 3 months)
        # BUT: If health factor is critical, prioritize safety over profitability
        months_to_break_even = (total_cost * 12) / \
            annual_extra if annual_extra > 0 else 999

        # Relaxed threshold for risky positions
        max_break_even_months = 6 if alert.health_factor < 1.4 else 3

        if months_to_break_even > max_break_even_months:
            logger.info(
                f"   Break-even: {months_to_break_even:.1f} months (max: {max_break_even_months} for HF {alert.health_factor:.2f})")
            return None

        logger.success(f"✅ Profitable strategy found!")
        logger.info(f"   APY Improvement: +{apy_improvement:.2f}%")
        logger.info(f"   Annual Extra: ${annual_extra:.2f}")
        logger.info(f"   Total Cost: ${total_cost:.2f}")
        logger.info(f"   Break-even: {months_to_break_even:.1f} months")

        # Use MeTTa AI for intelligent strategy selection
        available_strategies = [{
            "protocol": best_yield['protocol'],
            "chain": best_yield['chain'],
            "apy": best_yield['apy'],
            "cost": total_cost
        }]

        metta_strategy = self.metta_reasoner.select_optimal_strategy(
            current_protocol=alert.protocol,
            current_chain=alert.chain,
            current_apy=current_apy,
            amount=alert.collateral_value,
            risk_level=alert.risk_level,
            urgency=6 if alert.health_factor < 1.4 else 4,
            market_trend="stable",
            available_strategies=available_strategies
        )

        logger.info(
            f"   🧠 MeTTa Score: {metta_strategy.get('strategy_score', 0)}/100")
        logger.info(
            f"   🧠 MeTTa Method: {metta_strategy.get('execution_method', 'direct_swap')}")

        # 4. Build strategy
        strategy = await self._build_strategy(alert, best_yield, apy_improvement, total_cost, metta_strategy)

        return strategy

    async def _build_strategy(
        self,
        alert: PositionAlert,
        target_yield: Dict,
        apy_improvement: float,
        estimated_cost: float,
        metta_strategy: Dict = None
    ) -> RebalanceStrategy:
        """Build detailed rebalancing strategy"""
        strategy_id = str(uuid.uuid4())

        # Determine execution method
        same_chain = (alert.chain == target_yield['chain'])
        execution_method = "direct_swap" if same_chain else "layerzero_pyusd"

        # Determine priority
        if alert.health_factor < 1.3:
            priority = "emergency"
        elif alert.health_factor < 1.5:
            priority = "high"
        else:
            priority = "normal"

        # Build execution steps
        steps = []
        step_num = 1

        # Step 1: Withdraw from current protocol
        steps.append(RebalanceStep(
            step=step_num,
            action="withdraw",
            token=alert.collateral_token,
            amount=str(alert.collateral_value),
            from_chain=alert.chain
        ))
        step_num += 1

        # Step 2: Swap if needed (to PYUSD for bridging)
        if not same_chain:
            steps.append(RebalanceStep(
                step=step_num,
                action="swap",
                from_token=alert.collateral_token,
                to_token="PYUSD",
                via="1inch",
                from_chain=alert.chain
            ))
            step_num += 1

            # Step 3: Bridge via LayerZero
            steps.append(RebalanceStep(
                step=step_num,
                action="bridge",
                token="PYUSD",
                from_chain=alert.chain,
                to_chain=target_yield['chain'],
                via="layerzero"
            ))
            step_num += 1

            # Step 4: Swap back to target token
            steps.append(RebalanceStep(
                step=step_num,
                action="swap",
                from_token="PYUSD",
                to_token=target_yield['token'],
                via="jupiter" if target_yield['chain'] == "solana" else "1inch",
                from_chain=target_yield['chain']
            ))
            step_num += 1

        # Final step: Supply to target protocol
        steps.append(RebalanceStep(
            step=step_num,
            action="supply",
            token=target_yield['token'],
            amount="calculated",
            via=target_yield['protocol'],
            from_chain=target_yield['chain']
        ))

        # Create strategy message
        strategy = RebalanceStrategy(
            strategy_id=strategy_id,
            user_address=alert.user_address,
            position_id=alert.position_id,
            source_chain=alert.chain,
            target_chain=target_yield['chain'],
            source_protocol=alert.protocol,
            target_protocol=target_yield['protocol'],
            amount_to_move=alert.collateral_value,
            expected_apy_improvement=apy_improvement,
            execution_method=execution_method,
            estimated_gas_cost=estimated_cost,
            estimated_time=300 if same_chain else 600,  # 5 min or 10 min
            priority=priority,
            steps=steps,
            reason=(
                f"Moving from {alert.protocol} ({alert.chain}) to "
                f"{target_yield['protocol']} ({target_yield['chain']}) "
                f"for +{apy_improvement:.2f}% APY improvement. "
                f"Health factor: {alert.health_factor:.2f}"
            )
        )

        return strategy

    async def _send_strategy(self, ctx: Context, strategy: RebalanceStrategy):
        """Send strategy to executor and swap optimizer"""
        logger.info(f"📤 Sending strategy {strategy.strategy_id[:8]}...")

        # Send to swap optimizer (use agent address from agent registry)
        # In Bureau mode, agents can find each other by address
        swap_optimizer_addr = ctx.storage.get(
            "swap_optimizer_address") or self.SWAP_OPTIMIZER_ADDRESS

        if swap_optimizer_addr:
            await ctx.send(swap_optimizer_addr, strategy)
            logger.info(
                f"   → Sent to Swap Optimizer ({swap_optimizer_addr[:10]}...)")
        else:
            logger.warning("   ⚠️  Swap Optimizer address not set")

        # Send to executor
        executor_addr = ctx.storage.get("executor_address")
        if executor_addr:
            await ctx.send(executor_addr, strategy)
            logger.info(f"   → Sent to Executor")
        else:
            logger.debug("   ℹ️  Executor not yet available (to be built)")

        logger.success(f"✅ Strategy sent successfully")

    def run(self):
        """Run the agent"""
        logger.info("Starting Yield Optimizer Agent...")
        self.agent.run()


# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════

def main():
    """Main entry point"""
    # Setup logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        colorize=True,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>YieldOptimizer</cyan> | <level>{message}</level>",
        level=os.getenv('LOG_LEVEL', 'INFO')
    )

    # Add file logging
    logger.add(
        "logs/yield_optimizer.log",
        rotation="10 MB",
        retention="7 days",
        level="DEBUG"
    )

    # Create and run agent
    agent = YieldOptimizerAgent()

    # Print agent info
    logger.info("="*60)
    logger.info("Yield Optimizer Agent - LiquidityGuard AI")
    logger.info("="*60)
    logger.info(f"Agent Address: {agent.agent.address}")
    logger.info(f"Port: {AGENT_PORT}")
    logger.info(f"Min APY Improvement: {MIN_APY_IMPROVEMENT}%")
    logger.info(f"Min Amount: ${MIN_AMOUNT_USD}")
    logger.info("="*60)

    # Run agent
    agent.run()


if __name__ == "__main__":
    main()
