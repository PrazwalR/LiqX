import { NextResponse } from 'next/server';
import { SwapRouteDetails } from '@/lib/types';

/**
 * GET /api/agents/swap-routes
 * Fetch latest swap route details from Swap Optimizer agent
 * Returns REAL 1inch Fusion+ API responses and execution plans
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch from Swap Optimizer agent's status endpoint
    // This returns the latest swap routes with real 1inch API responses
    const swapOptimizerUrl = process.env.SWAP_OPTIMIZER_URL || 'http://localhost:8002';

    const response = await fetch(`${swapOptimizerUrl}/swap-routes?limit=${limit}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Don't cache - we want real-time data
      cache: 'no-store',
    });

    if (!response.ok) {
      // Agent might be offline or not yet ready
      console.warn('Swap Optimizer agent not available');

      return NextResponse.json({
        success: true,
        routes: [],
        message: 'Swap Optimizer agent not available. Start the agent to see swap routes.',
        timestamp: Date.now(),
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      routes: data.routes || [],
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Error fetching swap routes:', error);

    return NextResponse.json({
      success: true,
      routes: [],
      message: 'Swap Optimizer agent not running. No routes available yet.',
      timestamp: Date.now(),
    });
  }
}
