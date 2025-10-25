import { NextResponse } from 'next/server';

/**
 * Market Prices API
 * 
 * Fetches price data from CoinGecko
 * Supports multiple tokens via comma-separated list
 */

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

// Token symbol to CoinGecko ID mapping
const TOKEN_ID_MAP: Record<string, string> = {
  ETH: 'ethereum',
  WETH: 'ethereum',
  WBTC: 'wrapped-bitcoin',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  UNI: 'uniswap',
  AAVE: 'aave',
  LIDO: 'lido-dao',
};

interface TokenPrice {
  token: string;
  symbol: string;
  currentPrice: number;
  change24h: number;
  change7d: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokensParam = searchParams.get('tokens') || searchParams.get('token') || 'ETH';
  const mode = searchParams.get('mode') || 'presentation';

  // Parse tokens (supports both single token and comma-separated list)
  const tokenList = tokensParam.split(',').map(t => t.trim().toUpperCase());

  // Demo mode - return mock data for all tokens
  if (mode === 'demo') {
    const mockPrices = tokenList.map(token => generateMockTokenPrice(token));
    return NextResponse.json({ prices: mockPrices });
  }

  try {
    // Fetch data for all requested tokens in parallel
    const pricePromises = tokenList.map(async (token): Promise<TokenPrice | null> => {
      const tokenId = TOKEN_ID_MAP[token];

      if (!tokenId) {
        console.warn(`Unknown token: ${token}`);
        return null;
      }

      try {
        // Fetch current market data
        const marketUrl = `https://api.coingecko.com/api/v3/coins/${tokenId}`;
        const marketParams = new URLSearchParams({
          localization: 'false',
          tickers: 'false',
          community_data: 'false',
          developer_data: 'false',
          sparkline: 'false',
        });

        if (COINGECKO_API_KEY) {
          marketParams.append('x_cg_demo_api_key', COINGECKO_API_KEY);
        }

        const marketResponse = await fetch(`${marketUrl}?${marketParams}`, {
          next: { revalidate: 60 },
        });

        if (!marketResponse.ok) {
          console.error(`CoinGecko error for ${token}: ${marketResponse.status}`);
          return null;
        }

        const marketData = await marketResponse.json();

        return {
          token: token,
          symbol: token,
          currentPrice: marketData.market_data?.current_price?.usd || 0,
          change24h: marketData.market_data?.price_change_percentage_24h || 0,
          change7d: marketData.market_data?.price_change_percentage_7d || 0,
          high24h: marketData.market_data?.high_24h?.usd || 0,
          low24h: marketData.market_data?.low_24h?.usd || 0,
          volume24h: marketData.market_data?.total_volume?.usd || 0,
          marketCap: marketData.market_data?.market_cap?.usd || 0,
        };
      } catch (error) {
        console.error(`Error fetching ${token}:`, error);
        return null;
      }
    });

    const results = await Promise.all(pricePromises);
    const validPrices = results.filter((p): p is TokenPrice => p !== null);

    return NextResponse.json({
      prices: validPrices,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Market prices API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market prices' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock token price for demo mode
 */
function generateMockTokenPrice(token: string): TokenPrice {
  const basePrice = token === 'ETH' ? 3800 :
    token === 'WBTC' ? 65000 :
      token === 'WETH' ? 3800 :
        1;

  const currentPrice = basePrice * (0.95 + Math.random() * 0.1);
  const change24h = -5 + Math.random() * 10;
  const change7d = -10 + Math.random() * 20;

  return {
    token: token,
    symbol: token,
    currentPrice,
    change24h,
    change7d,
    high24h: currentPrice * 1.05,
    low24h: currentPrice * 0.95,
    volume24h: currentPrice * 1000000000,
    marketCap: currentPrice * 120000000,
  };
}
