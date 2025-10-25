import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import dotenv from "dotenv";

dotenv.config();

const LIDO_SEPOLIA = "0x3e3fE7dbc6B4C189e7128855dd526361c49b40aF";
const WSTETH_SEPOLIA = "0xb82381a3FBD3faFA77b3A7Be693342618240067B";
const COMPOUND_COMPTROLLER_SEPOLIA = "0x0000000000000000000000000000000000000000"; // Placeholder: No official Compound deployment on Sepolia; use a mock/fork for testing
const ONE_INCH_ROUTER_SEPOLIA = "0x1111111254EEB25477B68fb85Ed929f73A960582";
const UNISWAP_V3_ROUTER_SEPOLIA = "0x3BFa4769fb09eEfC5A80D6e87C3B9c650f7AE48e";
const UNISWAP_V2_ROUTER_SEPOLIA = "0xee567fE1712FaF6149D80dA1e6934e354124cfE3";

export default buildModule("LiquidityGuardVaultModule", (m) => {
  const vault = m.contract("LiquidityGuardVault", [
    LIDO_SEPOLIA,
    WSTETH_SEPOLIA,
    COMPOUND_COMPTROLLER_SEPOLIA,
    ONE_INCH_ROUTER_SEPOLIA,
    UNISWAP_V3_ROUTER_SEPOLIA,
    UNISWAP_V2_ROUTER_SEPOLIA,
  ]);

  return { vault };
});