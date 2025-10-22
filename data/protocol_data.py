"""
LiquidityGuard AI - Protocol Data Fetcher

Fetches APY data from DeFi protocols.

Sources:
1. DeFi Llama API (aggregated data)
2. Protocol-specific subgraphs
3. Mock data for demo
"""

import aiohttp
import asyncio
import ssl
from typing import Dict, Optional, List
import os
from dotenv import load_dotenv
from loguru import logger

load_dotenv()


class ProtocolDataFetcher:
    """
    Fetches APY data from DeFi protocols
    """

    def __init__(self):
        self.defillama_base_url = os.getenv(
            'DEFILLAMA_BASE_URL',
            'https://yields.llama.fi'
        )
        self.demo_mode = os.getenv('DEMO_MODE', 'false').lower() == 'true'
        self.apy_cache = {}
        self.cache_ttl = 300  # Cache for 5 minutes

        # Mock APY data for demo mode
        self.mock_apys = {
            "aave_ethereum_eth": 5.2,
            "aave_ethereum_usdc": 4.8,
            "compound_ethereum_usdc": 4.5,
            "compound_ethereum_eth": 6.8,  # Better alternative for ETH on same chain
            "lido_ethereum_eth": 7.5,      # Liquid staking alternative
            "kamino_solana_sol": 9.1,
            "drift_solana_usdc": 8.3,
        }

        logger.info("ProtocolDataFetcher initialized")
        logger.info(f"Demo mode: {self.demo_mode}")

    async def get_protocol_apy(
        self,
        protocol: str,
        chain: str,
        token: str
    ) -> Optional[float]:
        """
        Get current APY for a protocol

        Args:
            protocol: Protocol name (aave, compound, kamino)
            chain: Chain name (ethereum, solana)
            token: Token symbol (ETH, USDC)

        Returns:
            APY as percentage (5.2 = 5.2%)
        """
        key = f"{protocol}_{chain}_{token}".lower()

        # Check demo mode
        if self.demo_mode and key in self.mock_apys:
            apy = self.mock_apys[key]
            logger.debug(f"[DEMO] {key} APY: {apy:.2f}%")
            return apy

        # Check cache
        if key in self.apy_cache:
            cached_apy, timestamp = self.apy_cache[key]
            if asyncio.get_event_loop().time() - timestamp < self.cache_ttl:
                logger.debug(f"[CACHE] {key} APY: {cached_apy:.2f}%")
                return cached_apy

        # Try DeFi Llama
        apy = await self._fetch_from_defillama(protocol, chain, token)
        if apy:
            self.apy_cache[key] = (apy, asyncio.get_event_loop().time())
            logger.info(f"[DeFi Llama] {key} APY: {apy:.2f}%")
            return apy

        logger.warning(f"Failed to fetch APY for {key}")
        return None

    async def _fetch_from_defillama(
        self,
        protocol: str,
        chain: str,
        token: str
    ) -> Optional[float]:
        """
        Fetch from DeFi Llama yields API

        API Docs: https://defillama.com/docs/api
        """
        url = f"{self.defillama_base_url}/pools"

        try:
            # Create SSL context that doesn't verify certificates (for development)
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE

            connector = aiohttp.TCPConnector(ssl=ssl_context)
            async with aiohttp.ClientSession(connector=connector) as session:
                async with session.get(url, timeout=15) as response:
                    if response.status == 200:
                        data = await response.json()
                        pools = data.get('data', [])

                        # Find matching pool
                        for pool in pools:
                            pool_project = pool.get('project', '').lower()
                            pool_chain = pool.get('chain', '').lower()
                            pool_symbol = pool.get('symbol', '').upper()

                            if (pool_project == protocol.lower() and
                                pool_chain == chain.lower() and
                                    token.upper() in pool_symbol):
                                apy = pool.get('apy', 0)
                                return float(apy) if apy else None
                    else:
                        logger.error(
                            f"DeFi Llama API error: {response.status}")
        except asyncio.TimeoutError:
            logger.error("DeFi Llama API timeout")
        except Exception as e:
            logger.error(f"DeFi Llama fetch failed: {e}")

        return None

    async def get_all_yields(self) -> Dict[str, float]:
        """
        Get yields from all protocols

        Returns:
            {
                "aave_ethereum_usdc": 5.2,
                "compound_ethereum_usdc": 4.8,
                "kamino_solana_sol": 9.1
            }
        """
        protocols = [
            ("aave", "ethereum", "ETH"),
            ("aave", "ethereum", "USDC"),
            ("compound", "ethereum", "USDC"),
            ("compound", "ethereum", "ETH"),
            ("lido", "ethereum", "ETH"),
            ("kamino", "solana", "SOL"),
            ("drift", "solana", "USDC"),
        ]

        results = {}
        tasks = []
        keys = []

        for protocol, chain, token in protocols:
            key = f"{protocol}_{chain}_{token}".lower()
            keys.append(key)
            tasks.append(self.get_protocol_apy(protocol, chain, token))

        apys = await asyncio.gather(*tasks, return_exceptions=True)

        for key, apy in zip(keys, apys):
            if isinstance(apy, Exception):
                logger.error(f"Error fetching {key}: {apy}")
            elif apy:
                results[key] = apy

        return results

    async def find_best_yield(
        self,
        token: str,
        exclude_protocols: List[str] = None,
        allow_cross_chain: bool = True
    ) -> Optional[Dict]:
        """
        Find the protocol with the best yield for a token

        Args:
            token: Token symbol
            exclude_protocols: List of protocols to exclude
            allow_cross_chain: Whether to include cross-chain opportunities

        Returns:
            {
                "protocol": "kamino",
                "chain": "solana",
                "token": "SOL",
                "apy": 9.1
            }
        """
        exclude_protocols = exclude_protocols or []
        all_yields = await self.get_all_yields()

        best_yield = None
        best_apy = 0

        for key, apy in all_yields.items():
            parts = key.split('_')
            if len(parts) >= 3:
                protocol, chain, token_symbol = parts[0], parts[1], parts[2]

                # Case-insensitive token comparison
                if (token_symbol.lower() == token.lower() and
                    protocol not in exclude_protocols and
                        apy > best_apy):
                    best_apy = apy
                    best_yield = {
                        "protocol": protocol,
                        "chain": chain,
                        "token": token_symbol.upper(),
                        "apy": apy,
                        "cross_chain": False  # Will be determined by caller
                    }

        if best_yield:
            logger.info(
                f"Best yield for {token}: {best_yield['protocol']} "
                f"({best_yield['chain']}) - {best_yield['apy']:.2f}% APY"
            )

        return best_yield

    def set_mock_apy(self, protocol: str, chain: str, token: str, apy: float):
        """Set mock APY for demo mode"""
        key = f"{protocol}_{chain}_{token}".lower()
        self.mock_apys[key] = apy
        logger.info(f"[DEMO] Mock APY set: {key} = {apy:.2f}%")


# Singleton instance
_protocol_data_fetcher = None


def get_protocol_data_fetcher() -> ProtocolDataFetcher:
    """Get singleton instance of ProtocolDataFetcher"""
    global _protocol_data_fetcher
    if _protocol_data_fetcher is None:
        _protocol_data_fetcher = ProtocolDataFetcher()
    return _protocol_data_fetcher


# Test function
async def test_protocol_data():
    """Test protocol data functionality"""
    logger.info("Testing protocol data fetcher...")

    fetcher = get_protocol_data_fetcher()

    # Test getting all yields
    logger.info("\nFetching all yields...")
    yields = await fetcher.get_all_yields()

    logger.info("\nProtocol APYs:")
    for key, apy in sorted(yields.items(), key=lambda x: x[1], reverse=True):
        logger.info(f"  {key}: {apy:.2f}%")

    # Test finding best yield
    logger.info("\nFinding best yields:")
    for token in ["ETH", "USDC", "SOL"]:
        best = await fetcher.find_best_yield(token)
        if best:
            logger.info(
                f"  {token}: {best['protocol']} ({best['chain']}) - "
                f"{best['apy']:.2f}% APY"
            )


if __name__ == "__main__":
    # Setup logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        colorize=True,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>"
    )

    # Run test
    asyncio.run(test_protocol_data())
