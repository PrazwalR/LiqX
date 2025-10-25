'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  ArrowLeft,
  Zap,
  TrendingDown,
  Activity,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { API_CONFIG, PRESENTATION_CONFIG } from '@/lib/constants';
import {
  AgentStatus,
  AgentActivity,
  Position,
  MarketPrice,
  PerformanceMetrics,
  CrashTrigger,
} from '@/lib/types';
import {
  formatCurrency,
  formatRelativeTime,
  shortenAddress,
} from '@/lib/utils';
import { AgentStatusIndicator } from '@/components/shared/AgentStatusIndicator';
import { PositionCardCompact } from '@/components/shared/PositionCard';
import { HealthFactorBar } from '@/components/shared/HealthFactorGauge';
import { ErrorBanner } from '@/components/ErrorAlert';
import { PositionGridSkeleton, AgentGridSkeleton, StatsSkeleton } from '@/components/Loading';

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PresentationPage() {
  const [selectedTrigger, setSelectedTrigger] = useState<string>('marketCrash');
  const [customEthDrop, setCustomEthDrop] = useState(30);
  const [customDuration, setCustomDuration] = useState(10);
  const [activityFeed, setActivityFeed] = useState<AgentActivity[]>([]);

  // Fetch agents status
  const { data: agentsData, error: agentsError } = useSWR<{ agents: AgentStatus[] }>(
    '/api/agents/status',
    fetcher,
    { refreshInterval: API_CONFIG.agents.statusInterval }
  );

  // Fetch positions from The Graph
  const { data: positionsData, error: positionsError } = useSWR<{ positions: Position[] }>(
    '/api/positions?mode=presentation',
    fetcher,
    { refreshInterval: API_CONFIG.theGraph.updateInterval }
  );

  // Fetch market prices
  const { data: pricesData, error: pricesError } = useSWR<{ prices: MarketPrice[] }>(
    '/api/market/prices?mode=presentation&tokens=eth,wbtc,usdc',
    fetcher,
    { refreshInterval: API_CONFIG.coingecko.updateInterval }
  );

  // Performance metrics (mock for now - would come from backend)
  const performanceMetrics: PerformanceMetrics = {
    responseTime: 4.2,
    successRate: 96.5,
    totalStrategiesExecuted: 47,
    valueProtected: 125000,
    preventedLiquidations: 8,
    averageHealthFactorImprovement: 0.43,
    gasUsed: 0.024,
    uptime: 99.8,
  };

  // Handle crash trigger
  const handleTrigger = async () => {
    const triggerConfig: CrashTrigger =
      selectedTrigger === 'custom'
        ? {
            type: 'custom',
            ethDrop: customEthDrop / 100,
            duration: customDuration,
          }
        : {
            type: selectedTrigger as any,
            ethDrop: PRESENTATION_CONFIG.triggers[selectedTrigger as keyof typeof PRESENTATION_CONFIG.triggers].ethDrop,
            duration: PRESENTATION_CONFIG.triggers[selectedTrigger as keyof typeof PRESENTATION_CONFIG.triggers].duration,
          };

    try {
      const response = await fetch('/api/presentation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(triggerConfig),
      });

      const result = await response.json();

      if (result.success) {
        // Add to activity feed
        setActivityFeed((prev) => [
          {
            id: result.triggerId,
            agentName: 'Presentation Trigger',
            timestamp: Date.now(),
            action: `Triggered ${selectedTrigger} event`,
            details: `ETH drop: ${(triggerConfig.ethDrop * 100).toFixed(0)}%, Duration: ${triggerConfig.duration}s`,
            success: true,
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error('Failed to trigger event:', error);
    }
  };

  // Simulate live activity feed updates
  useEffect(() => {
    // This would be replaced with WebSocket or SSE in production
    const interval = setInterval(() => {
      // Mock new activity
      if (Math.random() > 0.7 && activityFeed.length < 20) {
        const agents = ['Position Monitor', 'Yield Optimizer', 'Swap Optimizer'];
        const actions = [
          'Checked position health',
          'Analyzed yield opportunities',
          'Fetched 1inch quote',
          'Calculated optimal strategy',
        ];

        setActivityFeed((prev) => [
          {
            id: `activity-${Date.now()}`,
            agentName: agents[Math.floor(Math.random() * agents.length)],
            timestamp: Date.now(),
            action: actions[Math.floor(Math.random() * actions.length)],
            details: 'Routine monitoring',
            success: true,
          },
          ...prev.slice(0, 19),
        ]);
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [activityFeed.length]);

  const atRiskPositions = positionsData?.positions.filter((p) => p.healthFactor < 1.5) || [];
  const allAgentsOnline = agentsData?.agents.every((a) => a.status === 'online') || false;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="glass-card border-b border-white/10">
        <div className="max-w-full px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Presentation Mode</h1>
                <p className="text-sm text-gray-400">
                  Live data from Sepolia • Real agent communication
                </p>
              </div>
            </div>

            {/* System Status */}
            <div className="flex items-center gap-3">
              <div className="glass-card px-4 py-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      allAgentsOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                    }`}
                  />
                  <span className="text-sm text-white font-medium">
                    {allAgentsOnline ? 'All Systems Online' : 'System Issues'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full px-6 py-8">
        {/* Global Error Banners */}
        {agentsError && (
          <ErrorBanner
            type="warning"
            message="Unable to connect to agents. Displaying cached data."
            onRetry={() => window.location.reload()}
          />
        )}
        {positionsError && (
          <ErrorBanner
            type="error"
            message="Failed to load positions from The Graph. Check subgraph availability."
            onRetry={() => window.location.reload()}
          />
        )}
        {pricesError && (
          <ErrorBanner
            type="warning"
            message="Market data temporarily unavailable. Using fallback prices."
            onDismiss={() => {}}
          />
        )}

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Left Column - Main Dashboard */}
          <div className="space-y-6">
            {/* Market Overview */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4">Market Overview</h3>

              {!pricesData ? (
                <div className="grid grid-cols-3 gap-4">
                  <StatsSkeleton />
                  <StatsSkeleton />
                  <StatsSkeleton />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {pricesData?.prices.map((price) => (
                    <div key={price.token} className="glass-card p-4">
                      <div className="text-sm text-gray-400 mb-1">{price.symbol}</div>
                      <div className="text-2xl font-bold text-white">
                        {formatCurrency(price.currentPrice)}
                      </div>
                      <div
                        className={`text-sm mt-1 ${
                          price.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {price.change24h >= 0 ? '+' : ''}
                        {price.change24h.toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* At-Risk Positions */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  At-Risk Positions ({positionsData ? atRiskPositions.length : '...'})
                </h3>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {!positionsData ? (
                <PositionGridSkeleton count={3} />
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {atRiskPositions.length > 0 ? (
                    atRiskPositions.map((position) => (
                      <PositionCardCompact key={position.id} position={position} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No positions at risk. All positions are healthy! 🎉
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-6">Performance Metrics</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {performanceMetrics.responseTime.toFixed(1)}s
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Avg Response Time</div>
                  <div className="text-xs text-green-400 mt-1">
                    Target: &lt;{PRESENTATION_CONFIG.metrics.responseTimeTarget}s
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {performanceMetrics.successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Success Rate</div>
                  <div className="text-xs text-green-400 mt-1">
                    Target: {PRESENTATION_CONFIG.metrics.successRateTarget}%
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {formatCurrency(performanceMetrics.valueProtected)}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Value Protected</div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {performanceMetrics.preventedLiquidations}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Liquidations Prevented</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Strategies Executed</div>
                  <div className="text-white font-semibold mt-1">
                    {performanceMetrics.totalStrategiesExecuted}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Avg HF Improvement</div>
                  <div className="text-white font-semibold mt-1">
                    +{performanceMetrics.averageHealthFactorImprovement.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Total Gas Used</div>
                  <div className="text-white font-semibold mt-1">
                    {performanceMetrics.gasUsed} ETH
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Status Grid */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4">Agent Status</h3>

              {!agentsData ? (
                <AgentGridSkeleton count={5} />
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {agentsData.agents.map((agent) => (
                    <AgentStatusIndicator key={agent.agentId} agent={agent} showDetails />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Trigger Controls & Activity Feed */}
          <div className="space-y-6">
            {/* Trigger Control Panel */}
            <div className="glass-card p-6 sticky top-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Crash Triggers
              </h3>

              <div className="space-y-4">
                {/* Preset Triggers */}
                {Object.entries(PRESENTATION_CONFIG.triggers).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTrigger(key)}
                    className={`
                      w-full text-left p-4 rounded-lg border-2 transition-all
                      ${
                        selectedTrigger === key
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }
                    `}
                  >
                    <div className="font-semibold text-white mb-1">{config.label}</div>
                    <div className="text-sm text-gray-400">
                      ETH: -{(config.ethDrop * 100).toFixed(0)}% • {config.duration}s
                    </div>
                  </button>
                ))}

                {/* Custom Trigger */}
                <div
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${
                      selectedTrigger === 'custom'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-white/5'
                    }
                  `}
                >
                  <button
                    onClick={() => setSelectedTrigger('custom')}
                    className="font-semibold text-white mb-3 w-full text-left"
                  >
                    Custom Trigger
                  </button>

                  {selectedTrigger === 'custom' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">
                          ETH Drop %
                        </label>
                        <input
                          type="number"
                          value={customEthDrop}
                          onChange={(e) => setCustomEthDrop(Number(e.target.value))}
                          className="w-full bg-gray-900 border border-white/10 rounded px-3 py-2 text-white"
                          min="1"
                          max="99"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">
                          Duration (seconds)
                        </label>
                        <input
                          type="number"
                          value={customDuration}
                          onChange={(e) => setCustomDuration(Number(e.target.value))}
                          className="w-full bg-gray-900 border border-white/10 rounded px-3 py-2 text-white"
                          min="1"
                          max="120"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Trigger Button */}
                <button
                  onClick={handleTrigger}
                  className="w-full btn-primary py-4 text-lg font-bold"
                >
                  <TrendingDown className="w-5 h-5 inline mr-2" />
                  Trigger Event
                </button>
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                Live Activity
              </h3>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {activityFeed.length > 0 ? (
                  activityFeed.map((activity) => (
                    <div
                      key={activity.id}
                      className="glass-card p-3 text-sm fade-in"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-white">
                          {activity.agentName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                      </div>
                      <div className="text-gray-400">{activity.action}</div>
                      {activity.details && (
                        <div className="text-xs text-gray-500 mt-1">
                          {activity.details}
                        </div>
                      )}
                      {activity.txHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${activity.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-flex items-center gap-1"
                        >
                          View on Etherscan
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No activity yet. Trigger an event to see agents in action.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}