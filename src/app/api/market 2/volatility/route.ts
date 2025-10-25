import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { VolatilityData } from '@/lib/types';
import { calculateVolatility } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || 'ethereum';
    const mode = searchParams.get('mode') || 'presentation';
    
    // Demo mode: return mock volatility data
    if (mode === 'demo') {
      const mockVolatility: VolatilityData = {
        token,
        volatility24h: Math.random() * 0.05 + 0.02, // 2-7%
        volatility7d: Math.random() * 0.08 + 0.03, // 3-11%
        riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        trendDirection: Math.random() > 0.5 ? 'up' : 'down',
        timestamp: Date.now(),
      };
      
      return NextResponse.json(mockVolatility);
    }
    
    // Presentation mode: calculate from real price data
    try {
      // Fetch 24h price data
      const response24h = await fetch(
        `${API_CONFIG.coingecko.baseUrl}/coins/${token}/market_chart?vs_currency=usd&days=1&interval=hourly`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Fetch 7d price data
      const response7d = await fetch(
        `${API_CONFIG.coingecko.baseUrl}/coins/${token}/market_chart?vs_currency=usd&days=7&interval=daily`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response24h.ok || !response7d.ok) {
        throw new Error('Failed to fetch price data');
      }
      
      const data24h = await response24h.json();
      const data7d = await response7d.json();
      
      // Extract price values
      const prices24h = data24h.prices?.map((p: [number, number]) => p[1]) || [];
      const prices7d = data7d.prices?.map((p: [number, number]) => p[1]) || [];
      
      // Calculate volatility
      const volatility24h = calculateVolatility(prices24h);
      const volatility7d = calculateVolatility(prices7d);
      
      // Determine risk level based on 24h volatility
      let riskLevel: 'low' | 'medium' | 'high';
      if (volatility24h < 0.02) {
        riskLevel = 'low';
      } else if (volatility24h < 0.05) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'high';
      }
      
      // Determine trend direction
      const firstPrice = prices24h[0];
      const lastPrice = prices24h[prices24h.length - 1];
      const trendDirection = lastPrice > firstPrice ? 'up' : 'down';
      
      const result: VolatilityData = {
        token,
        volatility24h,
        volatility7d,
        riskLevel,
        trendDirection,
        timestamp: Date.now(),
      };
      
      return NextResponse.json(result);
      
    } catch (error) {
      console.error('Failed to fetch real volatility data:', error);
      
      // Fallback to mock data
      const fallbackVolatility: VolatilityData = {
        token,
        volatility24h: 0.035,
        volatility7d: 0.052,
        riskLevel: 'medium',
        trendDirection: 'down',
        timestamp: Date.now(),
      };
      
      return NextResponse.json(fallbackVolatility);
    }
    
  } catch (error) {
    console.error('Volatility API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to calculate volatility',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

// POST endpoint to calculate volatility for multiple tokens
export async function POST(request: Request) {
  try {
    const { tokens, mode } = await request.json();
    
    if (!tokens || !Array.isArray(tokens)) {
      return NextResponse.json(
        { error: 'Invalid request: tokens array required' },
        { status: 400 }
      );
    }
    
    // Fetch volatility for all tokens in parallel
    const volatilityPromises = tokens.map(async (token: string) => {
      try {
        const response = await fetch(
          `${request.url.split('?')[0]}?token=${token}&mode=${mode || 'presentation'}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch volatility for ${token}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Failed to calculate volatility for ${token}:`, error);
        
        // Return mock data for failed tokens
        return {
          token,
          volatility24h: 0.03,
          volatility7d: 0.05,
          riskLevel: 'medium',
          trendDirection: 'down',
          timestamp: Date.now(),
        };
      }
    });
    
    const results = await Promise.all(volatilityPromises);
    
    return NextResponse.json({
      volatilities: results,
      timestamp: Date.now(),
    });
    
  } catch (error) {
    console.error('Batch volatility API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to calculate batch volatility',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
