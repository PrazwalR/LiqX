"""
1inch Fusion+ Cross-Chain Bridge - Python Wrapper

Provides Python interface to 1inch Fusion+ cross-chain swaps
"""

import os
import json
import subprocess
from typing import Dict, Optional, List
from loguru import logger


class FusionPlusBridge:
    """
    Python wrapper for 1inch Fusion+ cross-chain swaps

    Supports:
    - EVM → EVM (Ethereum, Arbitrum, Optimism, Base, Polygon)
    - EVM → Solana
    - Solana → EVM
    """

    def __init__(self):
        self.node_script = os.path.join(
            os.path.dirname(__file__),
            "dist",
            "fusion_plus_service.js"
        )

        if not os.path.exists(self.node_script):
            raise FileNotFoundError(
                f"Fusion+ service not compiled. Run: npx tsc -p tsconfig.fusion.json"
            )

    def _run_node_command(self, args: List[str]) -> Dict:
        """Execute Node.js command and return JSON result"""
        try:
            cmd = ["node", self.node_script] + args

            # Pass environment variables to Node.js process
            env = os.environ.copy()

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60,
                cwd=os.path.dirname(self.node_script),
                env=env
            )

            if result.returncode != 0:
                logger.error(f"Node command failed: {result.stderr}")
                return {"success": False, "error": result.stderr}

            # Parse JSON output (filter out dotenv and console.log)
            try:
                # Find JSON object in output
                output = result.stdout.strip()

                # Find opening and closing braces
                start_idx = output.rfind('{')
                if start_idx == -1:
                    logger.error(f"No JSON found in output:\n{output}")
                    return {"success": False, "error": "No JSON in response"}

                # Extract from last { to end
                json_str = output[start_idx:]
                # Find the matching closing brace
                brace_count = 0
                end_idx = 0
                for i, char in enumerate(json_str):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            end_idx = i + 1
                            break

                if end_idx == 0:
                    logger.error(f"No complete JSON found:\n{output}")
                    return {"success": False, "error": "Incomplete JSON"}

                json_str = json_str[:end_idx]
                return json.loads(json_str)

            except json.JSONDecodeError as e:
                logger.error(
                    f"Failed to parse JSON: {e}\nOutput: {result.stdout}")
                return {"success": False, "error": "Invalid JSON response"}

        except subprocess.TimeoutExpired:
            logger.error("Node command timed out")
            return {"success": False, "error": "Command timeout"}
        except Exception as e:
            logger.error(f"Error running node command: {e}")
            return {"success": False, "error": str(e)}

    def get_quote(
        self,
        src_chain: str,
        dst_chain: str,
        src_token: str,
        dst_token: str,
        amount: str,
        wallet_address: str
    ) -> Dict:
        """
        Get cross-chain swap quote

        Args:
            src_chain: Source chain (ethereum, arbitrum, optimism, base, polygon, solana)
            dst_chain: Destination chain
            src_token: Source token address
            dst_token: Destination token address
            amount: Amount in wei/lamports (as string)
            wallet_address: User wallet address

        Returns:
            {
                "success": bool,
                "quoteId": str,
                "dstAmount": str,
                "estimatedGas": str,
                "executionTime": int (seconds)
            }
        """
        logger.info(f"🔍 Getting Fusion+ quote: {src_chain} → {dst_chain}")

        args = [
            "quote",
            src_chain,
            dst_chain,
            src_token,
            dst_token,
            amount,
            wallet_address
        ]

        result = self._run_node_command(args)

        if result.get("success"):
            logger.success(
                f"✅ Quote received: {result.get('dstAmount')} tokens")
        else:
            logger.error(f"❌ Quote failed: {result.get('error')}")

        return result

    def get_order_status(self, order_hash: str, src_chain: str) -> Dict:
        """
        Check status of Fusion+ order

        Args:
            order_hash: Order hash from placeOrder
            src_chain: Source chain where order was placed

        Returns:
            {
                "success": bool,
                "status": str (pending, executed, cancelled),
                "fills": list
            }
        """
        logger.info(f"📊 Checking order status: {order_hash[:10]}...")

        args = ["status", order_hash, src_chain]
        result = self._run_node_command(args)

        if result.get("success"):
            logger.info(f"   Status: {result.get('status')}")

        return result


# Convenience functions for swap optimizer

def get_cross_chain_quote(
    from_chain: str,
    to_chain: str,
    from_token: str,
    to_token: str,
    amount_wei: int,
    wallet: str
) -> Optional[Dict]:
    """
    Get cross-chain swap quote using Fusion+

    Returns quote with destination amount and execution time
    """
    try:
        bridge = FusionPlusBridge()
        return bridge.get_quote(
            from_chain,
            to_chain,
            from_token,
            to_token,
            str(amount_wei),
            wallet
        )
    except Exception as e:
        logger.error(f"Failed to get Fusion+ quote: {e}")
        return None


def check_fusion_order_status(order_hash: str, chain: str) -> Optional[Dict]:
    """Check Fusion+ order status"""
    try:
        bridge = FusionPlusBridge()
        return bridge.get_order_status(order_hash, chain)
    except Exception as e:
        logger.error(f"Failed to check order status: {e}")
        return None


if __name__ == "__main__":
    import sys

    # Test with sample quote
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        logger.info("Testing Fusion+ bridge...")

        # Test: Ethereum USDC → Arbitrum USDC
        bridge = FusionPlusBridge()


def test_eth_to_sol():
    """Test ETH -> Solana USDC swap"""
    import os

    logger.info("=" * 60)
    logger.info("TEST: Ethereum -> Solana Cross-Chain Swap")
    logger.info("=" * 60)

    # Ethereum USDC -> Solana USDC
    result = get_quote(
        src_chain="ethereum",
        dst_chain="solana",
        src_token="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",  # USDC on Ethereum
        dst_token="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  # USDC on Solana
        amount_wei="1000000000",  # 1000 USDC (6 decimals)
        wallet_address="0x0000000000000000000000000000000000000001"  # Dummy for quote
    )

    logger.info("\n📊 ETH -> SOL Quote Result:")
    logger.info(f"  Success: {result.get('success')}")
    logger.info(f"  Quote ID: {result.get('quoteId')}")
    logger.info(f"  Destination Amount: {result.get('dstAmount')} (raw wei)")

    if result.get('dstAmount'):
        dst_amount_readable = int(
            result['dstAmount']) / 1_000_000  # USDC has 6 decimals
        logger.info(
            f"  Destination Amount: {dst_amount_readable:.2f} USDC on Solana")

    logger.info(f"  Estimated Gas: ${result.get('estimatedGas', 0)}")
    logger.info(f"  Execution Time: {result.get('executionTime')}s")

    if not result.get('success'):
        logger.error(f"  Error: {result.get('error')}")

    return result


def test_eth_to_arb():
    """Test ETH -> Arbitrum swap (original test)"""
    import os

    logger.info("=" * 60)
    logger.info("TEST: Ethereum -> Arbitrum Cross-Chain Swap")
    logger.info("=" * 60)

    # Ethereum USDC -> Arbitrum USDC
    result = get_quote(
        src_chain="ethereum",
        dst_chain="arbitrum",
        src_token="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",  # USDC on Ethereum
        dst_token="0xaf88d065e77c8cC2239327C5EDb3A432268e5831",  # USDC on Arbitrum
        amount_wei="1000000000",  # 1000 USDC (6 decimals)
        wallet_address="0x0000000000000000000000000000000000000001"  # Dummy for quote
    )

    logger.info("\n📊 ETH -> ARB Quote Result:")
    logger.info(f"  Success: {result.get('success')}")
    logger.info(f"  Quote ID: {result.get('quoteId')}")
    logger.info(f"  Destination Amount: {result.get('dstAmount')} (raw wei)")

    if result.get('dstAmount'):
        dst_amount_readable = int(
            result['dstAmount']) / 1_000_000  # USDC has 6 decimals
        logger.info(
            f"  Destination Amount: {dst_amount_readable:.2f} USDC on Arbitrum")

    logger.info(f"  Estimated Gas: ${result.get('estimatedGas', 0)}")
    logger.info(f"  Execution Time: {result.get('executionTime')}s")

    if not result.get('success'):
        logger.error(f"  Error: {result.get('error')}")

    return result


def main():
    """Run both test cases"""
    # Test 1: ETH -> Arbitrum
    test_eth_to_arb()

    print("\n" + "=" * 60 + "\n")

    # Test 2: ETH -> Solana
    test_eth_to_sol()
