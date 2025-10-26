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
  { name: 'Position Monitor', port: 8101, shortName: 'position_monitor' },
  { name: 'Yield Optimizer', port: 8102, shortName: 'yield_optimizer' },
  { name: 'Swap Optimizer', port: 8103, shortName: 'swap_optimizer' },
  { name: 'Cross-Chain Executor', port: 8122, shortName: 'cross_chain_executor' },
];

// Map agent addresses to readable names (from config/agent_addresses.json)
const AGENT_ADDRESS_MAP: Record<string, string> = {
  'agent1qvvp0sl4xw': 'position_monitor',
  'agent1q0rtan6yrc': 'yield_optimizer', 
  'agent1q2d8jkuhml': 'swap_optimizer',
  'agent1qtk56cc7z5': 'cross_chain_executor',
};

function mapAgentName(address: string): string {
  // Check if it's already a name
  if (!address.startsWith('agent1')) {
    return address;
  }
  
  // Try to match the beginning of the address
  for (const [prefix, name] of Object.entries(AGENT_ADDRESS_MAP)) {
    if (address.startsWith(prefix)) {
      return name;
    }
  }
  
  return address;
}

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

        const data: any = await response.json();
        const rawMessages = data.messages || [];
        
        // Transform agent messages to standard format
        return rawMessages.map((msg: any) => ({
          timestamp: msg.timestamp,
          direction: msg.direction,
          message_type: msg.type || msg.message_type,
          from: msg.direction === 'sent' ? agent.shortName : mapAgentName(msg.address || 'unknown'),
          to: msg.direction === 'received' ? agent.shortName : mapAgentName(msg.address || 'unknown'),
          details: msg.details || {}
        }));
      } catch (error) {
        // Agent might be offline or not have HTTP server yet
        console.warn(`Could not fetch messages from ${agent.name}:`, error);
        return [];
      }
    });

    const results = await Promise.all(messagePromises);
    const allMessages = results.flat();

    // Deduplicate messages (same message logged by sender and receiver)
    // Keep only 'sent' messages as they have complete context
    const seenMessages = new Map<string, AgentMessage>();

    for (const msg of allMessages) {
      // Create unique key: timestamp + message_type + main detail
      const mainDetail = Object.values(msg.details || {})[0] || '';
      const key = `${msg.timestamp}-${msg.message_type}-${mainDetail}`;

      const existing = seenMessages.get(key);
      if (!existing || msg.direction === 'sent') {
        // Keep 'sent' messages over 'received' (sender has more context)
        seenMessages.set(key, msg);
      }
    }

    // Convert back to array and sort by timestamp (newest first)
    const dedupedMessages = Array.from(seenMessages.values());
    dedupedMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit to last 50 messages for cleaner display
    const recentMessages = dedupedMessages.slice(0, 50);

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
