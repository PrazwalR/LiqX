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
  Target,
  TrendingUp,
  DollarSign,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { API_CONFIG, PRESENTATION_CONFIG, TOKENS } from '@/lib/constants';
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
import { HealthFactorBar } from '@/components/shared/HealthFactorGauge';
import { ErrorBanner } from '@/components/ErrorAlert';
import { PositionGridSkeleton, AgentGridSkeleton, StatsSkeleton } from '@/components/Loading';

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Agent color mapping
const AGENT_COLORS: Record<string, string> = {
  'Position Monitor': '#3B82F6', // Blue
  'Yield Optimizer': '#8B5CF6',  // Purple
  'Swap Optimizer': '#F59E0B',   // Amber
  'Cross-Chain Executor': '#10B981', // Green
  'Presentation Trigger': '#EF4444', // Red
};

// Strategy data interface
interface Strategy {
  protocol: string;
  apy: number;
  riskScore: number;
  hfImprovement: number;
  selected: boolean;
}

export default function EnhancedPresentationPage() {
  const [selectedTrigger, setSelectedTrigger] = useState<string>('marketCrash');
  const [customEthDrop, setCustomEthDrop] = useState(30);
  const [customDuration, setCustomDuration] = useState(10);
  const [activityFeed, setActivityFeed] = useState<AgentActivity[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [triggerTime, setTriggerTime] = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [gasSaved, setGasSaved] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Fetch 1inch API responses
  const { data: oneInchData } = useSWR<{ success: boolean; responses: any[]; message?: string }>(
    '/api/agents/oneinch-responses',
    fetcher,
    { refreshInterval: 3000 }
  );

  // Fetch agent communication messages
  const { data: agentMessages } = useSWR<{ success: boolean; messages: any[]; total: number }>(
    '/api/agents/messages',
    fetcher,
    { refreshInterval: 2000 }  // Poll every 2 seconds for real-time updates
  );

  // Fetch AI-generated strategies from Yield Optimizer
  const { data: strategiesData } = useSWR<{ success: boolean; strategies: any[]; timestamp: number }>(
    '/api/agents/strategies',
    fetcher,
    { refreshInterval: 3000 }  // Poll every 3 seconds
  );

  // Update strategies and gas saved when strategiesData changes
  useEffect(() => {
    if (strategiesData?.strategies && strategiesData.strategies.length > 0) {
      setStrategies(strategiesData.strategies);

      // Calculate gas saved from strategy data if available
      const selectedStrategy = strategiesData.strategies.find(s => s.selected);
      if (selectedStrategy && selectedStrategy.cost) {
        setGasSaved(selectedStrategy.cost);
      }
    }
  }, [strategiesData]);

  // Filter at-risk positions
  const atRiskPositions = positionsData?.positions?.filter(
    (p) => p.healthFactor < 1.5
  ) || [];

  // Initialize price history from current prices
  useEffect(() => {
    if (pricesData?.prices && priceHistory.length === 0) {
      const ethPrice = pricesData.prices.find(p => p.symbol === 'ETH')?.currentPrice || 3850;
      const initialHistory = Array.from({ length: 20 }, (_, i) => ({
        time: Date.now() - (20 - i) * 3000,
        price: ethPrice + (Math.random() - 0.5) * 50,
      }));
      setPriceHistory(initialHistory);
    }
  }, [pricesData]);

  // Update price history periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (pricesData?.prices) {
        const ethPrice = pricesData.prices.find(p => p.symbol === 'ETH')?.currentPrice || 3850;
        setPriceHistory(prev => {
          const newHistory = [
            ...prev.slice(-19),
            { time: Date.now(), price: ethPrice }
          ];
          return newHistory;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pricesData]);

  // Handle crash trigger
  const handleTrigger = async () => {
    // If no position selected, auto-select the most at-risk one
    let positionToMonitor = selectedPosition;
    if (!positionToMonitor && atRiskPositions.length > 0) {
      positionToMonitor = atRiskPositions[0].id;
      setSelectedPosition(positionToMonitor);
    }

    if (!positionToMonitor) {
      console.error('No position selected for monitoring');
      return;
    }

    setIsProcessing(true);

    // Find the selected position data
    const position = positionsData?.positions?.find(p => p.id === positionToMonitor);

    if (!position) {
      console.error('Position not found:', positionToMonitor);
      setIsProcessing(false);
      return;
    }

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
      // First, send position to Position Monitor agent
      const monitorResponse = await fetch('/api/agents/monitor-position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(position),
      });

      const monitorData = await monitorResponse.json();

      if (!monitorData.success) {
        console.error('Failed to send position to agent:', monitorData.error);
        setIsProcessing(false);
        return;
      }

      // Then trigger the crash simulation
      const response = await fetch('/api/presentation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...triggerConfig,
          positionId: positionToMonitor,  // Include selected position
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTriggerTime(Date.now());

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

        // Strategies will be loaded automatically from strategiesData via SWR
        // Reset processing state after a short delay
        setTimeout(() => setIsProcessing(false), 2000);
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Failed to trigger event:', error);
      setIsProcessing(false);
    }
  };

  // Handle position selection
  // Handle position selection - ONLY select, don't trigger agents yet
  const handlePositionSelect = async (positionId: string) => {
    setSelectedPosition(positionId);
    // No agent communication until crash is triggered
    // User needs to click "Trigger" button to start the demo
  };

  // Helper function to convert health factor to percentage
  const healthFactorToPercent = (hf: number): number => {
    if (hf >= 2.0) return 100;
    if (hf <= 1.0) return 0;
    return ((hf - 1.0) / 1.0) * 100;
  };

  // Get agent color
  const getAgentColor = (agentName: string): string => {
    return AGENT_COLORS[agentName] || '#6B7280';
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/10 to-black pointer-events-none" />

      {/* Floating orb effects */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="fixed top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Animated grid pattern */}
      <div className="fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 mb-4 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🎬 Presentation Mode
            </h1>
            <p className="text-gray-400 mt-2">
              Live Demo with Real Data • Trigger market events • Watch AI agents respond
            </p>
          </div>
        </div>

        {/* Error Banners */}
        {agentsError && (
          <ErrorBanner
            type="error"
            message="Failed to load agent status. Make sure agents are running."
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

        <div className="grid lg:grid-cols-[1fr_450px] gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Market Overview with Price Chart */}
            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-4">📈 Market Movement</h3>

              {/* Current Prices */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {!pricesData ? (
                  <>
                    <StatsSkeleton />
                    <StatsSkeleton />
                    <StatsSkeleton />
                  </>
                ) : (
                  pricesData?.prices.map((price) => (
                    <div
                      key={price.token}
                      className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-4 hover:border-blue-500/50 hover:bg-gray-800/50 transition-all duration-300 relative overflow-hidden group cursor-pointer hover:scale-105"
                    >
                      {/* Animated glow effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm text-gray-400">{price.symbol}</div>
                          <div className={`text-xs px-2 py-0.5 rounded font-semibold ${(price.change24h || 0) >= 0
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                            }`}>
                            {(price.change24h || 0) >= 0 ? '↗' : '↘'} {Math.abs(price.change24h || 0).toFixed(2)}%
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-white mb-2">
                          {formatCurrency(price.currentPrice)}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>H: {formatCurrency(price.high24h || price.currentPrice)}</span>
                          <span>L: {formatCurrency(price.low24h || price.currentPrice)}</span>
                        </div>
                        {price.volume24h && price.volume24h > 0 && (
                          <div className="mt-2 text-xs text-gray-400">
                            Vol: ${(price.volume24h / 1e9).toFixed(2)}B
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Price Chart */}
              {priceHistory.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-sm text-gray-400">ETH Price Last 5 Minutes</div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-gray-500">Updates every 3s</span>
                      {priceHistory.length > 1 && (
                        <span className={`font-semibold ${priceHistory[priceHistory.length - 1].price >= priceHistory[0].price
                            ? 'text-green-400'
                            : 'text-red-400'
                          }`}>
                          {priceHistory[priceHistory.length - 1].price >= priceHistory[0].price ? '↗' : '↘'}
                          {' '}
                          {(((priceHistory[priceHistory.length - 1].price - priceHistory[0].price) / priceHistory[0].price) * 100).toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={priceHistory}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis
                        dataKey="time"
                        stroke="#6B7280"
                        tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                      />
                      <YAxis stroke="#6B7280" domain={['dataMin - 50', 'dataMax + 50']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                        labelStyle={{ color: '#9CA3AF', fontSize: '12px' }}
                        itemStyle={{ color: '#3B82F6', fontWeight: 'bold' }}
                        labelFormatter={(time) => new Date(time).toLocaleTimeString()}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'ETH Price']}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fill="url(#priceGradient)"
                      />
                      {triggerTime && (
                        <ReferenceLine
                          x={triggerTime}
                          stroke="#FBBF24"
                          label={{ value: "Crash Triggered", fill: '#FBBF24', fontSize: 12 }}
                          strokeDasharray="3 3"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Interactive Position Selection */}
            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-400" />
                  Select Position to Protect
                </h3>
                <span className="text-sm text-gray-400">
                  {atRiskPositions.length} at-risk positions
                </span>
              </div>

              {isProcessing && (
                <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                  <div className="text-sm text-blue-300">
                    <span className="font-semibold">Sending to AI agents...</span>
                    <div className="text-xs text-blue-400 mt-0.5">Position Monitor will assess risk and find optimal strategy</div>
                  </div>
                </div>
              )}

              {!positionsData ? (
                <PositionGridSkeleton count={3} />
              ) : atRiskPositions.length > 0 ? (
                <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                  {atRiskPositions.slice(0, 5).map((position) => (
                    <button
                      key={position.id}
                      onClick={() => handlePositionSelect(position.id)}
                      disabled={isProcessing}
                      className={`p-4 rounded-lg text-left transition-all ${selectedPosition === position.id
                          ? 'bg-blue-500/20 border-2 border-blue-500'
                          : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-white mb-1">
                            {shortenAddress(position.user)}
                          </div>
                          {position.protocol && (
                            <div className="text-xs text-purple-400 mb-1">
                              {position.protocol} • {position.chain}
                            </div>
                          )}
                          <div className="text-sm text-gray-400">
                            Collateral: {formatCurrency(position.totalCollateralUSD)}
                          </div>
                          <div className="text-sm text-gray-400">
                            Debt: {formatCurrency(position.totalDebtUSD)}
                          </div>
                        </div>
                        <div className="text-right">
                          <HealthFactorBar healthFactor={position.healthFactor} showValue={true} />
                          <div className="text-xs text-red-400 mt-2">
                            {position.healthFactor < 1.2 ? 'CRITICAL' : 'AT RISK'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  All positions are healthy! 🎉
                </div>
              )}
            </div>

            {/* AI Strategy Comparison Table */}
            {strategies.length > 0 && (
              <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  💡 AI-Generated Strategies
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 text-sm">
                        <th className="text-left p-3">Protocol</th>
                        <th className="text-right p-3">APY</th>
                        <th className="text-right p-3">Risk Score</th>
                        <th className="text-right p-3">HF Improvement</th>
                        <th className="text-right p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {strategies.map((strategy, idx) => (
                        <tr
                          key={idx}
                          className={`border-b border-white/5 ${strategy.selected ? 'bg-green-500/10' : ''
                            }`}
                        >
                          <td className="p-3 text-white font-semibold">{strategy.protocol}</td>
                          <td className="text-right p-3 text-green-400 font-semibold">
                            {strategy.apy}%
                          </td>
                          <td className="text-right p-3 text-white">
                            {strategy.riskScore}/10
                          </td>
                          <td className="text-right p-3 text-blue-400 font-semibold">
                            +{strategy.hfImprovement.toFixed(2)}
                          </td>
                          <td className="text-right p-3">
                            {strategy.selected && (
                              <span className="text-green-400 text-sm font-semibold">
                                ✅ SELECTED
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Gas Savings */}
                {gasSaved > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                      <div className="text-green-400 text-sm mb-1 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Gas Saved (Fusion+)
                      </div>
                      <div className="text-2xl font-bold text-green-400">
                        ${gasSaved.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Gasless execution
                      </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <div className="text-gray-400 text-sm mb-1 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Traditional Swap
                      </div>
                      <div className="text-2xl font-bold text-gray-300">
                        ${(gasSaved * 2.5).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Would cost gas
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Agent Status Grid */}
            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-4">🤖 Agent Status</h3>

              {!agentsData ? (
                <AgentGridSkeleton count={5} />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {agentsData?.agents.slice(0, 4).map((agent) => (
                    <div key={agent.agentId} className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all duration-300">
                      <div className={`w-3 h-3 rounded-full ${agent.status === 'online' ? 'bg-green-500' : agent.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <div className="mt-2 text-sm font-semibold text-white">
                        {agent.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {agent.status === 'online' ? 'HTTP Active' : agent.status === 'busy' ? 'Processing' : 'Offline'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Controls & Activity */}
          <div className="space-y-6">
            {/* Trigger Controls */}
            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Crash Simulation
              </h3>

              <div className="space-y-3">
                {Object.entries(PRESENTATION_CONFIG.triggers).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTrigger(key)}
                    className={`
                      w-full text-left p-4 rounded-xl border-2 transition-all duration-300
                      ${selectedTrigger === key
                        ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                        : 'border-gray-700 bg-gray-800/30 hover:border-blue-400/50 hover:bg-gray-700/40'
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
                    p-4 rounded-xl border-2 transition-all duration-300
                    ${selectedTrigger === 'custom'
                      ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                      : 'border-gray-700 bg-gray-800/30'
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
                  disabled={!selectedPosition}
                  className={`w-full py-4 text-lg font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${selectedPosition
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-blue-500/50 hover:scale-105'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <TrendingDown className="w-5 h-5" />
                  {selectedPosition ? 'Trigger Event' : 'Select Position First'}
                </button>

                {!selectedPosition && (
                  <div className="text-xs text-yellow-400 text-center mt-2">
                    ⚠️ Please select a position above before triggering
                  </div>
                )}
              </div>
            </div>

            {/* Live Activity Feed with Agent Messages */}
            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                🔴 LIVE Agent Communication
              </h3>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {agentMessages?.messages && agentMessages.messages.length > 0 ? (
                  agentMessages.messages.map((msg, index) => {
                    const isReceived = msg.direction === 'received';
                    const agentName = isReceived ? msg.from : msg.from;

                    return (
                      <div
                        key={`${msg.timestamp}-${index}`}
                        className="bg-white/5 p-3 rounded-lg border-l-4 fade-in"
                        style={{ borderColor: getAgentColor(agentName) }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex-1">
                            <div className="font-semibold text-white flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getAgentColor(agentName) }}
                              />
                              {msg.direction === 'sent' ? '→' : '←'} {msg.from}
                              {msg.to && msg.direction === 'sent' && (
                                <span className="text-gray-400 text-xs">to {msg.to}</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-300 mt-1 font-semibold">
                              {msg.message_type}
                            </div>
                            {msg.details && typeof msg.details === 'object' && Object.keys(msg.details).length > 0 && (
                              <div className="text-xs mt-2 space-y-1">
                                {Object.entries(msg.details).map(([key, value]) => {
                                  // Format the value based on type
                                  let displayValue = String(value);
                                  let valueColor = 'text-gray-300';

                                  // Handle currency formatting
                                  if (key.includes('collateral') || key.includes('debt') || key.includes('amount_usd')) {
                                    if (typeof value === 'number' || !isNaN(Number(value))) {
                                      displayValue = formatCurrency(Number(value));
                                      valueColor = 'text-green-400';
                                    }
                                  }

                                  // Handle health factor with color coding
                                  if (key === 'health_factor' && typeof value === 'number') {
                                    displayValue = value.toFixed(3);
                                    valueColor = value < 1.2 ? 'text-red-400' : value < 1.5 ? 'text-yellow-400' : 'text-green-400';
                                  }

                                  // Handle APY improvement
                                  if (key === 'apy_improvement') {
                                    valueColor = 'text-green-400 font-semibold';
                                  }

                                  // Handle risk level
                                  if (key === 'risk_level') {
                                    valueColor = value === 'critical' ? 'text-red-400' : value === 'high' ? 'text-orange-400' : 'text-yellow-400';
                                  }

                                  // Handle risk score
                                  if (key === 'risk_score' && typeof value === 'number') {
                                    valueColor = value <= 3 ? 'text-green-400' : value <= 6 ? 'text-yellow-400' : 'text-red-400';
                                  }

                                  // Truncate long addresses
                                  if (key.includes('user') || key.includes('address')) {
                                    displayValue = shortenAddress(String(value));
                                    valueColor = 'text-blue-400';
                                  }

                                  // Handle protocol and chain
                                  if (key.includes('protocol') || key === 'chain') {
                                    valueColor = 'text-purple-400';
                                  }

                                  // Format key for display
                                  const displayKey = key
                                    .replace(/_/g, ' ')
                                    .split(' ')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' ');

                                  return (
                                    <div key={key} className="flex justify-between items-center">
                                      <span className="text-gray-500">{displayKey}:</span>
                                      <span className={valueColor}>{displayValue}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                            {formatRelativeTime(new Date(msg.timestamp).getTime())}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : activityFeed.length > 0 ? (
                  activityFeed.map((activity) => (
                    <div
                      key={activity.id}
                      className="bg-white/5 p-3 rounded-lg border-l-4 fade-in"
                      style={{ borderColor: getAgentColor(activity.agentName) }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getAgentColor(activity.agentName) }}
                            />
                            {activity.agentName}
                          </div>
                          <div className="text-sm text-gray-300 mt-1">{activity.action}</div>
                          {activity.details && (
                            <div className="text-xs text-gray-500 mt-1">
                              {activity.details}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 ml-2">
                          {formatRelativeTime(activity.timestamp)}
                        </div>
                      </div>
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

            {/* 1inch Fusion+ API Responses */}
            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  1inch Fusion+ API
                </h3>
                {oneInchData?.responses && oneInchData.responses.length > 0 && (
                  <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                    {oneInchData.responses.length} calls
                  </span>
                )}
              </div>

              {!oneInchData?.responses || oneInchData.responses.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="mb-2">
                    {oneInchData?.message || 'No 1inch API calls yet.'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Trigger an event to see real API responses
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {oneInchData.responses.map((response, idx) => (
                    <div key={idx} className="glass-card p-4 fade-in">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span className="text-blue-400">
                              {response.request?.from_token?.toUpperCase() || 'TOKEN'}
                            </span>
                            <span className="text-gray-500">→</span>
                            <span className="text-green-400">
                              {response.request?.to_token?.toUpperCase() || 'TOKEN'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            ${response.request?.amount_usd?.toFixed(2) || '0.00'} • Chain ID: {response.request?.chain_id || 1}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${response.status === 'success'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                              }`}
                          >
                            {response.status}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(response.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      {/* Response Data */}
                      {response.status === 'success' && response.response && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-white/5 p-2 rounded">
                              <div className="text-gray-400 text-xs">Output Amount</div>
                              <div className="text-white font-mono">
                                {(parseInt(response.response.dstTokenAmount || '0') / 1e18).toFixed(6)}
                              </div>
                            </div>
                            <div className="bg-white/5 p-2 rounded">
                              <div className="text-gray-400 text-xs">Preset</div>
                              <div className="text-white capitalize">
                                {response.response.recommendedPreset || 'N/A'}
                              </div>
                            </div>
                            <div className="bg-green-500/10 p-2 rounded col-span-2">
                              <div className="text-green-400 text-xs flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                Gasless Swap (Resolvers pay gas)
                              </div>
                            </div>
                          </div>

                          {/* Collapsible JSON */}
                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm text-blue-400 hover:text-blue-300">
                              View Full API Response
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-900 rounded-lg text-xs text-gray-300 overflow-x-auto">
                              {JSON.stringify(response.response, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}

                      {/* Error Response */}
                      {response.status === 'error' && response.response && (
                        <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                          <div className="text-red-400 text-sm font-semibold mb-1 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Error: {response.response.status_code || 'Unknown'}
                          </div>
                          <div className="text-gray-300 text-xs mb-2">
                            {response.response.error || 'API request failed'}
                          </div>
                          {response.response.description && (
                            <div className="text-gray-400 text-xs mb-2">
                              {response.response.description}
                            </div>
                          )}
                          <div className="text-yellow-400 text-xs bg-yellow-500/10 p-2 rounded mt-2 flex items-start gap-2">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-semibold">Expected in Demo Mode</div>
                              <div className="text-yellow-300/80 mt-0.5">
                                Truncated addresses are used for privacy in presentation.
                                The system automatically falls back to demo mode with MeTTa AI reasoning.
                              </div>
                            </div>
                          </div>

                          {/* Collapsible Error Details */}
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-300">
                              View Raw Error Response
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-900 rounded text-xs text-gray-400 overflow-x-auto">
                              {JSON.stringify(response.response, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
