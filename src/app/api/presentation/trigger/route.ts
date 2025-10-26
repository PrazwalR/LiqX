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

    // Forward to Position Monitor's demo trigger endpoint
    try {
      // Call Position Monitor's /demo/trigger endpoint
      const response = await fetch(`${API_CONFIG.agents.positionMonitor}/demo/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position_id: positionId,  // Trigger specific demo position
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent returned ${response.status}`);
      }

      const data = await response.json();

      const result: TriggerResult = {
        success: true,
        triggerId: data.position_id || `trigger-${Date.now()}`,
        message: data.message || 'Demo position triggered - agents processing with REAL APIs',
        timestamp: Date.now(),
      };

      return NextResponse.json(result);

    } catch (agentError) {
      console.error('Failed to reach presentation trigger agent:', agentError);

      // Return failure so frontend knows there's an issue
      return NextResponse.json(
        {
          success: false,
          error: 'Position Monitor agent is offline. Please start agents first.',
          timestamp: Date.now(),
        },
        { status: 503 }
      );
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

// GET endpoint to check Position Monitor status
export async function GET() {
  try {
    // Check if Position Monitor agent is available
    const response = await fetch(`${API_CONFIG.agents.positionMonitor}/status`, {
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
      message: 'Position Monitor agent is offline',
      timestamp: Date.now(),
    });

  } catch (error) {
    return NextResponse.json({
      success: true,
      agentOnline: false,
      message: 'Failed to reach Position Monitor agent',
      timestamp: Date.now(),
    });
  }
}
