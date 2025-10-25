'use client';

import React from 'react';
import { formatRelativeTime } from '@/lib/utils';
import { AgentStatus as AgentStatusType } from '@/lib/types';

interface AgentStatusIndicatorProps {
  agent: AgentStatusType;
  showDetails?: boolean;
}

export function AgentStatusIndicator({ agent, showDetails = true }: AgentStatusIndicatorProps) {
  const statusColors = {
    online: 'bg-green-500',
    busy: 'bg-yellow-500',
    offline: 'bg-red-500',
  };

  const statusLabels = {
    online: 'Online',
    busy: 'Busy',
    offline: 'Offline',
  };

  return (
    <div className="flex items-center gap-3 glass-card p-3 rounded-lg">
      {/* Status Dot */}
      <div className="relative">
        <div
          className={`
            w-3 h-3 rounded-full ${statusColors[agent.status]}
            ${agent.status === 'online' ? 'animate-pulse' : ''}
          `}
        />
        {agent.status === 'online' && (
          <div
            className={`
              absolute inset-0 w-3 h-3 rounded-full ${statusColors[agent.status]}
              opacity-50 animate-ping
            `}
          />
        )}
      </div>

      {/* Agent Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-white truncate">
            {agent.name}
          </h4>
          <span
            className={`
              text-xs px-2 py-0.5 rounded-full
              ${agent.status === 'online'
                ? 'bg-green-500/20 text-green-400'
                : agent.status === 'busy'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }
            `}
          >
            {statusLabels[agent.status]}
          </span>
        </div>

        {showDetails && (
          <p className="text-xs text-gray-400 mt-1">
            Last seen {formatRelativeTime(agent.lastSeen)}
          </p>
        )}
      </div>

      {/* Endpoint (optional) */}
      {showDetails && (
        <div className="hidden md:block text-xs text-gray-500 font-mono">
          {agent.endpoint.replace('http://localhost:', ':')}
        </div>
      )}
    </div>
  );
}

// Compact version for grids
export function AgentStatusBadge({ agent }: { agent: AgentStatusType }) {
  const statusColors = {
    online: 'status-dot-safe',
    busy: 'status-dot-warning',
    offline: 'status-dot-critical',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`status-dot ${statusColors[agent.status]} status-dot-pulse`} />
      <span className="text-sm text-white">{agent.name}</span>
    </div>
  );
}
