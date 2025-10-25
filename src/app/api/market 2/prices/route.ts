import { NextResponse } from 'next/server';

/**
 * Market Prices API
 * 
 * Fetches historical price data from CoinGecko for charting
 * Supports: ETH, WBTC, USDC, DAI, and other major tokens
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
  LINK: 'chainlink',
  UNI: 'uniswap',
  AAVE: 'aave',
  LIDO: 'lido-dao',
};

interface PricePoint {
  timestamp: number;
  price: number;
}

interface MarketData {
  token: string;
  prices: PricePoint[];
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
  const token = searchParams.get('token') || 'ETH';
  const days = searchParams.get('days') || '7'; // 1, 7, 30, 90, 365
  const mode = searchParams.get('mode') || 'presentation';

  // Demo mode - return mock data
  if (mode === 'demo') {
    return NextResponse.json(generateMockMarketData(token, parseInt(days)));
  }

  try {
    const tokenId = TOKEN_ID_MAP[token.toUpperCase()];
    
    if (!tokenId) {
      return NextResponse.json(
        { error: `Unknown token: ${token}` },
        { status: 400 }
      );
    }

    // Fetch historical prices (chart data)
    const pricesUrl = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart`;
    const pricesParams = new URLSearchParams({
      vs_currency: 'usd',
      days: days,
      interval: days === '1' ? 'hourly' : 'daily',
    });

    if (COINGECKO_API_KEY) {
      pricesParams.append('x_cg_demo_api_key', COINGECKO_API_KEY);
    }

    const pricesResponse = await fetch(`${pricesUrl}?${pricesParams}`, {
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!pricesResponse.ok) {
      throw new Error(`CoinGecko API error: ${pricesResponse.status}`);
    }

    const pricesData = await pricesResponse.json();

    // Fetch current market data (price, volume, etc.)
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
      throw new Error(`CoinGecko market API error: ${marketResponse.status}`);
    }

    const marketData = await marketResponse.json();

    // Transform to our format
    const prices: PricePoint[] = pricesData.prices.map(
      ([timestamp, price]: [number, number]) => ({
        timestamp,
        price,
      })
    );

    const result: MarketData = {
      token: token.toUpperCase(),
      prices,
      currentPrice: marketData.market_data.current_price.usd,
      change24h: marketData.market_data.price_change_percentage_24h || 0,
      change7d: marketData.market_data.price_change_percentage_7d || 0,
      high24h: marketData.market_data.high_24h.usd,
      low24h: marketData.market_data.low_24h.usd,
      volume24h: marketData.market_data.total_volume.usd,
      marketCap: marketData.market_data.market_cap.usd,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Market prices API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock market data for demo mode
 */
function generateMockMarketData(token: string, days: number): MarketData {
  const now = Date.now();
  const basePrice = token === 'ETH' ? 3800 : token === 'WBTC' ? 65000 : 1;
  
  // Generate realistic price movements
  const prices: PricePoint[] = [];
  const hoursPerDay = 24;
  const totalPoints = days * hoursPerDay;
  
  let currentPrice = basePrice;
  
  for (let i = 0; i < totalPoints; i++) {
    const timestamp = now - (totalPoints - i) * 60 * 60 * 1000;
    
    // Add some volatility (random walk)
    const volatility = basePrice * 0.02; // 2% volatility
    const change = (Math.random() - 0.5) * volatility;
    currentPrice += change;
    
    // Add trend (slight downward for demo drama)
    currentPrice -= basePrice * 0.0005;
    
    prices.push({
      timestamp,
      price: currentPrice,
    });
  }

  const high24h = Math.max(...prices.slice(-24).map(p => p.price));
  const low24h = Math.min(...prices.slice(-24).map(p => p.price));
  const price24hAgo = prices[prices.length - 24]?.price || currentPrice;
  const change24h = ((currentPrice - price24hAgo) / price24hAgo) * 100;
  
  const price7dAgo = prices[0]?.price || currentPrice;
  const change7d = ((currentPrice - price7dAgo) / price7dAgo) * 100;

  return {
    token: token.toUpperCase(),
    prices,
    currentPrice,
    change24h,
    change7d,
    high24h,
    low24h,
    volume24h: currentPrice * 1000000000, // Mock volume
    marketCap: currentPrice * 120000000, // Mock market cap
  };
}
