"""
LiquidityGuard AI - Position Monitor Agent

Monitors DeFi positions for liquidation risks and sends alerts.

Features:
- Real-time position monitoring
- Health factor calculation
- Risk level assessment
- Alert generation
- Demo mode support
"""

from agents.message_protocols import (
    PositionAlert,
    DemoMarketCrash,
    DemoPriceUpdate,
    ExecutionResult,
    HealthCheckRequest,
    HealthCheckResponse,
    PresentationTrigger  # NEW: For presentation mode
)
from agents.metta_reasoner import get_metta_reasoner
from data.price_feeds import get_price_feed_manager
from data.subgraph_fetcher import get_subgraph_fetcher
from data.sepolia_tokens import get_token_symbol
from uagents import Agent, Context, Model
import os
import time
import asyncio
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

AGENT_SEED = os.getenv('AGENT_SEED_POSITION_MONITOR', 'monitor-seed-default')
AGENT_PORT = int(os.getenv('POSITION_MONITOR_PORT', '8000'))
YIELD_OPTIMIZER_ADDRESS = None  # Will be set after agent registration

# Deployment mode
DEPLOY_MODE = os.getenv('DEPLOY_MODE', 'local')  # 'local' or 'almanac'

# Risk thresholds
CRITICAL_HF = float(os.getenv('CRITICAL_HEALTH_FACTOR', '1.3'))
MODERATE_HF = float(os.getenv('MODERATE_HEALTH_FACTOR', '1.5'))
SAFE_HF = float(os.getenv('SAFE_HEALTH_FACTOR', '1.8'))

# Operation modes
DEMO_MODE = os.getenv('DEMO_MODE', 'false').lower() == 'true'
PRESENTATION_MODE = os.getenv('PRESENTATION_MODE', 'false').lower() == 'true'
PRODUCTION_MODE = os.getenv('PRODUCTION_MODE', 'false').lower() == 'true'

# Presentation mode settings
PRESENTATION_TRIGGER_SECRET = os.getenv(
    'PRESENTATION_TRIGGER_SECRET', 'liqx_demo_2025')


# ═══════════════════════════════════════════════════════
# POSITION MONITOR AGENT
# ═══════════════════════════════════════════════════════

class PositionMonitorAgent:
    """Position Monitor Agent Implementation"""

    # Yield Optimizer Address (deterministic from seed)
    YIELD_OPTIMIZER_ADDRESS = "agent1q0rtan6yrc6dgv62rlhtj2fn5na0zv4k8mj47ylw8luzyg6c0xxpspk9706"
    # For local testing: use direct endpoint instead of Almanac resolution
    YIELD_OPTIMIZER_ENDPOINT = "http://localhost:8001/submit"

    def __init__(self):
        # Initialize agent based on deployment mode
        if DEPLOY_MODE == 'almanac':
            # Almanac/Dorado deployment - use Agentverse mailbox
            self.agent = Agent(
                name="position_monitor",
                seed=AGENT_SEED,
                port=AGENT_PORT,
                mailbox=True  # Enable mailbox for remote communication
            )
            logger.info(
                "Agent initialized in ALMANAC mode (Agentverse mailbox enabled)")
        else:
            # Local Bureau mode - use localhost endpoint
            self.agent = Agent(
                name="position_monitor",
                seed=AGENT_SEED,
                port=AGENT_PORT,
                endpoint=[f"http://localhost:{AGENT_PORT}/submit"]
            )
            logger.info("Agent initialized in LOCAL mode (Bureau)")

        # State
        self.positions: Dict[str, Dict] = {}
        self.price_manager = get_price_feed_manager()
        self.subgraph_fetcher = get_subgraph_fetcher()
        self.metta_reasoner = get_metta_reasoner()
        self.demo_crash_active = False
        self.demo_crash_id = None
        self.start_time = time.time()
        self.messages_processed = 0
        self.errors_count = 0
        self.last_subgraph_fetch = 0  # Track last fetch time

        # Setup message handlers
        self._setup_handlers()

        logger.info(f"Position Monitor Agent initialized")
        logger.info(f"Agent address: {self.agent.address}")
        logger.info(f"Port: {AGENT_PORT}")
        logger.info(f"Demo mode: {DEMO_MODE}")

    def _setup_handlers(self):
        """Setup all message handlers"""

        @self.agent.on_event("startup")
        async def startup(ctx: Context):
            """Agent startup event"""
            logger.info("🚀 Position Monitor Agent starting...")
            logger.info(f"Agent address: {ctx.agent.address}")
            logger.info(f"Agent name: {ctx.agent.name}")

            # Fund agent if needed (testnet)

            # Initialize demo positions if in demo mode
            if DEMO_MODE:
                # Set initial mock prices
                self.price_manager.set_mock_price("ETH", 3200.0)
                self.price_manager.set_mock_price("WETH", 3200.0)
                self.price_manager.set_mock_price("USDC", 1.0)
                self.price_manager.set_mock_price("USDT", 1.0)
                self.price_manager.set_mock_price("DAI", 1.0)
                logger.info("💰 Mock prices initialized for demo mode")

                await self._initialize_demo_positions(ctx)

            logger.success("✅ Position Monitor Agent ready!")

        @self.agent.on_interval(period=30.0)
        async def monitor_positions(ctx: Context):
            """Monitor all positions every 30 seconds"""

            # Fetch real positions in PRODUCTION or PRESENTATION mode
            if not DEMO_MODE or PRESENTATION_MODE:
                current_time = time.time()
                # Fetch from subgraph every 30 seconds (or if first time)
                if current_time - self.last_subgraph_fetch > 25:  # Slight buffer
                    try:
                        logger.info(
                            "🔍 Fetching risky positions from subgraph...")

                        # Get positions with HF < 2.0 (includes critical, high, moderate risk)
                        risky_positions = await self.subgraph_fetcher.get_risky_positions(
                            health_factor_threshold=2.0,
                            limit=20
                        )

                        logger.info(
                            f"📦 Subgraph returned {len(risky_positions)} positions")

                        if risky_positions:
                            mode_label = "🎬 PRESENTATION" if PRESENTATION_MODE else "🏭 PRODUCTION"
                            logger.info(
                                f"📊 [{mode_label}] Found {len(risky_positions)} risky positions from subgraph")

                            # Convert subgraph positions to our internal format
                            loaded_count = 0
                            for pos in risky_positions:
                                try:
                                    user_id = pos['user']['id']
                                    position_id = pos['id']

                                    # Get token addresses and map to symbols
                                    collateral_asset = pos['collateralAsset']
                                    debt_asset = pos['debtAsset']

                                    # Map addresses to token symbols for price lookups
                                    collateral_token = get_token_symbol(
                                        collateral_asset)
                                    debt_token = get_token_symbol(debt_asset)

                                    # Parse position data
                                    self.positions[user_id] = {
                                        'position_id': position_id,
                                        'protocol': 'aave-v3',  # All positions from LiqX subgraph are Aave V3
                                        'chain': 'ethereum-sepolia',  # Sepolia testnet
                                        'collateral_asset': collateral_asset,
                                        'collateral_token': collateral_token,
                                        'collateral_amount': float(pos['collateralAmount']),
                                        'debt_asset': debt_asset,
                                        'debt_token': debt_token,
                                        'debt_amount': float(pos['debtAmount']),
                                        'health_factor': float(pos['healthFactor']),
                                        'last_updated': pos['updatedAt']
                                    }
                                    loaded_count += 1
                                except Exception as parse_error:
                                    logger.warning(
                                        f"Failed to parse position: {parse_error}")
                                    continue

                            logger.success(
                                f"✅ Loaded {loaded_count} positions for monitoring")
                        else:
                            logger.info(
                                "✨ No risky positions found - all positions healthy!")

                        self.last_subgraph_fetch = current_time

                    except Exception as e:
                        logger.error(
                            f"❌ Failed to fetch positions from subgraph: {e}")
                        import traceback
                        logger.error(traceback.format_exc())
                        self.errors_count += 1

            # Now monitor all loaded positions
            if not self.positions:
                logger.debug("No positions to monitor")
                return

            logger.info(f"📊 Monitoring {len(self.positions)} positions...")

            for user_address, position_data in self.positions.items():
                try:
                    await self._check_position(ctx, user_address, position_data)
                except Exception as e:
                    logger.error(
                        f"Error checking position {user_address}: {e}")
                    self.errors_count += 1

        @self.agent.on_message(model=DemoMarketCrash)
        async def handle_crash_start(ctx: Context, sender: str, msg: DemoMarketCrash):
            """Handle demo crash initiation"""
            logger.warning("🚨 DEMO CRASH INITIATED!")
            logger.info(f"   Initial: ${msg.initial_eth_price:.2f}")
            logger.info(f"   Target: ${msg.target_eth_price:.2f}")
            logger.info(f"   Duration: {msg.crash_duration_seconds}s")

            self.demo_crash_active = True
            self.demo_crash_id = msg.crash_id

            # Set initial price
            self.price_manager.set_mock_price("ETH", msg.initial_eth_price)

            self.messages_processed += 1

        @self.agent.on_message(model=DemoPriceUpdate)
        async def handle_price_update(ctx: Context, sender: str, msg: DemoPriceUpdate):
            """Handle real-time price updates during crash"""
            if msg.crash_id != self.demo_crash_id:
                return

            # Update mock oracle
            self.price_manager.set_mock_price("ETH", msg.current_eth_price)

            logger.info(
                f"📉 Price Update: ${msg.current_eth_price:.2f} "
                f"({msg.price_change_percent:+.1f}%)"
            )

            # Recalculate health factors for all positions
            for user_address, position_data in self.positions.items():
                await self._check_position(ctx, user_address, position_data)

            self.messages_processed += 1

        @self.agent.on_message(model=ExecutionResult)
        async def handle_execution_result(ctx: Context, sender: str, msg: ExecutionResult):
            """Handle execution result from executor agent"""
            logger.warning("⚠️  EXECUTION RESULT RECEIVED")
            logger.info(f"   Execution ID: {msg.execution_id}")
            logger.info(f"   Status: {msg.status.upper()}")

            if msg.status == "success":
                logger.success("✅ Rebalancing execution successful!")
                logger.info(
                    "   Position should now have improved health factor")
                logger.info("   🎉 Liquidation risk reduced!")
            else:
                logger.error("❌ Rebalancing execution failed")
                logger.info("   Position remains at risk")

            self.messages_processed += 1

        @self.agent.on_message(model=HealthCheckRequest)
        async def handle_health_check(ctx: Context, sender: str, msg: HealthCheckRequest):
            """Respond to health check requests"""
            uptime = int(time.time() - self.start_time)

            response = HealthCheckResponse(
                agent_name="position_monitor",
                status="healthy" if self.errors_count < 10 else "degraded",
                uptime_seconds=uptime,
                messages_processed=self.messages_processed,
                last_activity=int(time.time()),
                errors_count=self.errors_count,
                timestamp=int(time.time())
            )

            await ctx.send(sender, response)
            logger.debug(f"📋 Health check response sent to {sender}")

        @self.agent.on_message(model=PresentationTrigger)
        async def handle_presentation_trigger(ctx: Context, sender: str, msg: PresentationTrigger):
            """Handle manual triggers for live presentations - PRESENTATION_MODE only"""

            # Security check: Only allow in PRESENTATION_MODE
            if not PRESENTATION_MODE:
                logger.warning(
                    "🚫 PRESENTATION TRIGGER REJECTED: Not in PRESENTATION_MODE")
                return

            # Validate secret
            if msg.secret != PRESENTATION_TRIGGER_SECRET:
                logger.error("🚫 PRESENTATION TRIGGER REJECTED: Invalid secret")
                return

            logger.warning("🎯 PRESENTATION TRIGGER RECEIVED!")
            logger.info(f"   Trigger ID: {msg.trigger_id}")
            logger.info(f"   Trigger Type: {msg.trigger_type}")

            if msg.trigger_type == "market_crash":
                # Simulate ETH price crash
                eth_drop = msg.eth_price_drop_percent or 30.0
                current_eth_price = await self.price_manager.get_token_price("WETH")
                if current_eth_price:
                    new_price = current_eth_price * (1 - eth_drop / 100)
                    self.price_manager.set_mock_price("WETH", new_price)
                    self.price_manager.set_mock_price("ETH", new_price)
                    logger.warning(
                        f"🚨 SIMULATED MARKET CRASH: ETH ${current_eth_price:.2f} → ${new_price:.2f} (-{eth_drop}%)")

                    # Recalculate all positions with new price
                    for user_address, position_data in self.positions.items():
                        await self._check_position(ctx, user_address, position_data)

            elif msg.trigger_type == "alert_position":
                # Force alert for specific position
                if msg.target_position_id and msg.target_position_id in [p.get('position_id') for p in self.positions.values()]:
                    for user_address, position_data in self.positions.items():
                        if position_data.get('position_id') == msg.target_position_id:
                            logger.warning(
                                f"🎯 FORCING ALERT for position {msg.target_position_id}")
                            await self._check_position(ctx, user_address, position_data)
                            break
                elif self.positions:
                    # Alert first position if no specific target
                    first_user = list(self.positions.keys())[0]
                    logger.warning(
                        f"🎯 FORCING ALERT for first position: {first_user}")
                    await self._check_position(ctx, first_user, self.positions[first_user])

            elif msg.trigger_type == "price_drop":
                # Set custom price for specific token
                if msg.target_token and msg.custom_price:
                    self.price_manager.set_mock_price(
                        msg.target_token, msg.custom_price)
                    logger.warning(
                        f"📉 CUSTOM PRICE SET: {msg.target_token} → ${msg.custom_price:.2f}")

                    # Recalculate all positions
                    for user_address, position_data in self.positions.items():
                        await self._check_position(ctx, user_address, position_data)

            self.messages_processed += 1
            logger.success(
                f"✅ Presentation trigger '{msg.trigger_type}' executed successfully")

    async def _initialize_demo_positions(self, ctx: Context):
        """Initialize demo positions for testing"""
        logger.info("🎭 Initializing demo positions...")

        demo_position = {
            "position_id": 1,
            "protocol": "aave",
            "chain": "ethereum",
            "collateral_token": "ETH",
            "collateral_amount": 2.0,  # 2 ETH
            "debt_token": "USDC",
            # $5000 USDC - increased to trigger alert (HF will be ~1.24)
            "debt_amount": 5000.0,
            "created_at": int(time.time())
        }

        # Use a test address
        test_address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
        self.positions[test_address] = demo_position

        logger.success(f"✅ Demo position created for {test_address}")
        logger.info(
            f"   Collateral: {demo_position['collateral_amount']} {demo_position['collateral_token']}")
        logger.info(
            f"   Debt: {demo_position['debt_amount']} {demo_position['debt_token']}")

    async def _check_position(self, ctx: Context, user_address: str, position_data: Dict):
        """Check a single position for liquidation risk"""
        try:
            # Get current prices
            collateral_price = await self.price_manager.get_token_price(
                position_data['collateral_token']
            )

            if not collateral_price:
                logger.warning(
                    f"Failed to get price for {position_data['collateral_token']}")
                return

            # Calculate collateral value
            collateral_value = position_data['collateral_amount'] * \
                collateral_price
            debt_value = position_data['debt_amount']  # Assuming stable coin

            # Calculate health factor
            # HF = collateral_value / debt_value (simplified)
            # Real Aave uses: (collateral * liquidation_threshold) / debt
            # For demo, we'll use 0.85 liquidation threshold
            liquidation_threshold = 0.85
            health_factor = (collateral_value * liquidation_threshold) / \
                debt_value if debt_value > 0 else 999.0

            # Use MeTTa AI for advanced risk assessment
            metta_risk = self.metta_reasoner.assess_risk(
                health_factor=health_factor,
                collateral_usd=collateral_value,
                debt_usd=debt_value,
                collateral_token=position_data['collateral_token'],
                debt_token=position_data['debt_token']
            )

            # Use MeTTa's intelligent risk level (falls back to simple logic if MeTTa unavailable)
            risk_level = metta_risk.get('risk_level', 'moderate')
            urgency_score = metta_risk.get('urgency_score', 5)

            # Override with simple thresholds if not using MeTTa
            if not metta_risk.get('using_metta', False):
                if health_factor < CRITICAL_HF:
                    risk_level = "critical"
                elif health_factor < MODERATE_HF:
                    risk_level = "moderate"
                elif health_factor < SAFE_HF:
                    risk_level = "high"
                else:
                    risk_level = "low"

            logger.info(
                f"Position {user_address[:10]}... | "
                f"HF: {health_factor:.2f} | "
                f"Collateral: ${collateral_value:.2f} | "
                f"Debt: ${debt_value:.2f} | "
                f"Risk: {risk_level.upper()} | "
                f"Urgency: {urgency_score}/10 | "
                f"MeTTa: {'✅' if metta_risk.get('using_metta') else '⚠️ fallback'}"
            )

            # Send alert if health factor is below moderate threshold
            if health_factor < MODERATE_HF:
                await self._send_alert(ctx, user_address, position_data, collateral_value, debt_value, health_factor, risk_level)

        except Exception as e:
            logger.error(f"Error checking position: {e}")
            self.errors_count += 1

    async def _send_alert(
        self,
        ctx: Context,
        user_address: str,
        position_data: Dict,
        collateral_value: float,
        debt_value: float,
        health_factor: float,
        risk_level: str
    ):
        """Send position alert to yield optimizer"""

        if not self.YIELD_OPTIMIZER_ADDRESS:
            logger.warning(
                "Yield optimizer address not set, cannot send alert")
            return

        alert = PositionAlert(
            user_address=user_address,
            position_id=position_data['position_id'],
            protocol=position_data['protocol'],
            chain=position_data['chain'],
            health_factor=health_factor,
            collateral_value=collateral_value,
            debt_value=debt_value,
            collateral_token=position_data['collateral_token'],
            debt_token=position_data['debt_token'],
            risk_level=risk_level,
            timestamp=int(time.time()),
            predicted_liquidation_time=None  # TODO: Implement prediction
        )

        # Send to Yield Optimizer
        # For local testing: agents discover each other via their HTTP endpoints automatically
        await ctx.send(self.YIELD_OPTIMIZER_ADDRESS, alert)

        logger.warning(
            f"⚠️  ALERT SENT: Position {user_address[:10]}... | HF: {health_factor:.2f}")
        self.messages_processed += 1

    def add_position(self, user_address: str, position_data: Dict):
        """Add a position to monitor"""
        self.positions[user_address] = position_data
        logger.info(f"➕ Position added: {user_address}")

    def remove_position(self, user_address: str):
        """Remove a position from monitoring"""
        if user_address in self.positions:
            del self.positions[user_address]
            logger.info(f"➖ Position removed: {user_address}")

    def run(self):
        """Run the agent"""
        logger.info("Starting Position Monitor Agent...")
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
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>PositionMonitor</cyan> | <level>{message}</level>",
        level=os.getenv('LOG_LEVEL', 'INFO')
    )

    # Add file logging
    logger.add(
        "logs/position_monitor.log",
        rotation="10 MB",
        retention="7 days",
        level="DEBUG"
    )

    # Create and run agent
    agent = PositionMonitorAgent()

    # Print agent info
    logger.info("="*60)
    logger.info("Position Monitor Agent - LiquidityGuard AI")
    logger.info("="*60)
    logger.info(f"Agent Address: {agent.agent.address}")
    logger.info(f"Port: {AGENT_PORT}")
    logger.info(f"Demo Mode: {DEMO_MODE}")
    logger.info("="*60)

    # Run agent
    agent.run()


if __name__ == "__main__":
    main()
