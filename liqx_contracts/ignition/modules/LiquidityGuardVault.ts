import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * LiquidityGuardVault Deployment Module
 * 
 * This module deploys the LiqX LiquidityGuardVault contract with protocol addresses.
 * Supports Ethereum Mainnet, Sepolia testnet, and other networks.
 */

// ============================================
// ETHEREUM MAINNET ADDRESSES
// ============================================
const MAINNET_ADDRESSES = {
  AAVE_POOL: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", // Aave V3 Pool
  LIDO: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", // Lido stETH
  WSTETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", // Wrapped stETH
  COMPOUND_COMPTROLLER: "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B", // Compound V2 Comptroller
  ONEINCH_ROUTER: "0x1111111254EEB25477B68fb85Ed929f73A960582", // 1inch Aggregation Router V5
  UNISWAP_V3_ROUTER: "0xE592427A0AEce92De3Edee1F18E0157C05861564", // Uniswap V3 SwapRouter
  UNISWAP_V2_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Mainnet
};

// ============================================
// SEPOLIA TESTNET ADDRESSES
// ============================================
const SEPOLIA_ADDRESSES = {
  AAVE_POOL: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", // Aave V3 Pool on Sepolia
  LIDO: "0x3e3FE7dBc6B4C189E7128855dD526361c49b40Af", // Lido stETH on Sepolia
  WSTETH: "0xB82381A3fBD3FaFA77B3a7bE693342618240067b", // Wrapped stETH on Sepolia
  COMPOUND_COMPTROLLER: "0x0000000000000000000000000000000000000001", // Placeholder - deploy mock for testing
  ONEINCH_ROUTER: "0x1111111254EEB25477B68fb85Ed929f73A960582", // 1inch V5 on Sepolia
  UNISWAP_V3_ROUTER: "0x3bFA4769FB09eefC5a80d6e87c3B9C650f7Ae48E", // Uniswap V3 SwapRouter on Sepolia
  UNISWAP_V2_ROUTER: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008", // Uniswap V2 Router on Sepolia
  USDC: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", // USDC on Sepolia
};

// ============================================
// DEPLOYMENT MODULE
// ============================================
export default buildModule("LiquidityGuardVaultModule", (m) => {
  // Default to Sepolia addresses for testing
  // To deploy on mainnet, manually change to MAINNET_ADDRESSES
  const addresses = SEPOLIA_ADDRESSES;
  const networkName = "sepolia";
  
  console.log(`\n🚀 Deploying LiquidityGuardVault on ${networkName}...`);
  console.log(`📍 Protocol Addresses:`);
  console.log(`  - Aave Pool: ${addresses.AAVE_POOL}`);
  console.log(`  - Lido (stETH): ${addresses.LIDO}`);
  console.log(`  - WstETH: ${addresses.WSTETH}`);
  console.log(`  - Compound Comptroller: ${addresses.COMPOUND_COMPTROLLER}`);
  console.log(`  - 1inch Router V5: ${addresses.ONEINCH_ROUTER}`);
  console.log(`  - Uniswap V3 Router: ${addresses.UNISWAP_V3_ROUTER}`);
  console.log(`  - Uniswap V2 Router: ${addresses.UNISWAP_V2_ROUTER}`);
  console.log(`  - USDC: ${addresses.USDC}\n`);

  // Deploy LiquidityGuardVault with all 8 constructor parameters
  const vault = m.contract("LiquidityGuardVault", [
    addresses.AAVE_POOL,
    addresses.LIDO,
    addresses.WSTETH,
    addresses.COMPOUND_COMPTROLLER,
    addresses.ONEINCH_ROUTER,
    addresses.UNISWAP_V3_ROUTER,
    addresses.UNISWAP_V2_ROUTER,
    addresses.USDC,
  ]);

  // Call afterDeploy to log deployment info
  m.call(vault, "hasRole", [
    "0x0000000000000000000000000000000000000000000000000000000000000000", // DEFAULT_ADMIN_ROLE
    m.getAccount(0),
  ], { id: "verify_admin_role" });

  console.log(`✅ LiquidityGuardVault deployment configured`);
  console.log(`📝 Deployer will receive DEFAULT_ADMIN_ROLE\n`);
  console.log(`⚠️  Note: Remember to call grantAgentRole() for AI agents after deployment\n`);

  return { vault };
});