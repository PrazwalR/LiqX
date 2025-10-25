/**
 * API Route: POST /api/agents/monitor-position
 * 
 * Sends a selected position to the Position Monitor agent for immediate monitoring
 */

import { NextResponse } from 'next/server';

interface MonitorPositionRequest {
  id?: string;  // From Position type
  positionId?: string;  // Alternative field name
  user: string;
  totalCollateralUSD: number;
  totalDebtUSD: number;
  healthFactor: number;
  protocol?: string;  // Protocol where position is held
  chain?: string;     // Chain where position is held
  collateralTokens: Array<{
    symbol: string;
    amount: number;
    amountUSD: number;
  }>;
  debtTokens: Array<{
    symbol: string;
    amount: number;
    amountUSD: number;
  }>;
}

export async function POST(request: Request) {
  try {
    const body: MonitorPositionRequest = await request.json();

    // Send to Position Monitor HTTP endpoint
    const response = await fetch('http://localhost:8101/monitor-position', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        position_id: body.positionId || body.id || 'unknown',  // Accept both formats
        user_address: body.user,
        protocol: body.protocol || 'compound',  // Use position's protocol (default to low-APY compound)
        chain: body.chain || 'ethereum',        // Use position's chain
        collateral_value: body.totalCollateralUSD,
        debt_value: body.totalDebtUSD,
        health_factor: body.healthFactor,
        collateral_token: body.collateralTokens[0]?.symbol || 'WETH',
        debt_token: body.debtTokens[0]?.symbol || 'USDC',
        collateral_amount: body.collateralTokens[0]?.amount || 0,
        debt_amount: body.debtTokens[0]?.amount || 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`Position Monitor returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Position sent to monitor agent',
      data,
    });

  } catch (error) {
    console.error('Failed to send position to agent:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
