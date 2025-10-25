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

// Generate mock positions for demo mode with stable IDs and values
function generateMockPositions(count: number = 20): Position[] {
  const positions: Position[] = [];

  // Use deterministic seed for stable IDs across refreshes
  const seeds = [
    '0xd7d7f8f5', '0xa3b2c1d0', '0xe4f5a6b7', '0xc8d9e0f1', '0xb2c3d4e5',
    '0xf6a7b8c9', '0xd0e1f2a3', '0xa4b5c6d7', '0xe8f9a0b1', '0xc2d3e4f5',
    '0xb6c7d8e9', '0xf0a1b2c3', '0xd4e5f6a7', '0xa8b9c0d1', '0xecfda0b1',
    '0xc6d7e8f9', '0xb0c1d2e3', '0xf4a5b6c7', '0xd8e9f0a1', '0xacbdc0d1',
  ];

  // Use low-APY protocols for demo positions (so Yield Optimizer finds better alternatives)
  const lowApyProtocols = [
    { protocol: 'compound', chain: 'ethereum' },        // Lower APY than Aave/Lido
    { protocol: 'benqi', chain: 'avalanche' },          // Lower APY
    { protocol: 'venus', chain: 'bnb-chain' },          // Lower APY
    { protocol: 'geist', chain: 'fantom' },             // Lower APY
    { protocol: 'compound', chain: 'ethereum' },        // Repeat for variety
  ];

  // Deterministic values based on index (no Math.random())
  // First 5 positions are CRITICAL (HF < 1.2), rest are healthy or moderate risk
  for (let i = 0; i < count; i++) {
    let collateral: number;
    let debtRatio: number;

    if (i < 5) {
      // CRITICAL positions - worst health factors (0.85 - 1.15)
      collateral = 10000 + (i * 5000); // $10K - $30K (deterministic)
      debtRatio = 0.85 + (i * 0.05); // 0.85, 0.90, 0.95, 1.00, 1.05 (very high debt)
    } else if (i < 10) {
      // AT RISK positions (HF 1.2 - 1.5)
      collateral = 15000 + (i * 3000);
      debtRatio = 0.65 + (i * 0.02); // Moderate risk
    } else {
      // HEALTHY positions (HF > 1.5)
      collateral = 8000 + (i * 2000);
      debtRatio = 0.40 + (i * 0.015); // Lower risk
    }

    const debt = collateral * debtRatio;
    const hf = calculateHealthFactor(collateral, debt);

    // Assign protocol (cycle through low-APY options)
    const protocolInfo = lowApyProtocols[i % lowApyProtocols.length];

    positions.push({
      id: seeds[i] || `0x${(i + 1).toString(16).padStart(8, '0')}`,
      user: `0x${(i + 1000).toString(16).padStart(40, '0')}`,
      totalCollateralUSD: collateral,
      totalDebtUSD: debt,
      healthFactor: hf,
      protocol: protocolInfo.protocol,
      chain: protocolInfo.chain,
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
      let data;
      try {
        // Try primary subgraph endpoint
        data = await gqlRequest<SubgraphQuery>(
          API_CONFIG.theGraph.subgraphUrl,
          POSITIONS_QUERY,
          {
            first: limit,
            healthFactorMax: '2000000000000000000', // 2.0 in Wei (filter for at-risk positions)
          }
        );
      } catch (primaryError) {
        // Try fallback endpoint if primary fails
        if ('fallbackUrl' in API_CONFIG.theGraph) {
          try {
            data = await gqlRequest<SubgraphQuery>(
              (API_CONFIG.theGraph as any).fallbackUrl,
              POSITIONS_QUERY,
              {
                first: limit,
                healthFactorMax: '2000000000000000000',
              }
            );
          } catch (fallbackError) {
            throw primaryError; // Throw original error if fallback also fails
          }
        } else {
          throw primaryError;
        }
      }

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
      // Silently fallback to mock data - this is expected in demo/hackathon mode
      console.warn('📊 The Graph unavailable - using mock data for presentation');

      // Fallback to mock data if The Graph is unavailable
      const positions = generateMockPositions(limit);

      return NextResponse.json({
        success: true,
        positions,
        totalCount: positions.length,
        atRiskCount: positions.filter(p => p.healthFactor < 1.5).length,
        timestamp: Date.now(),
        mode: 'mock',
        warning: 'Using simulated positions for demo',
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
