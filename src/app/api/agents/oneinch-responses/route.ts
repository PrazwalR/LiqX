import { NextResponse } from 'next/server';

/**
 * GET /api/agents/oneinch-responses
 * Fetch latest 1inch Fusion+ API responses from Swap Optimizer agent
 * Returns REAL API responses that the agent received from 1inch
 */
export async function GET(request: Request) {
  try {
    // Swap Optimizer agent HTTP API endpoint
    const agentHttpUrl = process.env.SWAP_OPTIMIZER_HTTP_URL || 'http://localhost:8103';

    const response = await fetch(`${agentHttpUrl}/oneinch-responses`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Don't cache - we want real-time data
      cache: 'no-store',
    });

    if (!response.ok) {
      // Agent might be offline
      console.warn('Swap Optimizer agent HTTP API not available');

      return NextResponse.json({
        success: true,
        responses: [],
        message: 'Swap Optimizer agent not running. Start the agent to see 1inch API responses.',
        timestamp: Date.now(),
      });
    }

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching 1inch responses from agent:', error);

    return NextResponse.json({
      success: true,
      responses: [],
      message: 'Swap Optimizer agent offline. No 1inch API responses available.',
      timestamp: Date.now(),
    });
  }
}
