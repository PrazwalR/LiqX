import { NextResponse } from 'next/server';

/**
 * Agent Messages API
 * 
 * Aggregates communication messages from all agents
 * Shows sent/received messages for transparency
 */

interface AgentMessage {
  timestamp: string;
  direction: 'sent' | 'received';
  message_type: string;
  from: string;
  to: string;
  details: Record<string, any>;
}

interface AgentMessageResponse {
  success: boolean;
  messages: AgentMessage[];
  total: number;
}

// Agent HTTP endpoints for message history
const AGENT_MESSAGE_ENDPOINTS = [
  { name: 'Position Monitor', port: 8101 },
  { name: 'Yield Optimizer', port: 8111 },
  { name: 'Swap Optimizer', port: 8102 },
  { name: 'Cross-Chain Executor', port: 8121 },
];

export async function GET() {
  try {
    // Fetch messages from all agents in parallel
    const messagePromises = AGENT_MESSAGE_ENDPOINTS.map(async (agent) => {
      try {
        const response = await fetch(`http://localhost:${agent.port}/messages`, {
          signal: AbortSignal.timeout(2000), // 2 second timeout
        });

        if (!response.ok) {
          console.warn(`Agent ${agent.name} returned ${response.status}`);
          return [];
        }

        const data: AgentMessageResponse = await response.json();
        return data.messages || [];
      } catch (error) {
        // Agent might be offline or not have HTTP server yet
        console.warn(`Could not fetch messages from ${agent.name}:`, error);
        return [];
      }
    });

    const results = await Promise.all(messagePromises);
    const allMessages = results.flat();

    // Sort by timestamp (newest first)
    allMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit to last 100 messages
    const recentMessages = allMessages.slice(0, 100);

    return NextResponse.json({
      success: true,
      messages: recentMessages,
      total: recentMessages.length,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Agent messages API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch agent messages',
        messages: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
