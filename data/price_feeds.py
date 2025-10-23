"""
LiquidityGuard AI - Price Feed Manager

Fetches real-time price data from multiple sources with fallback mechanisms.

Priority:
1. Chainlink oracles (on-chain, most reliable for production)
2. CoinGecko API (fallback for development)
3. Demo mode (mock prices for testing)
"""

import aiohttp
import asyncio
import ssl
from typing import Dict, Optional
import os
from dotenv import load_dotenv
from loguru import logger

load_dotenv()

# Chainlink Price Feed addresses on Ethereum Mainnet
CHAINLINK_PRICE_FEEDS = {
    "ETH": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",  # ETH/USD
    "WETH": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",  # Same as ETH
    "WBTC": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",  # BTC/USD
    "USDC": "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",  # USDC/USD
    "USDT": "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D",  # USDT/USD
    "DAI": "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9",   # DAI/USD
}

# Chainlink ABI - just the latestRoundData function we need
CHAINLINK_ABI = [
    {
        "inputs": [],
        "name": "latestRoundData",
        "outputs": [
            {"name": "roundId", "type": "uint80"},
            {"name": "answer", "type": "int256"},
            {"name": "startedAt", "type": "uint256"},
            {"name": "updatedAt", "type": "uint256"},
            {"name": "answeredInRound", "type": "uint80"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
    }
]


class PriceFeedManager:
    """
    Fetches real-time price data from multiple sources

    Supports:
    - Chainlink oracles (on-chain, production)
    - CoinGecko API (off-chain, development)
    - Demo mode (mock prices, testing)
    """

    def __init__(self):
        self.coingecko_api_key = os.getenv('COINGECKO_API_KEY')
        self.demo_mode = os.getenv('DEMO_MODE', 'false').lower() == 'true'
        self.use_chainlink = os.getenv(
            'USE_CHAINLINK', 'false').lower() == 'true'
        self.rpc_url = os.getenv('ETH_RPC_URL', 'https://eth.llamarpc.com')

        self.mock_prices = {}
        self.price_cache = {}
        self.cache_ttl = 60  # Cache for 60 seconds

        # Web3 connection (lazy loaded)
        self.web3 = None

        logger.info("PriceFeedManager initialized")
        logger.info(f"Demo mode: {self.demo_mode}")
        logger.info(f"Use Chainlink: {self.use_chainlink}")
        if self.use_chainlink:
            logger.info(f"RPC URL: {self.rpc_url}")

    async def get_token_price(
        self,
        token_symbol: str,
        chain: str = "ethereum"
    ) -> Optional[float]:
        """
        Get current token price in USD

        Priority:
        1. Demo mode (if enabled) - instant mock prices
        2. CoinGecko API - perfect for off-chain analysis

        Args:
            token_symbol: Token symbol (ETH, WBTC, SOL)
            chain: Blockchain name

        Returns:
            Price in USD or None if unavailable
        """
        # Check demo mode first
        if self.demo_mode and token_symbol in self.mock_prices:
            price = self.mock_prices[token_symbol]
            logger.debug(f"[DEMO] {token_symbol} price: ${price:.2f}")
            return price

        # Check cache
        cache_key = f"{token_symbol}_{chain}"
        if cache_key in self.price_cache:
            cached_price, timestamp = self.price_cache[cache_key]
            if asyncio.get_event_loop().time() - timestamp < self.cache_ttl:
                logger.debug(
                    f"[CACHE] {token_symbol} price: ${cached_price:.2f}")
                return cached_price

        # Fetch from CoinGecko - perfect for our use case!
        price = await self._fetch_from_coingecko(token_symbol)
        if price:
            self.price_cache[cache_key] = (
                price, asyncio.get_event_loop().time())
            return price

        logger.warning(f"Failed to fetch price for {token_symbol}")
        return None

    def _init_web3(self):
        """Initialize Web3 connection for Chainlink (lazy loaded)"""
        if self.web3 is None:
            try:
                from web3 import Web3
                self.web3 = Web3(Web3.HTTPProvider(self.rpc_url))
                if self.web3.is_connected():
                    logger.info(f"✅ Connected to Ethereum via {self.rpc_url}")
                else:
                    logger.error("❌ Failed to connect to Ethereum RPC")
                    self.use_chainlink = False
            except Exception as e:
                logger.error(f"Failed to initialize Web3: {e}")
                self.use_chainlink = False

    async def _fetch_from_coingecko(self, symbol: str) -> Optional[float]:
        """
        Fetch price from CoinGecko API

        Perfect for our use case:
        - Off-chain analysis (don't need on-chain oracle)
        - Wide token coverage
        - Simple REST API
        - Real-time enough for liquidation monitoring

        API Docs: https://www.coingecko.com/en/api/documentation

        Args:
            symbol: Token symbol (e.g., 'ETH', 'WBTC', 'USDC')

        Returns:
            Price in USD or None if failed
        """
        # Map token symbols to CoinGecko IDs
        token_id_map = {
            "ETH": "ethereum",
            "WETH": "ethereum",
            "WBTC": "wrapped-bitcoin",
            "SOL": "solana",
            "USDC": "usd-coin",
            "USDT": "tether",
            "DAI": "dai",
            "PYUSD": "paypal-usd"
        }

        token_id = token_id_map.get(symbol.upper())
        if not token_id:
            logger.warning(f"Unknown token symbol: {symbol}")
            return None

        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": token_id,
            "vs_currencies": "usd"
        }

        # Add API key if available
        if self.coingecko_api_key and self.coingecko_api_key != "your_coingecko_api_key_here":
            params["x_cg_demo_api_key"] = self.coingecko_api_key

        try:
            # Create SSL context that doesn't verify certificates (for development)
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE

            connector = aiohttp.TCPConnector(ssl=ssl_context)
            async with aiohttp.ClientSession(connector=connector) as session:
                async with session.get(url, params=params, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        if token_id in data and "usd" in data[token_id]:
                            price = data[token_id]["usd"]
                            logger.info(
                                f"💰 CoinGecko: {symbol} = ${price:,.2f}")
                            return price
                    else:
                        logger.error(f"CoinGecko API error: {response.status}")
        except asyncio.TimeoutError:
            logger.error("CoinGecko API timeout")
        except Exception as e:
            logger.error(f"CoinGecko fetch failed: {e}")

        return None

    def set_mock_price(self, token_symbol: str, price: float):
        """Set mock price for demo mode"""
        self.mock_prices[token_symbol] = price
        logger.info(f"[DEMO] Mock price set: {token_symbol} = ${price:.2f}")

    def get_mock_price(self, token_symbol: str) -> Optional[float]:
        """Get current mock price"""
        return self.mock_prices.get(token_symbol)

    async def get_multiple_prices(
        self,
        tokens: list[str]
    ) -> Dict[str, float]:
        """
        Get prices for multiple tokens efficiently

        Args:
            tokens: List of token symbols

        Returns:
            Dictionary of {token: price}
        """
        tasks = [self.get_token_price(token) for token in tokens]
        prices = await asyncio.gather(*tasks, return_exceptions=True)

        result = {}
        for token, price in zip(tokens, prices):
            if isinstance(price, Exception):
                logger.error(f"Error fetching {token}: {price}")
                result[token] = None
            else:
                result[token] = price

        return result


# Singleton instance
_price_feed_manager = None


def get_price_feed_manager() -> PriceFeedManager:
    """Get singleton instance of PriceFeedManager"""
    global _price_feed_manager
    if _price_feed_manager is None:
        _price_feed_manager = PriceFeedManager()
    return _price_feed_manager


# Test function
async def test_price_feeds():
    """Test price feed functionality"""
    logger.info("Testing price feeds...")

    manager = get_price_feed_manager()

    # Test fetching multiple prices
    tokens = ["ETH", "WBTC", "SOL", "USDC"]
    prices = await manager.get_multiple_prices(tokens)

    logger.info("Fetched prices:")
    for token, price in prices.items():
        if price:
            logger.info(f"  {token}: ${price:.2f}")
        else:
            logger.warning(f"  {token}: Failed to fetch")

    # Test demo mode
    manager.set_mock_price("ETH", 3000.0)
    demo_price = await manager.get_token_price("ETH")
    logger.info(f"Demo price (ETH): ${demo_price:.2f}")


if __name__ == "__main__":
    # Setup logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        colorize=True,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>"
    )

    # Run test
    asyncio.run(test_price_feeds())
