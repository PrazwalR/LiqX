"""
Real-time Gas Price Estimation
Fetches current Ethereum gas prices and estimates swap costs
"""

import os
import aiohttp
import asyncio
from typing import Optional, Dict
from loguru import logger
from dotenv import load_dotenv

load_dotenv()


class GasEstimator:
    """
    Fetch real-time gas prices and estimate transaction costs
    """

    def __init__(self):
        self.etherscan_api_key = os.getenv('ETHERSCAN_API_KEY')
        self.etherscan_url = "https://api.etherscan.io/api"

        # Gas usage estimates (in gas units) for different operations
        self.gas_estimates = {
            'withdraw': 150000,      # Withdraw collateral from protocol
            'swap': 200000,          # Token swap (1inch/Uniswap)
            'deposit': 150000,       # Deposit to new protocol
            'approve': 50000,        # Token approval
            'bridge': 300000,        # Cross-chain bridge
        }

        logger.info("⛽ GasEstimator initialized")
        logger.info(
            f"   Etherscan API: {'Configured' if self.etherscan_api_key else 'Not configured'}")

    async def get_current_gas_price(self) -> Optional[Dict[str, float]]:
        """
        Get current gas prices from Etherscan

        Returns:
            Dict with 'slow', 'standard', 'fast' gas prices in Gwei
        """
        if not self.etherscan_api_key:
            logger.warning(
                "Etherscan API key not configured, using fallback gas prices")
            return {
                'slow': 20.0,      # 20 Gwei
                'standard': 30.0,   # 30 Gwei
                'fast': 50.0        # 50 Gwei
            }

        try:
            params = {
                'module': 'gastracker',
                'action': 'gasoracle',
                'apikey': self.etherscan_api_key
            }

            async with aiohttp.ClientSession() as session:
                async with session.get(self.etherscan_url, params=params, timeout=aiohttp.ClientTimeout(total=5)) as response:
                    if response.status == 200:
                        data = await response.json()

                        if data.get('status') == '1' and data.get('result'):
                            result = data['result']
                            gas_prices = {
                                'slow': float(result.get('SafeGasPrice', 20)),
                                'standard': float(result.get('ProposeGasPrice', 30)),
                                'fast': float(result.get('FastGasPrice', 50))
                            }

                            logger.info(
                                f"⛽ Real gas prices: Slow={gas_prices['slow']} | Standard={gas_prices['standard']} | Fast={gas_prices['fast']} Gwei")
                            return gas_prices

                    logger.warning(
                        f"Etherscan API returned status {response.status}")

        except Exception as e:
            logger.warning(f"Failed to fetch gas prices: {e}")

        # Fallback to reasonable estimates
        return {
            'slow': 20.0,
            'standard': 30.0,
            'fast': 50.0
        }

    async def estimate_rebalance_cost(
        self,
        amount_usd: float,
        eth_price: float,
        cross_chain: bool = False,
        speed: str = 'standard'
    ) -> Dict[str, float]:
        """
        Estimate total cost for a rebalancing operation

        Args:
            amount_usd: Amount being moved in USD
            eth_price: Current ETH price in USD
            cross_chain: Whether this involves cross-chain transfer
            speed: Gas speed tier ('slow', 'standard', 'fast')

        Returns:
            Dict with cost breakdown
        """
        gas_prices = await self.get_current_gas_price()
        gas_price_gwei = gas_prices.get(speed, 30.0)

        # Calculate total gas needed
        total_gas = (
            self.gas_estimates['approve'] +      # Approve token
            self.gas_estimates['withdraw'] +     # Withdraw from source
            self.gas_estimates['swap']           # Swap token
        )

        if cross_chain:
            total_gas += self.gas_estimates['bridge']  # Bridge to new chain

        total_gas += self.gas_estimates['deposit']  # Deposit to target

        # Convert to ETH cost
        # 1 Gwei = 0.000000001 ETH
        gas_cost_eth = (total_gas * gas_price_gwei) / 1e9
        gas_cost_usd = gas_cost_eth * eth_price

        # Add slippage buffer (0.2% of amount)
        slippage_cost = amount_usd * 0.002

        # Total cost
        total_cost = gas_cost_usd + slippage_cost

        logger.info(f"💰 Rebalance cost estimate:")
        logger.info(
            f"   Gas: {total_gas:,} units @ {gas_price_gwei} Gwei = ${gas_cost_usd:.2f}")
        logger.info(f"   Slippage (0.2%): ${slippage_cost:.2f}")
        logger.info(f"   Total: ${total_cost:.2f}")

        return {
            'gas_units': total_gas,
            'gas_price_gwei': gas_price_gwei,
            'gas_cost_eth': gas_cost_eth,
            'gas_cost_usd': gas_cost_usd,
            'slippage_cost': slippage_cost,
            'total_cost': total_cost,
            'speed': speed,
            'cross_chain': cross_chain
        }

    async def compare_gas_methods(
        self,
        amount_usd: float,
        eth_price: float,
        cross_chain: bool = False
    ) -> Dict[str, Dict[str, float]]:
        """
        Compare costs between Fusion+ (gasless) and traditional swaps

        Returns:
            Dict with 'fusion_plus' and 'traditional' cost breakdowns
        """
        # Fusion+ is gasless - users only pay slippage
        fusion_cost = {
            'gas_cost_usd': 0.0,
            'slippage_cost': amount_usd * 0.002,  # 0.2% slippage
            'total_cost': amount_usd * 0.002,
            'gasless': True
        }

        # Traditional swap requires gas payment
        traditional = await self.estimate_rebalance_cost(
            amount_usd=amount_usd,
            eth_price=eth_price,
            cross_chain=cross_chain,
            speed='standard'
        )

        savings = traditional['total_cost'] - fusion_cost['total_cost']

        logger.success(f"💎 Fusion+ saves ${savings:.2f} vs traditional swap")

        return {
            'fusion_plus': fusion_cost,
            'traditional': traditional,
            'savings_usd': savings
        }


# Singleton instance
_gas_estimator = None


def get_gas_estimator() -> GasEstimator:
    """Get global GasEstimator instance"""
    global _gas_estimator
    if _gas_estimator is None:
        _gas_estimator = GasEstimator()
    return _gas_estimator
