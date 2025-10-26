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

                        # Maximum realistic APY threshold (filter anomalies like 352,603%)
                        MAX_REALISTIC_APY = 100.0  # 100% APY is already very high

                        # Flexible matching
                        for pool in pools:
                            pool_project = pool.get('project', '').lower()
                            pool_chain = pool.get('chain', '').lower()
                            pool_symbol = pool.get('symbol', '').upper()
                            apy = pool.get('apy', 0)

                            # Skip unrealistic APY values (likely data errors)
                            if apy > MAX_REALISTIC_APY:
                                logger.debug(
                                    f"Skipping unrealistic APY: {pool_project} {pool_symbol} - {apy:.2f}% (max: {MAX_REALISTIC_APY}%)")
                                continue

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

    async def get_all_yields(self, token: Optional[str] = None, min_apy: float = 0.0, limit: Optional[int] = None) -> List[Dict]:
        """
        Get yields from ALL protocols by fetching complete DeFi Llama pools data

        Instead of hardcoded list, fetches entire dataset and filters for lending protocols

        Args:
            token: Optional token filter (USDC, ETH, etc.)
            min_apy: Minimum APY threshold
            limit: Maximum number of yields to return (default: all, use 10 for efficiency)

        Returns:
            List of yield dictionaries sorted by APY (highest first):
            [
                {
                    "protocol": "kamino",
                    "chain": "solana",
                    "token": "SOL",
                    "apy": 88.85,
                    "pool": "kaminoliquidity_solana_sol",
                    "tvlUsd": 5000000,
                    "estimated_gas": 0.1
                },
                ...
            ]
        """
        url = f"{self.defillama_base_url}/pools"

        try:
            # Create SSL context
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE

            connector = aiohttp.TCPConnector(ssl=ssl_context)
            async with aiohttp.ClientSession(connector=connector) as session:
                async with session.get(url, timeout=20) as response:
                    if response.status != 200:
                        logger.error(
                            f"DeFi Llama API error: {response.status}")
                        return []

                    data = await response.json()
                    pools = data.get('data', [])

                    logger.info(
                        f"📡 Fetched {len(pools)} pools from DeFi Llama")

                    # Filter for lending protocols only
                    lending_protocols = {
                        'aave', 'aave-v2', 'aave-v3',
                        'compound', 'compound-v2', 'compound-v3',
                        'spark', 'morpho',
                        'kamino', 'solend', 'marginfi', 'drift',
                        'venus', 'benqi', 'radiant',
                        'lido', 'rocket-pool', 'frax'
                    }

                    # Supported chains
                    supported_chains = {
                        'ethereum', 'arbitrum', 'optimism', 'base', 'polygon',
                        'solana', 'avalanche'
                    }

                    # Common tokens we care about
                    supported_tokens = {
                        'ETH', 'WETH', 'STETH', 'RETH',
                        'USDC', 'USDT', 'DAI', 'USDE',
                        'WBTC', 'BTC',
                        'SOL', 'MSOL', 'JSOL'
                    }

                    results = []
                    max_realistic_apy = 100.0  # Filter anomalies

                    for pool in pools:
                        project = pool.get(
                            'project', '').lower().replace('-', '')
                        chain = pool.get('chain', '').lower()
                        symbol = pool.get('symbol', '').upper()
                        apy = pool.get('apy', 0)
                        tvl = pool.get('tvlUsd', 0)

                        # Skip if not a lending protocol
                        if not any(lp in project for lp in lending_protocols):
                            continue

                        # Skip if chain not supported
                        if chain not in supported_chains:
                            continue

                        # Skip unrealistic APYs
                        if apy > max_realistic_apy or apy < min_apy:
                            continue

                        # Skip low TVL pools (< $100k - likely unreliable)
                        if tvl < 100000:
                            continue

                        # Extract token from symbol (e.g., "aUSDC" -> "USDC", "WETH-USDC" -> "WETH")
                        found_token = None
                        for supported_token in supported_tokens:
                            if supported_token in symbol:
                                found_token = supported_token
                                break

                        if not found_token:
                            continue

                        # Token filter
                        if token and found_token.upper() != token.upper():
                            continue

                        # Normalize project name (remove version suffixes, liquidity, finance, etc.)
                        project_normalized = (project
                                              .replace('v3', '').replace('v2', '').replace('v1', '')
                                              .replace('liquidity', '').replace('finance', '')
                                              .replace('-', '').replace('_', '')
                                              .strip()
                                              )

                        # Estimate gas costs based on chain
                        gas_costs = {
                            'ethereum': 50.0,
                            'arbitrum': 5.0,
                            'optimism': 5.0,
                            'base': 5.0,
                            'polygon': 2.0,
                            'solana': 0.1,
                            'avalanche': 3.0
                        }

                        results.append({
                            'protocol': project_normalized,
                            'chain': chain,
                            'token': found_token,
                            'apy': apy,
                            'pool': f"{project_normalized}_{chain}_{found_token}".lower(),
                            'tvlUsd': tvl,
                            'estimated_gas': gas_costs.get(chain, 10.0)
                        })

                    # Sort by APY (highest first)
                    results.sort(key=lambda x: x['apy'], reverse=True)

                    # Apply limit with protocol diversity
                    if limit:
                        # Get diverse protocols instead of all same protocol
                        diverse_results = []
                        protocol_count = {}
                        max_per_protocol = 3  # Maximum 3 pools per protocol

                        logger.debug(
                            f"Applying diversity filter: limit={limit}, max_per_protocol={max_per_protocol}")

                        for pool in results:
                            protocol = pool['protocol']
                            count = protocol_count.get(protocol, 0)

                            # Add if we haven't hit the per-protocol limit
                            if count < max_per_protocol:
                                diverse_results.append(pool)
                                protocol_count[protocol] = count + 1
                                logger.debug(
                                    f"  Added {protocol} (count: {protocol_count[protocol]}): {pool['apy']:.2f}%")

                                # Stop when we reach desired total
                                if len(diverse_results) >= limit:
                                    logger.debug(
                                        f"  Reached limit of {limit} results")
                                    break
                            else:
                                logger.debug(
                                    f"  Skipped {protocol} (already have {count}): {pool['apy']:.2f}%")

                        results = diverse_results
                        protocols_found = len(
                            set(p['protocol'] for p in results))
                        logger.success(
                            f"✅ Loaded top {len(results)} lending yields from {protocols_found} protocols (max {max_per_protocol} per protocol)")
                    else:
                        logger.success(
                            f"✅ Loaded {len(results)} lending yields")

                    # Log top 10 yields
                    if results:
                        logger.info("📊 Top 10 yields:")
                        for i, yield_data in enumerate(results[:10], 1):
                            logger.info(
                                f"   {i}. {yield_data['pool']}: {yield_data['apy']:.2f}%")

                    return results

        except asyncio.TimeoutError:
            logger.error("DeFi Llama API timeout")
        except Exception as e:
            logger.error(f"Failed to fetch all yields: {e}")
            import traceback
            logger.error(traceback.format_exc())

        return []

    async def find_best_yield(
        self,
        token: str,
        exclude_protocols: List[str] = None,
        allow_cross_chain: bool = True,
        min_apy: float = 0.0,
        exclude_chains: List[str] = None
    ) -> Optional[Dict]:
        """
        Find the protocol with the best yield for a token

        Args:
            token: Token symbol (WETH, ETH, USDC, etc.)
            exclude_protocols: List of protocols to exclude
            allow_cross_chain: Whether to include cross-chain opportunities
            min_apy: Minimum APY threshold (for filtering)
            exclude_chains: List of chains to exclude (e.g., ['solana'])

        Returns:
            {
                "protocol": "kamino",
                "chain": "solana",
                "token": "SOL",
                "apy": 88.85,
                "pool": "kaminoliquidity_solana_sol",
                "cross_chain": True,
                "estimated_gas": 0.1
            }
        """
        exclude_protocols = exclude_protocols or []
        exclude_chains = exclude_chains or []

        # Normalize exclude list (remove -v3, -v2 suffixes)
        exclude_normalized = [p.replace(
            '-v3', '').replace('-v2', '').replace('-', '').lower() for p in exclude_protocols]

        # Normalize exclude chains
        exclude_chains_normalized = [c.lower() for c in exclude_chains]

        # Get all yields (already sorted by APY)
        all_yields = await self.get_all_yields(token=token, min_apy=min_apy)

        # Handle token filtering
        if token:
            # Handle WETH/ETH equivalence
            token_variations = [token.upper()]
            if token.upper() in ['WETH', 'ETH']:
                token_variations = ['WETH', 'ETH', 'STETH', 'RETH']
        else:
            # No token filter - accept all tokens
            token_variations = None

        # Find best yield that meets criteria
        for yield_data in all_yields:
            protocol = yield_data['protocol']
            chain = yield_data['chain']
            token_symbol = yield_data['token']

            # Check if chain is excluded
            if chain.lower() in exclude_chains_normalized:
                continue

            # Check if protocol is excluded (normalized comparison)
            protocol_normalized = protocol.replace('-', '').lower()
            if protocol_normalized in exclude_normalized:
                continue

            # Check token match (with variations for ETH/WETH) - skip if no filter
            if token_variations and token_symbol.upper() not in token_variations:
                continue

            # Found the best yield that meets all criteria
            logger.debug(
                f"Best yield: {yield_data['pool']} - {yield_data['apy']:.2f}%")
            return {
                **yield_data,
                'cross_chain': True  # Assume cross-chain for simplicity
            }

        return None

    def _estimate_migration_gas(
        self,
        from_chain: str,
        to_chain: str,
        cross_chain: bool
    ) -> float:
        """
        Estimate gas costs for migration in USD

        Returns gas cost estimate in USD
        """
        # Base gas estimates (USD)
        gas_estimates = {
            # Same chain (Ethereum → Ethereum)
            'same_chain': 25.0,  # Withdraw + Swap + Supply

            # EVM cross-chain (Ethereum → Arbitrum/Optimism)
            'evm_cross_chain': 40.0,  # + Stargate bridge fee

            # Ethereum → Solana
            'eth_to_sol': 50.0,  # + Wormhole bridge fee

            # Solana → Ethereum
            'sol_to_eth': 55.0,  # Higher due to ETH gas
        }

        if not cross_chain:
            return gas_estimates['same_chain']

        # Cross-chain routing
        if from_chain == 'ethereum' and to_chain in ['arbitrum', 'optimism', 'base']:
            return gas_estimates['evm_cross_chain']
        elif from_chain == 'ethereum' and to_chain == 'solana':
            return gas_estimates['eth_to_sol']
        elif from_chain == 'solana' and to_chain == 'ethereum':
            return gas_estimates['sol_to_eth']
        else:
            # Unknown route - use conservative estimate
            return gas_estimates['evm_cross_chain']

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
