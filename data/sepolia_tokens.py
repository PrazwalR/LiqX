"""
Sepolia Testnet Token Address Mappings
Maps Aave V3 Sepolia token addresses to their symbols for price lookups
"""

# Aave V3 Sepolia Token Addresses
# Source: https://docs.aave.com/developers/deployed-contracts/v3-testnet-addresses
SEPOLIA_TOKEN_MAP = {
    # Main tokens
    "0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8": "USDC",  # Aave Sepolia USDC
    "0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0": "USDT",  # Aave Sepolia USDT  
    "0xf8fb3713d459d7c1018bd0a49d19b4c44290ebe5": "WETH",  # Aave Sepolia WETH
    "0x6d906e526a4e2ca02097ba9d0caa3c382f52278e": "DAI",   # Aave Sepolia DAI
    "0xc4bf5cbdabe595361438f8c6a187bdc330539c60": "DAI",   # Alternative DAI address
    "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238": "USDC",  # Alternative USDC
    "0x8267cf9254734c6eb452a7bb9aaf97b392258b21": "WETH",  # Alternative WETH
}

def get_token_symbol(address: str) -> str:
    """
    Get token symbol from Sepolia address
    
    Args:
        address: Token contract address (checksummed or lowercase)
        
    Returns:
        Token symbol or original address if not found
    """
    if not address:
        return "UNKNOWN"
    
    # Normalize to lowercase for lookup
    normalized = address.lower()
    
    # Check if it's a known token
    if normalized in SEPOLIA_TOKEN_MAP:
        return SEPOLIA_TOKEN_MAP[normalized]
    
    # Return original if unknown (will fallback to demo prices)
    return address[:10] if len(address) > 10 else address
