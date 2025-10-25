import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { CrashTrigger, TriggerResult } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const triggerConfig: CrashTrigger = body;
    const positionId = body.positionId;  // Extract selected position ID

    // Validate trigger config
    if (!triggerConfig.type || !triggerConfig.ethDrop || !triggerConfig.duration) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid trigger configuration',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    // Validate ranges
    if (triggerConfig.ethDrop < 0 || triggerConfig.ethDrop > 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'ETH drop must be between 0 and 1 (0% to 100%)',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    if (triggerConfig.duration < 1 || triggerConfig.duration > 300) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duration must be between 1 and 300 seconds',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    // Forward to presentation trigger agent
    try {
      // Convert camelCase to snake_case for Python agent compatibility
      const eventTypeMap: Record<string, string> = {
        'marketCrash': 'market_crash',
        'flashCrash': 'flash_crash',
        'gradualDecline': 'gradual_decline',
        'randomVolatility': 'random_volatility',
        'custom': 'custom',
      };

      const response = await fetch(`${API_CONFIG.agents.presentationTrigger}/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: eventTypeMap[triggerConfig.type] || triggerConfig.type,
          eth_drop: triggerConfig.ethDrop,
          duration: triggerConfig.duration,
          volatility: triggerConfig.volatility || 0,
          position_id: positionId,  // Include position ID for targeted monitoring
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent returned ${response.status}`);
      }

      const data = await response.json();

      const result: TriggerResult = {
        success: true,
        triggerId: data.trigger_id || `trigger-${Date.now()}`,
        message: data.message || 'Trigger event sent to agents',
        timestamp: Date.now(),
      };

      return NextResponse.json(result);

    } catch (agentError) {
      console.error('Failed to reach presentation trigger agent:', agentError);

      // Return success even if agent is offline (for demo purposes)
      // In production, you'd want to handle this differently
      const result: TriggerResult = {
        success: true,
        triggerId: `mock-trigger-${Date.now()}`,
        message: 'Trigger queued (agent offline - using simulation)',
        timestamp: Date.now(),
      };

      return NextResponse.json(result);
    }

  } catch (error) {
    console.error('Trigger API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process trigger request',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check trigger status
export async function GET() {
  try {
    // Check if presentation trigger agent is available
    const response = await fetch(`${API_CONFIG.agents.presentationTrigger}/status`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();

      return NextResponse.json({
        success: true,
        agentOnline: true,
        agentStatus: data,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({
      success: true,
      agentOnline: false,
      message: 'Presentation trigger agent is offline',
      timestamp: Date.now(),
    });

  } catch (error) {
    return NextResponse.json({
      success: true,
      agentOnline: false,
      message: 'Failed to reach presentation trigger agent',
      timestamp: Date.now(),
    });
  }
}
