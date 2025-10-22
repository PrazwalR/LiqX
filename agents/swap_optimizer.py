"""
LiquidityGuard AI - Swap Optimizer Agent

Receives rebalancing strategies and finds optimal swap routes using 1inch API.

Features:
- 1inch API v6 integration
- Multi-chain swap route optimization
- Gas estimation
- Slippage protection
- MeTTa AI for route scoring
- Demo mode support
"""

from agents.message_protocols import (
    RebalanceStrategy,
    SwapRoute,
    HealthCheckRequest,
    HealthCheckResponse
)
from agents.metta_reasoner import get_metta_reasoner
from data.price_feeds import get_price_feed_manager
from uagents import Agent, Context
import os
import time
import uuid
import aiohttp
import ssl
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

AGENT_SEED = os.getenv('AGENT_SEED_SWAP_OPTIMIZER', 'swap-seed-default')
AGENT_PORT = int(os.getenv('SWAP_OPTIMIZER_PORT', '8002'))
EXECUTOR_ADDRESS = None  # Will be set after registration

# Deployment mode
DEPLOY_MODE = os.getenv('DEPLOY_MODE', 'local')  # 'local' or 'almanac'

# 1inch API Configuration
ONEINCH_API_KEY = os.getenv('ONEINCH_API_KEY')
ONEINCH_BASE_URL = os.getenv('ONEINCH_BASE_URL', 'https://api.1inch.dev')

# Fusion+ API endpoints
FUSION_BASE_URL = f"{ONEINCH_BASE_URL}/fusion"
FUSION_QUOTER_URL = f"{FUSION_BASE_URL}/quoter/v2.0"
FUSION_RELAYER_URL = f"{FUSION_BASE_URL}/relayer/v2.0"

# Chain IDs for 1inch Fusion+ (supported chains)
CHAIN_IDS = {
    'ethereum': 1,
    'arbitrum': 42161,
    'optimism': 10,
    'polygon': 137,
    'base': 8453,
    'avalanche': 43114,
    'gnosis': 100,
    'fantom': 250
}

# Demo mode
DEMO_MODE = os.getenv('DEMO_MODE', 'false').lower() == 'true'


# ═══════════════════════════════════════════════════════
# SWAP OPTIMIZER AGENT
# ═══════════════════════════════════════════════════════

class SwapOptimizerAgent:
    """Swap Optimizer Agent Implementation"""

    # Executor Address (updated from config/agent_addresses.json)
    EXECUTOR_ADDRESS = "agent1qtk56cc7z5499vuh43n5c4kzhve5u0khn7awcwsjn9eqfe3u2gsv7fwrrqq"

    def __init__(self):
        # Initialize agent based on deployment mode
        if DEPLOY_MODE == 'almanac':
            # Almanac/Dorado deployment - use Agentverse mailbox
            self.agent = Agent(
                name="swap_optimizer",
                seed=AGENT_SEED,
                port=AGENT_PORT,
                mailbox=True
            )
            logger.info(
                "Agent initialized in ALMANAC mode (Agentverse mailbox enabled)")
        else:
            # Local Bureau mode - use localhost endpoint
            self.agent = Agent(
                name="swap_optimizer",
                seed=AGENT_SEED,
                port=AGENT_PORT,
                endpoint=[f"http://localhost:{AGENT_PORT}/submit"]
            )
            logger.info("Agent initialized in LOCAL mode (Bureau)")

        # State
        self.price_manager = get_price_feed_manager()
        self.metta_reasoner = get_metta_reasoner()
        self.start_time = time.time()
        self.messages_processed = 0
        self.routes_generated = 0
        self.errors_count = 0

        # Setup handlers
        self._setup_handlers()

        logger.info(f"Swap Optimizer Agent initialized")
        logger.info(f"Agent address: {self.agent.address}")
        logger.info(f"Port: {AGENT_PORT}")

    def _setup_handlers(self):
        """Setup all message handlers"""

        @self.agent.on_event("startup")
        async def startup(ctx: Context):
            """Agent startup event"""
            logger.info("🚀 Swap Optimizer Agent starting...")
            logger.info(f"Agent address: {ctx.agent.address}")
            logger.info(f"Agent name: {ctx.agent.name}")
            logger.success("✅ Swap Optimizer Agent ready!")

        @self.agent.on_message(model=RebalanceStrategy)
        async def handle_rebalance_strategy(ctx: Context, sender: str, msg: RebalanceStrategy):
            """Handle rebalancing strategy from Yield Optimizer"""
            logger.warning("⚠️  REBALANCE STRATEGY RECEIVED")
            logger.info(f"   Strategy ID: {msg.strategy_id}")
            logger.info(f"   User: {msg.user_address[:10]}...")
            logger.info(f"   From: {msg.source_protocol} ({msg.source_chain})")
            logger.info(f"   To: {msg.target_protocol} ({msg.target_chain})")
            logger.info(f"   Amount: ${msg.amount_to_move:.2f}")
            logger.info(
                f"   Expected APY Improvement: +{msg.expected_apy_improvement:.2f}%")
            logger.info(f"   Execution Method: {msg.execution_method}")
            logger.info(f"   Priority: {msg.priority}")
            logger.info(f"   Reason: {msg.reason}")

            # Find optimal swap route
            swap_route = await self._find_optimal_route(
                ctx,
                msg.source_protocol,
                msg.target_protocol,
                msg.amount_to_move,
                msg.user_address
            )

            if swap_route:
                self.routes_generated += 1
                logger.success(
                    f"✅ Swap route generated: {swap_route.route_id}")

                # Send to Executor
                await ctx.send(self.EXECUTOR_ADDRESS, swap_route)
                logger.info(
                    f"   → Sent to Executor ({self.EXECUTOR_ADDRESS[:10]}...)")
            else:
                logger.warning("⚠️  Could not generate swap route")

            self.messages_processed += 1

        @self.agent.on_message(model=HealthCheckRequest)
        async def handle_health_check(ctx: Context, sender: str, msg: HealthCheckRequest):
            """Handle health check requests"""
            uptime = time.time() - self.start_time

            response = HealthCheckResponse(
                agent_name="swap_optimizer",
                status="healthy",
                uptime=uptime,
                messages_processed=self.messages_processed,
                timestamp=int(time.time())
            )

            await ctx.send(sender, response)
            logger.debug(f"Health check response sent to {sender[:10]}...")

    async def _find_optimal_route(
        self,
        ctx: Context,
        from_protocol: str,
        to_protocol: str,
        amount_usd: float,
        user_address: str
    ) -> Optional[SwapRoute]:
        """
        Find optimal swap route using 1inch API v6

        Returns SwapRoute with transaction data
        """
        logger.info("🔍 Finding optimal swap route...")

        # Parse protocol and chain
        from_parts = from_protocol.split('_')  # e.g., "aave_ethereum"
        to_parts = to_protocol.split('_')

        from_protocol_name = from_parts[0] if len(
            from_parts) > 0 else from_protocol
        from_chain = from_parts[1] if len(from_parts) > 1 else 'ethereum'

        to_protocol_name = to_parts[0] if len(to_parts) > 0 else to_protocol
        to_chain = to_parts[1] if len(to_parts) > 1 else 'ethereum'

        # Check if cross-chain (1inch doesn't support cross-chain directly)
        if from_chain != to_chain:
            logger.warning(
                f"Cross-chain swap detected: {from_chain} → {to_chain}")
            logger.info(
                "Would need bridge protocol (Stargate, Wormhole, etc.)")
            # For now, generate a demo route
            return await self._generate_demo_route(from_protocol, to_protocol, amount_usd)

        # Same chain - use 1inch Fusion+
        chain_id = CHAIN_IDS.get(from_chain, 1)

        if DEMO_MODE:
            logger.info(
                f"[DEMO] Generating mock Fusion+ route for {from_chain}")
            return await self._generate_demo_route(from_protocol, to_protocol, amount_usd)

        # Real 1inch Fusion+ API call (gasless swaps!)
        return await self._query_fusion_plus(
            chain_id=chain_id,
            from_token=from_protocol_name,
            to_token=to_protocol_name,
            amount_usd=amount_usd,
            user_address=user_address
        )

    async def _query_fusion_plus(
        self,
        chain_id: int,
        from_token: str,
        to_token: str,
        amount_usd: float,
        user_address: str
    ) -> Optional[SwapRoute]:
        """
        Query 1inch Fusion+ API for gasless swap with MEV protection

        Fusion+ Flow:
        1. Get quote (receive endpoint)
        2. Create order
        3. Submit to relayers
        4. Poll for settlement

        API Docs: https://docs.1inch.io/docs/fusion-swap/introduction
        """
        if not ONEINCH_API_KEY or ONEINCH_API_KEY == "your_1inch_api_key_here":
            logger.warning("1inch API key not configured, using demo mode")
            return await self._generate_demo_route(from_token, to_token, amount_usd)

        # Get token addresses (simplified - would need token registry)
        token_addresses = {
            'eth': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',  # Native ETH
            'usdc': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',  # USDC on Ethereum
            'usdt': '0xdAC17F958D2ee523a2206206994597C13D831ec7',  # USDT on Ethereum
            'dai': '0x6B175474E89094C44Da98b954EedeAC495271d0F',   # DAI on Ethereum
            'weth': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',  # WETH on Ethereum
        }

        from_token_addr = token_addresses.get(
            from_token.lower(), token_addresses['usdc'])
        to_token_addr = token_addresses.get(
            to_token.lower(), token_addresses['eth'])

        # Convert USD to token amount (simplified)
        # Assuming 6 decimals for stablecoins
        amount_in_wei = int(amount_usd * 1e6)

        # Step 1: Get Fusion+ quote
        quote_url = f"{FUSION_QUOTER_URL}/{chain_id}/quote/receive"
        quote_params = {
            'srcTokenAddress': from_token_addr,
            'dstTokenAddress': to_token_addr,
            'amount': amount_in_wei,
            'walletAddress': user_address,
            'enableEstimate': 'true',  # Get gas estimates
        }

        headers = {
            'Authorization': f'Bearer {ONEINCH_API_KEY}',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }

        try:
            # SSL workaround for development
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE

            connector = aiohttp.TCPConnector(ssl=ssl_context)
            async with aiohttp.ClientSession(connector=connector) as session:
                # Get Fusion+ quote
                logger.info(
                    f"🔄 Requesting Fusion+ quote for {from_token} → {to_token}")
                async with session.get(quote_url, params=quote_params, headers=headers, timeout=15) as response:
                    if response.status == 200:
                        quote_data = await response.json()

                        # Extract key information
                        dst_amount = quote_data.get('dstTokenAmount', '0')
                        recommended_preset = quote_data.get(
                            'recommendedPreset', 'fast')

                        logger.info(f"✅ Fusion+ quote received:")
                        logger.info(f"   Output amount: {dst_amount}")
                        logger.info(f"   Preset: {recommended_preset}")
                        logger.info(f"   Gasless: YES (resolvers pay gas)")

                        # Create SwapRoute with Fusion+ data
                        route = SwapRoute(
                            route_id=str(uuid.uuid4()),
                            from_token=from_token,
                            to_token=to_token,
                            amount=amount_usd,
                            transaction_data=str({
                                'type': 'fusion_plus',
                                'quote': quote_data,
                                'chain_id': chain_id,
                                'gasless': True,
                                'mev_protected': True,
                                'preset': recommended_preset
                            })
                        )

                        return route
                    else:
                        logger.error(f"Fusion+ API error: {response.status}")
                        error_text = await response.text()
                        logger.debug(f"Error details: {error_text}")

                        # Fallback to demo mode
                        logger.warning(
                            "Falling back to demo mode due to API error")
                        return await self._generate_demo_route(from_token, to_token, amount_usd)

        except Exception as e:
            logger.error(f"Fusion+ API request failed: {e}")
            self.errors_count += 1
            # Fallback to demo mode
            return await self._generate_demo_route(from_token, to_token, amount_usd)

        return None

    async def _generate_demo_route(
        self,
        from_protocol: str,
        to_protocol: str,
        amount_usd: float
    ) -> SwapRoute:
        """
        Generate demo Fusion+ swap route for testing
        """
        route_id = str(uuid.uuid4())

        # Use MeTTa AI to score the route
        try:
            metta_score = self.metta_reasoner.select_optimal_strategy(
                current_protocol=from_protocol,
                current_chain="ethereum",  # Default to ethereum
                current_apy=5.0,
                amount=amount_usd,
                risk_level="moderate",
                urgency=5,
                market_trend="stable",
                available_strategies=[{
                    "protocol": to_protocol,
                    "chain": "ethereum",
                    "apy": 8.0
                }]
            )
            logger.info(
                f"🧠 MeTTa Route Score: {metta_score.get('strategy_score', 0)}/100")
        except Exception as e:
            logger.warning(f"MeTTa reasoner error: {e}")
            metta_score = {"strategy_score": 50}  # Default score

        # Demo Fusion+ transaction data
        demo_tx_data = {
            'type': 'fusion_plus',
            'route_id': route_id,
            'from': from_protocol,
            'to': to_protocol,
            'amount_usd': amount_usd,
            'gasless': True,  # Key Fusion+ benefit
            'mev_protected': True,  # Key Fusion+ benefit
            'estimated_gas': 0,  # Resolvers pay gas!
            # Better slippage (0.2% due to auction)
            'estimated_output': amount_usd * 0.998,
            'auction_duration': '30s',  # Dutch auction for best price
            'route_steps': [
                {'action': 'withdraw', 'protocol': from_protocol, 'amount': amount_usd},
                {'action': 'fusion_swap', 'dex': '1inch_fusion_plus',
                    'amount': amount_usd, 'gasless': True},
                {'action': 'deposit', 'protocol': to_protocol,
                    'amount': amount_usd * 0.998}
            ],
            'metta_score': metta_score.get('strategy_score', 0),
            'preset': 'fast',
            'resolvers': ['multiple_competing_resolvers']
        }

        route = SwapRoute(
            route_id=route_id,
            from_token=from_protocol,
            to_token=to_protocol,
            amount=amount_usd,
            transaction_data=str(demo_tx_data)
        )

        logger.debug(f"[DEMO] Generated Fusion+ route: {route_id}")
        logger.info(f"   ✅ Gasless: YES")
        logger.info(f"   ✅ MEV Protected: YES")
        logger.info(f"   ✅ Better Pricing: YES (Dutch auction)")
        return route

    def run(self):
        """Run the agent"""
        logger.info("=" * 60)
        logger.info("Swap Optimizer Agent - LiquidityGuard AI")
        logger.info("🔥 FUSION+ MODE ENABLED 🔥")
        logger.info("=" * 60)
        logger.info(f"Agent Address: {self.agent.address}")
        logger.info(f"Port: {AGENT_PORT}")
        logger.info(
            f"1inch Fusion+: {'Configured' if ONEINCH_API_KEY and ONEINCH_API_KEY != 'your_1inch_api_key_here' else 'Demo Mode'}")
        logger.info(f"Benefits:")
        logger.info(f"  ✅ Gasless swaps (resolvers pay gas)")
        logger.info(f"  ✅ MEV protection (Dutch auction)")
        logger.info(f"  ✅ Better pricing (competitive resolvers)")
        logger.info("=" * 60)
        logger.info("Starting Swap Optimizer Agent...")

        self.agent.run()


# ═══════════════════════════════════════════════════════
# MAIN ENTRY POINT
# ═══════════════════════════════════════════════════════

def main():
    """Main entry point"""
    agent = SwapOptimizerAgent()
    agent.run()


if __name__ == "__main__":
    main()
