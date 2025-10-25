/**
 * API Route: /api/agents/strategies
 * 
 * Fetches AI-generated yield strategies from the Yield Optimizer agent
 */

import { NextResponse } from 'next/server';

const YIELD_OPTIMIZER_HTTP_PORT = process.env.YIELD_OPTIMIZER_HTTP_PORT || '8111';

export async function GET() {
  try {
    // Fetch from Yield Optimizer HTTP server
    const response = await fetch(`http://localhost:${YIELD_OPTIMIZER_HTTP_PORT}/strategies`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Yield Optimizer returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      strategies: data.strategies || [],
      timestamp: data.timestamp || Date.now(),
    });
  } catch (error) {
    console.error('Failed to fetch strategies:', error);

    // Return empty strategies on error
    return NextResponse.json({
      success: false,
      strategies: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    });
  }
}
