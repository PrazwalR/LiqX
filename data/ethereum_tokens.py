"""
Ethereum Mainnet Token Address Mappings
Maps Aave V3 Ethereum mainnet token addresses to their symbols for price lookups
"""

# Aave V3 Ethereum Mainnet Token Addresses
# Source: https://docs.aave.com/developers/deployed-contracts/v3-mainnet
ETHEREUM_TOKEN_MAP = {
    # Main tokens on Aave V3 Ethereum
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",  # USD Coin
    "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",  # Tether USD
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "WETH",  # Wrapped Ether
    "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",   # Dai Stablecoin
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "WBTC",  # Wrapped Bitcoin
    "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": "AAVE",  # Aave Token
    "0x514910771af9ca656af840dff83e8264ecf986ca": "LINK",  # Chainlink
    "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": "UNI",   # Uniswap
    "0x6810e776880c02933d47db1b9fc05908e5386b96": "GNO",   # Gnosis
    "0xae78736cd615f374d3085123a210448e74fc6393": "rETH",  # Rocket Pool ETH
}

def get_token_symbol(address: str) -> str:
    """
    Get token symbol from Ethereum mainnet address
    
    Args:
        address: Token contract address (checksummed or lowercase)
        
    Returns:
        Token symbol or "UNKNOWN" if not found
    """
    if not address:
        return "UNKNOWN"
    
    # Normalize to lowercase for lookup
    normalized = address.lower()
    
    # Check if it's a known token
    if normalized in ETHEREUM_TOKEN_MAP:
        return ETHEREUM_TOKEN_MAP[normalized]
    
    # Return UNKNOWN for unmapped tokens
    return "UNKNOWN"
