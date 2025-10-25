import { NextResponse } from 'next/server';
import { request as gqlRequest, gql } from 'graphql-request';
import { API_CONFIG, NETWORK_CONFIG } from '@/lib/constants';
import { Position, SubgraphQuery, SubgraphUserReserve } from '@/lib/types';
import { calculateHealthFactor } from '@/lib/utils';

// The Graph query for Aave V3 positions on Sepolia
const POSITIONS_QUERY = gql`
  query GetPositions($first: Int!, $healthFactorMax: String) {
    userReserves(
      first: $first
      where: { 
        currentATokenBalance_gt: "0"
        user_: { borrowedReservesCount_gt: 0 }
      }
      orderBy: currentATokenBalance
      orderDirection: desc
    ) {
      id
      user {
        id
      }
      currentATokenBalance
      currentTotalDebt
      reserve {
        symbol
        decimals
        priceInMarketReferenceCurrency
      }
    }
  }
`;

// Generate mock positions for demo mode
function generateMockPositions(count: number = 20): Position[] {
  const positions: Position[] = [];
  
  for (let i = 0; i < count; i++) {
    const collateral = 5000 + Math.random() * 45000; // $5K - $50K
    const debtRatio = i < 5 ? 0.75 + Math.random() * 0.15 : 0.3 + Math.random() * 0.4; // Some at risk
    const debt = collateral * debtRatio;
    const hf = calculateHealthFactor(collateral, debt);
    
    positions.push({
      id: `0x${Math.random().toString(16).slice(2, 10)}`,
      user: `0x${Math.random().toString(16).slice(2, 42)}`,
      totalCollateralUSD: collateral,
      totalDebtUSD: debt,
      healthFactor: hf,
      collateralTokens: [
        {
          token: 'WETH',
          symbol: 'WETH',
          amount: collateral * 0.6 / 2500,
          amountUSD: collateral * 0.6,
        },
        {
          token: 'WBTC',
          symbol: 'WBTC',
          amount: collateral * 0.4 / 50000,
          amountUSD: collateral * 0.4,
        },
      ],
      debtTokens: [
        {
          token: 'USDC',
          symbol: 'USDC',
          amount: debt,
          amountUSD: debt,
        },
      ],
      lastUpdate: Date.now() - Math.random() * 3600000, // Within last hour
    });
  }
  
  return positions.sort((a, b) => a.healthFactor - b.healthFactor);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'demo';
  const limit = parseInt(searchParams.get('limit') || '20');
  
  try {
    // Demo mode: return mock data
    if (mode === 'demo') {
      const positions = generateMockPositions(limit);
      
      return NextResponse.json({
        success: true,
        positions,
        totalCount: positions.length,
        atRiskCount: positions.filter(p => p.healthFactor < 1.5).length,
        timestamp: Date.now(),
      });
    }
    
    // Presentation/Production mode: fetch from The Graph
    try {
      const data = await gqlRequest<SubgraphQuery>(
        API_CONFIG.theGraph.subgraphUrl,
        POSITIONS_QUERY,
        {
          first: limit,
          healthFactorMax: '2000000000000000000', // 2.0 in Wei (filter for at-risk positions)
        }
      );
      
      // Transform subgraph data to our Position type
      const positions: Position[] = (data.userReserves || []).map((reserve: SubgraphUserReserve) => {
        const balance = parseFloat(reserve.currentATokenBalance);
        const debt = parseFloat(reserve.currentTotalDebt);
        const decimals = parseInt(reserve.reserve.decimals);
        const price = parseFloat(reserve.reserve.priceInMarketReferenceCurrency);
        
        const collateralUSD = (balance / Math.pow(10, decimals)) * price;
        const debtUSD = (debt / Math.pow(10, decimals)) * price;
        const hf = calculateHealthFactor(collateralUSD, debtUSD);
        
        return {
          id: reserve.id,
          user: reserve.user.id,
          totalCollateralUSD: collateralUSD,
          totalDebtUSD: debtUSD,
          healthFactor: hf,
          collateralTokens: [
            {
              token: reserve.reserve.symbol,
              symbol: reserve.reserve.symbol,
              amount: balance / Math.pow(10, decimals),
              amountUSD: collateralUSD,
            },
          ],
          debtTokens: [
            {
              token: 'USDC', // Simplified - would parse from reserve data
              symbol: 'USDC',
              amount: debt / Math.pow(10, decimals),
              amountUSD: debtUSD,
            },
          ],
          lastUpdate: Date.now(),
        };
      });
      
      return NextResponse.json({
        success: true,
        positions: positions.sort((a, b) => a.healthFactor - b.healthFactor),
        totalCount: positions.length,
        atRiskCount: positions.filter(p => p.healthFactor < 1.5).length,
        timestamp: Date.now(),
      });
      
    } catch (graphError) {
      console.error('The Graph query failed:', graphError);
      
      // Fallback to mock data if The Graph is unavailable
      const positions = generateMockPositions(limit);
      
      return NextResponse.json({
        success: true,
        positions,
        totalCount: positions.length,
        atRiskCount: positions.filter(p => p.healthFactor < 1.5).length,
        timestamp: Date.now(),
        warning: 'Using mock data - The Graph subgraph unavailable',
      });
    }
    
  } catch (error) {
    console.error('API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch positions',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
