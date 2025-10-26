import { NextResponse } from 'next/server';
import { request as gqlRequest, gql } from 'graphql-request';
import { API_CONFIG, NETWORK_CONFIG } from '@/lib/constants';
import { Position, SubgraphQuery, SubgraphUserReserve } from '@/lib/types';
import { calculateHealthFactor } from '@/lib/utils';

// The Graph query for LiqX custom subgraph on Sepolia
const POSITIONS_QUERY = gql`
  query GetPositions($first: Int!, $healthFactorMax: String) {
    positions(
      first: $first
      where: { 
        isActive: true
        debtAmount_gt: "0"
        healthFactor_lt: $healthFactorMax
      }
      orderBy: healthFactor
      orderDirection: asc
    ) {
      id
      user {
        id
      }
      collateralAsset
      collateralAmount
      debtAsset
      debtAmount
      healthFactor
      updatedAt
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
    { protocol: 'compound', chain: 'ethereum' },        // ETHEREUM - same chain as Aave (low gas!)
    { protocol: 'compound', chain: 'ethereum' },        // ETHEREUM - more same-chain positions
    { protocol: 'compound', chain: 'ethereum' },        // ETHEREUM
    { protocol: 'compound', chain: 'ethereum' },        // ETHEREUM
    { protocol: 'compound', chain: 'ethereum' },        // All on Ethereum for low gas costs
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
        // USDC collateral - will need to swap to WETH for Aave/Lido (triggers 1inch API!)
        {
          token: 'USDC',
          symbol: 'USDC',
          amount: collateral * 0.7, // 70% USDC (stablecoin, 1:1 with USD)
          amountUSD: collateral * 0.7,
        },
        {
          token: 'DAI',
          symbol: 'DAI',
          amount: collateral * 0.3, // 30% DAI (another stablecoin)
          amountUSD: collateral * 0.3,
        },
      ],
      debtTokens: [
        {
          token: 'USDT',
          symbol: 'USDT',
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
    // Demo/Presentation mode: return mock data (no real positions on testnet with positive HF)
    if (mode === 'demo' || mode === 'presentation') {
      const positions = generateMockPositions(limit);

      return NextResponse.json({
        success: true,
        positions,
        totalCount: positions.length,
        atRiskCount: positions.filter(p => p.healthFactor < 1.5).length,
        timestamp: Date.now(),
        source: 'mock_data',
        note: 'Using mock positions - all testnet positions are liquidated (negative HF)'
      });
    }

    // Production mode: fetch from Position Monitor agent
    try {
      const agentResponse = await fetch('http://localhost:8101/positions', {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!agentResponse.ok) {
        throw new Error(`Position Monitor returned ${agentResponse.status}`);
      }

      const agentData = await agentResponse.json();

      // Transform agent data to frontend Position type
      const positions: Position[] = (agentData.positions || []).map((pos: any) => {
        return {
          id: pos.id,
          user: pos.user,
          totalCollateralUSD: pos.collateral_usd || 0,
          totalDebtUSD: pos.debt_usd || 0,
          healthFactor: pos.health_factor || 0,
          protocol: pos.protocol || 'aave',
          chain: pos.chain || 'sepolia',
          collateralTokens: [
            {
              token: pos.collateral_token,
              symbol: pos.collateral_token,
              amount: pos.collateral_amount / 1e18,
              amountUSD: pos.collateral_usd || 0,
            },
          ],
          debtTokens: [
            {
              token: pos.debt_token,
              symbol: pos.debt_token,
              amount: pos.debt_amount / 1e18,
              amountUSD: pos.debt_usd || 0,
            },
          ],
          lastUpdate: pos.last_updated * 1000,
        };
      });

      return NextResponse.json({
        success: true,
        positions: positions.sort((a, b) => a.healthFactor - b.healthFactor),
        totalCount: positions.length,
        atRiskCount: positions.filter(p => p.healthFactor < 1.5).length,
        timestamp: Date.now(),
        source: 'position_monitor_agent',
      });

    } catch (agentError) {
      console.error('❌ Position Monitor agent unavailable:', agentError);

      // Return error response - NO MOCK DATA FALLBACK
      return NextResponse.json(
        {
          success: false,
          error: 'Position Monitor agent unavailable',
          details: agentError instanceof Error ? agentError.message : 'Unknown error',
          timestamp: Date.now(),
        },
        { status: 503 }
      );
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
