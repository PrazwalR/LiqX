"""
LiquidityGuard AI - Price Feed Manager

Fetches real-time price data from CoinGecko API with caching.

Priority:
1. CoinGecko API (real-time prices)
2. Demo mode (mock prices for testing)
"""

import aiohttp
import asyncio
import ssl
from typing import Dict, Optional
import os
from dotenv import load_dotenv
from loguru import logger

load_dotenv()


class PriceFeedManager:
    """
    Fetches real-time price data from CoinGecko

    Supports:
    - CoinGecko API (off-chain, real-time)
    - Demo mode (mock prices, testing)
    """

    def __init__(self):
        self.coingecko_api_key = os.getenv('COINGECKO_API_KEY')
        self.demo_mode = os.getenv('DEMO_MODE', 'false').lower() == 'true'

        self.mock_prices = {}
        self.price_cache = {}
        self.cache_ttl = 60  # Cache for 60 seconds

        logger.info("PriceFeedManager initialized")
        logger.info(f"Demo mode: {self.demo_mode}")

    async def get_token_price(
        self,
        token_symbol: str,
        chain: str = "ethereum"
    ) -> Optional[float]:
        """
        Get current token price in USD from CoinGecko

        Priority:
        1. Demo mode (if enabled) - instant mock prices
        2. CoinGecko API - real-time price data

        Args:
            token_symbol: Token symbol (ETH, WBTC, SOL)
            chain: Blockchain name (not used, kept for compatibility)

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

        # Fetch from CoinGecko
        price = await self._fetch_from_coingecko(token_symbol)
        if price:
            self.price_cache[cache_key] = (
                price, asyncio.get_event_loop().time())
            return price

        logger.warning(f"Failed to fetch price for {token_symbol}")
        return None

    async def _fetch_from_coingecko(self, symbol: str) -> Optional[float]:
        """
        Fetch price from CoinGecko API

        Benefits:
        - Real-time price data
        - Wide token coverage
        - Simple REST API
        - Perfect for liquidation monitoring

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
