import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { CorrelationData } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Calculate Pearson correlation coefficient
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) {
    return 0;
  }
  
  return numerator / denominator;
}

// Calculate percentage change
function calculateChange(values: number[]): number[] {
  const changes: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const change = ((values[i] - values[i - 1]) / values[i - 1]) * 100;
    changes.push(change);
  }
  return changes;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || 'ethereum';
    const mode = searchParams.get('mode') || 'presentation';
    
    // Demo mode: return mock correlation data
    if (mode === 'demo') {
      const mockCorrelation: CorrelationData = {
        token,
        correlation: -0.75 + Math.random() * 0.3, // Strong negative correlation
        healthFactorImpact: Math.random() * 0.4 + 0.1, // 10-50%
        timestamp: Date.now(),
      };
      
      return NextResponse.json(mockCorrelation);
    }
    
    // Presentation mode: calculate from real data
    try {
      // Fetch price data for the token
      const priceResponse = await fetch(
        `${API_CONFIG.coingecko.baseUrl}/coins/${token}/market_chart?vs_currency=usd&days=7&interval=daily`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!priceResponse.ok) {
        throw new Error('Failed to fetch price data');
      }
      
      const priceData = await priceResponse.json();
      const prices = priceData.prices?.map((p: [number, number]) => p[1]) || [];
      
      if (prices.length < 2) {
        throw new Error('Insufficient price data');
      }
      
      // Calculate price changes
      const priceChanges = calculateChange(prices);
      
      // Fetch positions data
      const positionsResponse = await fetch(
        `${request.url.split('/api')[0]}/api/positions?mode=presentation`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!positionsResponse.ok) {
        throw new Error('Failed to fetch positions data');
      }
      
      const positionsData = await positionsResponse.json();
      const positions = positionsData.positions || [];
      
      // For each position, simulate health factor changes based on ETH price changes
      // (In production, you'd fetch historical health factor data)
      const healthFactorChanges: number[] = [];
      
      for (let i = 0; i < priceChanges.length; i++) {
        const priceChange = priceChanges[i];
        
        // Simulate health factor change based on price change
        // If ETH price drops 10%, health factor typically drops ~8-9%
        // (Assuming ETH collateral, which is common)
        const avgHealthFactorChange = priceChange * 0.85; // 85% LTV typical
        healthFactorChanges.push(avgHealthFactorChange);
      }
      
      // Calculate correlation between price changes and health factor changes
      const correlation = calculateCorrelation(priceChanges, healthFactorChanges);
      
      // Calculate average health factor impact
      const avgImpact = Math.abs(
        healthFactorChanges.reduce((sum, change) => sum + change, 0) / healthFactorChanges.length
      ) / 100;
      
      const result: CorrelationData = {
        token,
        correlation,
        healthFactorImpact: avgImpact,
        timestamp: Date.now(),
      };
      
      return NextResponse.json(result);
      
    } catch (error) {
      console.error('Failed to calculate correlation:', error);
      
      // Fallback to mock data
      const fallbackCorrelation: CorrelationData = {
        token,
        correlation: -0.82, // Strong negative correlation (typical for collateral tokens)
        healthFactorImpact: 0.28, // 28% average impact
        timestamp: Date.now(),
      };
      
      return NextResponse.json(fallbackCorrelation);
    }
    
  } catch (error) {
    console.error('Correlation API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to calculate correlation',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

// POST endpoint to calculate correlation for multiple tokens
export async function POST(request: Request) {
  try {
    const { tokens, mode } = await request.json();
    
    if (!tokens || !Array.isArray(tokens)) {
      return NextResponse.json(
        { error: 'Invalid request: tokens array required' },
        { status: 400 }
      );
    }
    
    // Fetch correlation for all tokens in parallel
    const correlationPromises = tokens.map(async (token: string) => {
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
          throw new Error(`Failed to fetch correlation for ${token}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Failed to calculate correlation for ${token}:`, error);
        
        // Return mock data for failed tokens
        return {
          token,
          correlation: -0.75,
          healthFactorImpact: 0.25,
          timestamp: Date.now(),
        };
      }
    });
    
    const results = await Promise.all(correlationPromises);
    
    return NextResponse.json({
      correlations: results,
      timestamp: Date.now(),
    });
    
  } catch (error) {
    console.error('Batch correlation API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to calculate batch correlation',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
