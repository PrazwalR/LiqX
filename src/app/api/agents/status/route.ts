import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/constants';
import { AgentStatus } from '@/lib/types';

// Mock agent status for when agents are offline
const mockAgents: AgentStatus[] = [
  {
    agentId: 'position-monitor',
    name: 'Position Monitor',
    status: 'offline',
    lastSeen: Date.now() - 300000, // 5 minutes ago
    endpoint: API_CONFIG.agents.positionMonitor,
  },
  {
    agentId: 'yield-optimizer',
    name: 'Yield Optimizer',
    status: 'offline',
    lastSeen: Date.now() - 300000,
    endpoint: API_CONFIG.agents.yieldOptimizer,
  },
  {
    agentId: 'swap-optimizer',
    name: 'Swap Optimizer',
    status: 'offline',
    lastSeen: Date.now() - 300000,
    endpoint: API_CONFIG.agents.swapOptimizer,
  },
  {
    agentId: 'cross-chain-executor',
    name: 'Cross-Chain Executor',
    status: 'offline',
    lastSeen: Date.now() - 300000,
    endpoint: API_CONFIG.agents.crossChainExecutor,
  },
  {
    agentId: 'presentation-trigger',
    name: 'Presentation Trigger',
    status: 'offline',
    lastSeen: Date.now() - 300000,
    endpoint: API_CONFIG.agents.presentationTrigger,
  },
];

// Check if agent is reachable
async function checkAgentStatus(endpoint: string, agentId: string, name: string): Promise<AgentStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch(`${endpoint}/health`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();

      return {
        agentId,
        name,
        status: data.status === 'ok' ? 'online' : 'offline',
        lastSeen: Date.now(),
        endpoint,
      };
    }

    return {
      agentId,
      name,
      status: 'offline',
      lastSeen: Date.now() - 60000, // 1 minute ago
      endpoint,
    };

  } catch (error) {
    // Agent is offline or unreachable
    return {
      agentId,
      name,
      status: 'offline',
      lastSeen: Date.now() - 60000,
      endpoint,
    };
  }
}

export async function GET() {
  try {
    // Check all agents in parallel
    const agentChecks = [
      checkAgentStatus(API_CONFIG.agents.positionMonitor, 'position-monitor', 'Position Monitor'),
      checkAgentStatus(API_CONFIG.agents.yieldOptimizer, 'yield-optimizer', 'Yield Optimizer'),
      checkAgentStatus(API_CONFIG.agents.swapOptimizer, 'swap-optimizer', 'Swap Optimizer'),
      checkAgentStatus(API_CONFIG.agents.crossChainExecutor, 'cross-chain-executor', 'Cross-Chain Executor'),
      checkAgentStatus(API_CONFIG.agents.presentationTrigger, 'presentation-trigger', 'Presentation Trigger'),
    ];

    const agents = await Promise.all(agentChecks);
    const allOnline = agents.every((agent) => agent.status === 'online');

    return NextResponse.json({
      success: true,
      agents,
      allOnline,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Failed to check agent status:', error);

    // Return mock data on error
    return NextResponse.json({
      success: true,
      agents: mockAgents,
      allOnline: false,
      timestamp: Date.now(),
      warning: 'Using mock data - agents may be offline',
    });
  }
}
