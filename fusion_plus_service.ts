/**
 * 1inch Fusion+ Cross-Chain Swap Service
 * 
 * Provides cross-chain swap functionality using 1inch Fusion+
 * - EVM → EVM (Ethereum, Arbitrum, Optimism, Base, Polygon)
 * - EVM → Solana
 * - Solana → EVM
 */

import {
  SDK,
  HashLock,
  NetworkEnum,
  QuoteParams,
  SupportedChain,
  PrivateKeyProviderConnector,
  Quote,
} from "@1inch/cross-chain-sdk";
import { randomBytes } from "crypto";
import { JsonRpcProvider, Wallet } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from project root
const result = dotenv.config({ path: path.join(__dirname, '..', '.env') });
// Suppress debug output by catching it early
if (result.error && process.env.NODE_ENV !== 'production') {
  console.error('Failed to load .env:', result.error);
}

// Chain ID mapping
const CHAIN_MAP: Record<string, NetworkEnum> = {
  "ethereum": NetworkEnum.ETHEREUM,
  "arbitrum": NetworkEnum.ARBITRUM,
  "optimism": NetworkEnum.OPTIMISM,
  "base": NetworkEnum.COINBASE,
  "polygon": NetworkEnum.POLYGON,
  "solana": NetworkEnum.SOLANA,
};

// RPC URLs
const RPC_URLS: Record<string, string> = {
  "ethereum": process.env.ETHEREUM_RPC_URL || "https://eth.llamarpc.com",
  "arbitrum": process.env.ARBITRUM_RPC_URL || "https://arbitrum.llamarpc.com",
  "optimism": process.env.OPTIMISM_RPC_URL || "https://optimism.llamarpc.com",
  "base": process.env.BASE_RPC_URL || "https://base.llamarpc.com",
  "polygon": process.env.POLYGON_RPC_URL || "https://polygon.llamarpc.com",
};

interface CrossChainQuoteRequest {
  srcChain: string;
  dstChain: string;
  srcToken: string;
  dstToken: string;
  amount: string;
  walletAddress: string;
}

interface CrossChainQuoteResponse {
  success: boolean;
  quoteId?: string;
  dstAmount?: string;
  estimatedGas?: string;
  executionTime?: number;
  error?: string;
}

interface CrossChainExecuteRequest {
  quoteId: string;
  srcChain: string;
  dstChain: string;
  srcToken: string;
  dstToken: string;
  amount: string;
  walletAddress: string;
  privateKey: string;
  receiverAddress?: string;
}

interface CrossChainExecuteResponse {
  success: boolean;
  orderHash?: string;
  srcTxHash?: string;
  dstTxHash?: string;
  error?: string;
}

class FusionPlusService {
  private apiKey: string;
  private sdk: SDK | null = null;

  constructor() {
    this.apiKey = process.env.ONEINCH_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("ONEINCH_API_KEY not found in environment");
    }
  }

  private initializeSDK(privateKey: string | null, srcChain: string): SDK {
    const rpcUrl = RPC_URLS[srcChain];
    const provider = new JsonRpcProvider(rpcUrl);

    const ethersProviderConnector = {
      eth: {
        call(transactionConfig: any): Promise<string> {
          return provider.call(transactionConfig);
        },
      },
      extend(): void { },
    };

    // For quotes, we don't need a real private key
    const config: any = {
      url: "https://api.1inch.dev/fusion-plus",
      authKey: this.apiKey,
    };

    if (privateKey) {
      const blockchainProvider = new PrivateKeyProviderConnector(
        privateKey,
        ethersProviderConnector as any,
      );
      config.blockchainProvider = blockchainProvider;
    }

    return new SDK(config);
  }

  private getRandomBytes32(): string {
    return "0x" + randomBytes(32).toString("hex");
  }

  /**
   * Get a quote for cross-chain swap
   */
  async getQuote(request: CrossChainQuoteRequest): Promise<CrossChainQuoteResponse> {
    try {
      console.log("🔍 Getting Fusion+ quote...");
      console.log(`   Route: ${request.srcChain} → ${request.dstChain}`);
      console.log(`   Tokens: ${request.srcToken} → ${request.dstToken}`);
      console.log(`   Amount: ${request.amount}`);

      // Initialize SDK without private key for quotes
      const sdk = this.initializeSDK(null, request.srcChain);

      const params: QuoteParams = {
        srcChainId: CHAIN_MAP[request.srcChain] as SupportedChain,
        dstChainId: CHAIN_MAP[request.dstChain] as SupportedChain,
        srcTokenAddress: request.srcToken,
        dstTokenAddress: request.dstToken,
        amount: request.amount,
        enableEstimate: true,
        walletAddress: request.walletAddress,
      };

      const quote: Quote = await sdk.getQuote(params);

      // Get recommended preset
      const preset = quote.getPreset(quote.recommendedPreset);

      console.log("✅ Quote received!");
      console.log(`   Destination amount: ${quote.dstTokenAmount}`);
      console.log(`   Recommended preset: ${quote.recommendedPreset}`);
      console.log(`   Auction duration: ${preset.auctionDuration}s`);

      return {
        success: true,
        quoteId: quote.quoteId || undefined,
        dstAmount: quote.dstTokenAmount.toString(),
        estimatedGas: "0", // Fusion+ is gas-free for maker
        executionTime: Number(preset.auctionDuration),
      };
    } catch (error: any) {
      console.error("❌ Quote error:", error.message);
      return {
        success: false,
        error: error.message || "Failed to get quote",
      };
    }
  }

  /**
   * Execute cross-chain swap
   */
  async executeSwap(request: CrossChainExecuteRequest): Promise<CrossChainExecuteResponse> {
    try {
      console.log("⚡ Executing Fusion+ cross-chain swap...");

      // Initialize SDK with real private key
      const sdk = this.initializeSDK(request.privateKey, request.srcChain);

      // Get fresh quote
      const params: QuoteParams = {
        srcChainId: CHAIN_MAP[request.srcChain] as SupportedChain,
        dstChainId: CHAIN_MAP[request.dstChain] as SupportedChain,
        srcTokenAddress: request.srcToken,
        dstTokenAddress: request.dstToken,
        amount: request.amount,
        enableEstimate: true,
        walletAddress: request.walletAddress,
      };

      console.log("📋 Fetching quote...");
      const quote: Quote = await sdk.getQuote(params);

      // Generate secrets for escrow
      const preset = quote.getPreset(quote.recommendedPreset);
      const secretsCount = preset.secretsCount;

      console.log(`🔐 Generating ${secretsCount} secrets...`);
      const secrets = Array.from({ length: secretsCount }).map(() =>
        this.getRandomBytes32()
      );
      const secretHashes = secrets.map((x) => HashLock.hashSecret(x));

      // Create hashlock
      const hashLock =
        secretsCount === 1
          ? HashLock.forSingleFill(secrets[0])
          : HashLock.forMultipleFills(
            HashLock.getMerkleLeaves(secrets)
          );

      console.log("📝 Placing order...");
      const orderResponse = await sdk.placeOrder(quote, {
        walletAddress: request.walletAddress,
        hashLock,
        secretHashes,
      });

      const orderHash = orderResponse.orderHash;
      console.log(`✅ Order placed: ${orderHash}`);

      // Monitor for fills and submit secrets
      console.log("⏳ Waiting for resolver to fill order...");

      const maxWaitTime = 300000; // 5 minutes
      const startTime = Date.now();
      const pollInterval = 10000; // 10 seconds

      while (Date.now() - startTime < maxWaitTime) {
        try {
          // Check order status
          const order = await sdk.getOrderStatus(orderHash);

          if (order.status === "executed") {
            console.log("✅ Swap completed successfully!");
            return {
              success: true,
              orderHash: orderHash,
              srcTxHash: orderHash, // Fusion+ uses order hash as reference
              dstTxHash: orderHash,
            };
          }

          // Check for fills ready to accept secrets
          const fillsObject = await sdk.getReadyToAcceptSecretFills(orderHash);

          if (fillsObject.fills.length > 0) {
            console.log(`🔓 Submitting secrets for ${fillsObject.fills.length} fills...`);

            for (const fill of fillsObject.fills) {
              try {
                await sdk.submitSecret(orderHash, secrets[fill.idx]);
                console.log(`   ✅ Secret submitted for fill index ${fill.idx}`);
              } catch (error: any) {
                console.error(`   ❌ Error submitting secret: ${error.message}`);
              }
            }
          }

          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        } catch (error: any) {
          console.error(`Poll error: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      }

      // Timeout
      return {
        success: false,
        orderHash: orderHash,
        error: "Swap timed out waiting for resolver",
      };

    } catch (error: any) {
      console.error("❌ Execution error:", error.message);
      return {
        success: false,
        error: error.message || "Failed to execute swap",
      };
    }
  }

  /**
   * Check order status
   */
  async getOrderStatus(orderHash: string, srcChain: string): Promise<any> {
    try {
      const sdk = this.initializeSDK(null, srcChain);

      const status = await sdk.getOrderStatus(orderHash);
      return {
        success: true,
        status: status.status,
        fills: status.fills || [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export service instance
const fusionPlusService = new FusionPlusService();

// CLI interface for testing
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "quote") {
    const [srcChain, dstChain, srcToken, dstToken, amount, wallet] = args.slice(1);

    fusionPlusService.getQuote({
      srcChain,
      dstChain,
      srcToken,
      dstToken,
      amount,
      walletAddress: wallet,
    }).then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    });
  } else if (command === "status") {
    const [orderHash, srcChain] = args.slice(1);

    fusionPlusService.getOrderStatus(orderHash, srcChain).then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    });
  } else {
    console.log("Usage:");
    console.log("  node fusion_plus_service.ts quote <srcChain> <dstChain> <srcToken> <dstToken> <amount> <wallet>");
    console.log("  node fusion_plus_service.ts status <orderHash> <srcChain>");
    process.exit(1);
  }
}

export { FusionPlusService, fusionPlusService };
