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
        self.apy_cache = {}
        self.cache_ttl = 300  # Cache for 5 minutes

        logger.info("📡 ProtocolDataFetcher initialized")
        logger.info("   - All protocols: Real DeFi Llama API")

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

        # Check cache for real data
        if key in self.apy_cache:
            cached_apy, timestamp = self.apy_cache[key]
            if asyncio.get_event_loop().time() - timestamp < self.cache_ttl:
                logger.debug(f"[CACHE] {key} APY: {cached_apy:.2f}%")
                return cached_apy

        # Fetch real data from DeFi Llama
        apy = await self._fetch_from_defillama(protocol, chain, token)
        if apy:
            self.apy_cache[key] = (apy, asyncio.get_event_loop().time())
            logger.info(f"[DeFi Llama] {key} APY: {apy:.2f}%")
            return apy

        logger.warning(f"Failed to fetch APY for {key}")
        return None
        return None

    async def _fetch_from_defillama(
        self,
        protocol: str,
        chain: str,
        token: str
    ) -> Optional[float]:
        """
        Fetch from DeFi Llama yields API with flexible matching

        API Docs: https://defillama.com/docs/api
        """
        url = f"{self.defillama_base_url}/pools"

        try:
            # Create SSL context
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE

            connector = aiohttp.TCPConnector(ssl=ssl_context)
            async with aiohttp.ClientSession(connector=connector) as session:
                async with session.get(url, timeout=15) as response:
                    if response.status == 200:
                        data = await response.json()
                        pools = data.get('data', [])

                        # Normalize search terms
                        protocol_search = protocol.lower().replace(
                            '-v3', '').replace('-v2', '').replace('-', '')
                        chain_search = chain.lower().split(
                            '-')[0]  # ethereum-sepolia -> ethereum
                        token_search = token.upper()

                        # Map token variations
                        if token_search in ['WETH', 'ETH']:
                            token_variations = ['WETH', 'ETH', 'STETH']
                        else:
                            token_variations = [token_search]

                        best_match = None
                        best_apy = 0

                        # Flexible matching
                        for pool in pools:
                            pool_project = pool.get('project', '').lower()
                            pool_chain = pool.get('chain', '').lower()
                            pool_symbol = pool.get('symbol', '').upper()
                            apy = pool.get('apy', 0)

                            # Protocol matching: exact, startswith, or contains
                            protocol_match = (
                                pool_project == protocol_search or
                                pool_project.startswith(protocol_search) or
                                protocol_search in pool_project
                            )

                            # Chain matching
                            chain_match = chain_search in pool_chain

                            # Token matching (any variation)
                            token_match = any(
                                tv in pool_symbol for tv in token_variations)

                            if protocol_match and chain_match and token_match:
                                if apy > best_apy:
                                    best_match = pool
                                    best_apy = apy
                                    logger.debug(
                                        f"Matched: {pool_project} on {pool_chain} - {pool_symbol} - {apy:.2f}%")

                        if best_match:
                            return float(best_apy)
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
            token: Token symbol (WETH, ETH, USDC, etc.)
            exclude_protocols: List of protocols to exclude
            allow_cross_chain: Whether to include cross-chain opportunities

        Returns:
            {
                "protocol": "aave",
                "chain": "ethereum",
                "token": "ETH",
                "apy": 6.52
            }
        """
        exclude_protocols = exclude_protocols or []

        # Normalize exclude list (remove -v3, -v2 suffixes)
        exclude_normalized = [p.replace(
            '-v3', '').replace('-v2', '').replace('-', '').lower() for p in exclude_protocols]

        all_yields = await self.get_all_yields()

        # Handle WETH/ETH equivalence
        token_variations = [token.upper()]
        if token.upper() in ['WETH', 'ETH']:
            token_variations = ['WETH', 'ETH']

        best_yield = None
        best_apy = 0

        for key, apy in all_yields.items():
            parts = key.split('_')
            if len(parts) >= 3:
                protocol, chain, token_symbol = parts[0], parts[1], parts[2]

                # Check if protocol is excluded (normalized comparison)
                protocol_normalized = protocol.replace(
                    '-v3', '').replace('-v2', '').replace('-', '').lower()
                if protocol_normalized in exclude_normalized:
                    continue

                # Case-insensitive token comparison with variations
                token_match = token_symbol.upper(
                ) in [tv.upper() for tv in token_variations]

                if token_match and apy > best_apy:
                    best_apy = apy
                    best_yield = {
                        "protocol": protocol,
                        "chain": chain,
                        "token": token_symbol.upper(),
                        "apy": apy,
                        "cross_chain": False
                    }

        if best_yield:
            logger.info(
                f"Best yield for {token}: {best_yield['protocol']} "
                f"({best_yield['chain']}) - {best_yield['apy']:.2f}% APY"
            )
        else:
            logger.warning(
                f"No yields found for {token} (tried: {token_variations})")

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
