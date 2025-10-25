'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  Zap,
  Shield,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { DEMO_CONFIG, TOKENS } from '@/lib/constants';
import { DemoPhase, DemoAgentAction } from '@/lib/types';
import {
  formatCurrency,
  formatHealthFactor,
  getHealthFactorColor,
  formatDuration,
} from '@/lib/utils';
import { HealthFactorGauge } from '@/components/shared/HealthFactorGauge';
import { BeforeAfterComparison } from '@/components/shared/BeforeAfterComparison';

interface PriceDataPoint {
  time: number;
  price: number;
  healthFactor: number;
}

export default function DemoPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<DemoPhase>(DemoPhase.NORMAL);

  // Demo state
  const [ethPrice, setEthPrice] = useState(2500);
  const [healthFactor, setHealthFactor] = useState(1.87);
  const [collateralUSD, setCollateralUSD] = useState(10000);
  const [debtUSD, setDebtUSD] = useState(5000);
  const [agentActions, setAgentActions] = useState<DemoAgentAction[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([
    { time: 0, price: 2500, healthFactor: 1.87 }
  ]);
  
  // Track which actions have been triggered
  const [actionsTriggered, setActionsTriggered] = useState({
    positionMonitor: false,
    yieldOptimizer: false,
    swapOptimizer: false,
    yieldComplete: false,
    swapInProgress: false,
    swapComplete: false,
    crossChain: false,
  });

  // Reset demo
  const resetDemo = () => {
    setIsPlaying(false);
    setElapsedTime(0);
    setCurrentPhase(DemoPhase.NORMAL);
    setEthPrice(2500);
    setHealthFactor(1.87);
    setCollateralUSD(10000);
    setDebtUSD(5000);
    setAgentActions([]);
    setPriceHistory([{ time: 0, price: 2500, healthFactor: 1.87 }]);
    setActionsTriggered({
      positionMonitor: false,
      yieldOptimizer: false,
      swapOptimizer: false,
      yieldComplete: false,
      swapInProgress: false,
      swapComplete: false,
      crossChain: false,
    });
  };

  // Demo animation logic
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 0.1;

        // Update price history for normal phase (every 1 second)
        if (newTime < DEMO_CONFIG.timeline.crashStart) {
          if (Math.floor(newTime) !== Math.floor(newTime - 0.1)) {
            setPriceHistory(prev => [...prev, { time: newTime, price: 2500, healthFactor: 1.87 }]);
          }
        }

        // Phase transitions
        if (newTime >= DEMO_CONFIG.timeline.crashStart && newTime < DEMO_CONFIG.timeline.crashPeak) {
          setCurrentPhase(DemoPhase.CRASH);
          
          // Animate price crash (30% drop over 10 seconds)
          const crashProgress = (newTime - DEMO_CONFIG.timeline.crashStart) / 
            (DEMO_CONFIG.timeline.crashPeak - DEMO_CONFIG.timeline.crashStart);
          const newPrice = 2500 * (1 - 0.3 * crashProgress);
          setEthPrice(newPrice);
          
          // Recalculate collateral and health factor
          const newCollateral = 10000 * (newPrice / 2500);
          setCollateralUSD(newCollateral);
          const newHF = (newCollateral * 0.85) / 5000;
          setHealthFactor(newHF);
          
          // Update price history every 0.5 seconds
          if (Math.floor(newTime * 2) !== Math.floor((newTime - 0.1) * 2)) {
            setPriceHistory(prev => [...prev, { time: newTime, price: newPrice, healthFactor: newHF }]);
          }

        } else if (newTime >= DEMO_CONFIG.timeline.agentDetect && newTime < DEMO_CONFIG.timeline.agentPlan) {
          setCurrentPhase(DemoPhase.DETECTION);
          
          if (!actionsTriggered.positionMonitor) {
            setActionsTriggered(prev => ({ ...prev, positionMonitor: true }));
            setAgentActions([
              {
                agent: 'Position Monitor',
                timestamp: Date.now(),
                action: 'Detected critical health factor: 1.12',
                status: 'complete',
              },
            ]);
          }

        } else if (newTime >= DEMO_CONFIG.timeline.agentPlan && newTime < DEMO_CONFIG.timeline.agentExecute) {
          setCurrentPhase(DemoPhase.PLANNING);
          
          // Add Yield Optimizer and Swap Optimizer (only once)
          if (!actionsTriggered.yieldOptimizer) {
            setActionsTriggered(prev => ({ ...prev, yieldOptimizer: true, swapOptimizer: true }));
            setAgentActions((prev) => {
              // Double-check they don't already exist
              const hasYield = prev.some(a => a.agent === 'Yield Optimizer');
              const hasSwap = prev.some(a => a.agent === 'Swap Optimizer');
              if (hasYield || hasSwap) return prev;
              
              return [
                ...prev,
                {
                  agent: 'Yield Optimizer',
                  timestamp: Date.now(),
                  action: 'Strategy: Swap 2 ETH to stETH for yield',
                  status: 'in-progress',
                },
                {
                  agent: 'Swap Optimizer',
                  timestamp: Date.now() + 1000,
                  action: 'Swap executed via 1inch Fusion+',
                  status: 'pending',
                },
              ];
            });
          }
          
          // Progress Yield Optimizer after 3 seconds in planning phase
          if (!actionsTriggered.yieldComplete && newTime >= DEMO_CONFIG.timeline.agentPlan + 3) {
            setActionsTriggered(prev => ({ ...prev, yieldComplete: true, swapInProgress: true }));
            setAgentActions((prev) => 
              prev.map((action, idx) => {
                if (idx === 1) {
                  return {
                    ...action,
                    status: 'complete' as const,
                  };
                }
                if (idx === 2) {
                  return {
                    ...action,
                    status: 'in-progress' as const,
                  };
                }
                return action;
              })
            );
          }

        } else if (newTime >= DEMO_CONFIG.timeline.agentExecute && newTime < DEMO_CONFIG.timeline.recovery) {
          setCurrentPhase(DemoPhase.EXECUTION);
          
          // Complete Swap Optimizer
          if (!actionsTriggered.swapComplete) {
            setActionsTriggered(prev => ({ ...prev, swapComplete: true }));
            setAgentActions((prev) => 
              prev.map((action, idx) => {
                if (idx === 2) {
                  return {
                    ...action,
                    status: 'complete' as const,
                  };
                }
                return action;
              })
            );
          }

        } else if (newTime >= DEMO_CONFIG.timeline.recovery && newTime < DEMO_CONFIG.timeline.complete) {
          setCurrentPhase(DemoPhase.RECOVERY);
          
          // Animate recovery
          const recoveryProgress = (newTime - DEMO_CONFIG.timeline.recovery) / 
            (DEMO_CONFIG.timeline.complete - DEMO_CONFIG.timeline.recovery);
          const targetPrice = 2200; // Partial recovery
          const newPrice = 1750 + (targetPrice - 1750) * recoveryProgress;
          setEthPrice(newPrice);
          
          const newCollateral = 7000 + (8800 - 7000) * recoveryProgress;
          setCollateralUSD(newCollateral);
          const newHF = (newCollateral * 0.85) / 5000;
          setHealthFactor(newHF);
          
          // Update price history every 0.5 seconds
          if (Math.floor(newTime * 2) !== Math.floor((newTime - 0.1) * 2)) {
            setPriceHistory(prev => [...prev, { time: newTime, price: newPrice, healthFactor: newHF }]);
          }

          // Add Cross-Chain Executor confirmation (only once)
          if (!actionsTriggered.crossChain) {
            setActionsTriggered(prev => ({ ...prev, crossChain: true }));
            setAgentActions((prev) => {
              // Check if Cross-Chain Executor already exists
              const hasCrossChain = prev.some(action => action.agent === 'Cross-Chain Executor');
              if (hasCrossChain) return prev;
              
              return [
                ...prev,
                {
                  agent: 'Cross-Chain Executor',
                  timestamp: Date.now(),
                  action: 'Transaction confirmed: 0xabc123...',
                  status: 'complete',
                },
              ];
            });
          }

        } else if (newTime >= DEMO_CONFIG.timeline.complete) {
          setCurrentPhase(DemoPhase.COMPLETE);
          setIsPlaying(false);
        }

        return newTime > DEMO_CONFIG.totalDuration / 1000 ? 0 : newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, actionsTriggered]);

  const phaseDescriptions = {
    [DemoPhase.NORMAL]: 'Market is stable. Position is healthy.',
    [DemoPhase.CRASH]: '⚠️ Flash crash detected! ETH dropping rapidly...',
    [DemoPhase.DETECTION]: '🔍 Position Monitor detecting critical health factor',
    [DemoPhase.PLANNING]: '🧠 AI agents calculating optimal strategy',
    [DemoPhase.EXECUTION]: '⚡ Executing rebalancing strategy',
    [DemoPhase.RECOVERY]: '📈 Position recovering, health factor improving',
    [DemoPhase.COMPLETE]: '✅ Success! Liquidation prevented, position secured',
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="glass-card border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Demo Mode</h1>
                <p className="text-sm text-gray-400">
                  2-minute interactive simulation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="btn-secondary flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <PauseCircle className="w-5 h-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    {elapsedTime > 0 ? 'Resume' : 'Start'}
                  </>
                )}
              </button>
              <button
                onClick={resetDemo}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Timeline Progress */}
        <div className="glass-card p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm text-gray-400">Timeline Progress</div>
              <div className="text-2xl font-bold text-white">
                {formatDuration(Math.floor(elapsedTime))} / 2:00
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Current Phase</div>
              <div className="text-lg font-bold text-blue-400 capitalize">
                {currentPhase.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${(elapsedTime / 120) * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Phase Description */}
          <div className="mt-4 text-center">
            <motion.p
              key={currentPhase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg text-white font-medium"
            >
              {phaseDescriptions[currentPhase]}
            </motion.p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Market Data */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Chart Visualization */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Market Conditions
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-4">
                  <div className="text-sm text-gray-400 mb-1">ETH Price</div>
                  <div className="text-3xl font-bold text-white">
                    {formatCurrency(ethPrice)}
                  </div>
                  <div
                    className={`text-sm mt-1 ${
                      ethPrice < 2000 ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {ethPrice < 2000 ? (
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        {(((ethPrice - 2500) / 2500) * 100).toFixed(1)}%
                      </span>
                    ) : (
                      'Stable'
                    )}
                  </div>
                </div>

                <div className="glass-card p-4">
                  <div className="text-sm text-gray-400 mb-1">Position Value</div>
                  <div className="text-3xl font-bold text-white">
                    {formatCurrency(collateralUSD)}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Debt: {formatCurrency(debtUSD)}
                  </div>
                </div>
              </div>

              {/* Price Chart with Recharts */}
              <div className="relative h-80 bg-gray-900/50 rounded-lg overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={priceHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickFormatter={(value) => `${Math.floor(value)}s`}
                    />
                    <YAxis 
                      domain={[1600, 2600]}
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'price') return [`$${value.toFixed(2)}`, 'ETH Price'];
                        if (name === 'healthFactor') return [value.toFixed(3), 'Health Factor'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Time: ${Math.floor(label as number)}s`}
                    />
                    
                    {/* Critical health factor line */}
                    <ReferenceLine 
                      y={1750} 
                      stroke="#EF4444" 
                      strokeDasharray="3 3" 
                      label={{ value: 'Critical Level ($1,750)', fill: '#EF4444', fontSize: 10, position: 'right' }}
                    />
                    
                    {/* Agent action markers */}
                    {elapsedTime >= 25 && (
                      <ReferenceLine 
                        x={25} 
                        stroke="#10B981" 
                        strokeDasharray="3 3"
                        label={{ value: '⚡ Detected', fill: '#10B981', fontSize: 10, position: 'top' }}
                      />
                    )}
                    {elapsedTime >= 40 && (
                      <ReferenceLine 
                        x={40} 
                        stroke="#8B5CF6" 
                        strokeDasharray="3 3"
                        label={{ value: '🔄 Planning', fill: '#8B5CF6', fontSize: 10, position: 'top' }}
                      />
                    )}
                    {elapsedTime >= 45 && (
                      <ReferenceLine 
                        x={45} 
                        stroke="#F59E0B" 
                        strokeDasharray="3 3"
                        label={{ value: '⚡ Executing', fill: '#F59E0B', fontSize: 10, position: 'top' }}
                      />
                    )}
                    {elapsedTime >= 50 && (
                      <ReferenceLine 
                        x={50} 
                        stroke="#10B981" 
                        strokeDasharray="3 3"
                        label={{ value: '✅ Recovery', fill: '#10B981', fontSize: 10, position: 'top' }}
                      />
                    )}
                    
                    {/* Area under the line */}
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPrice)" 
                    />
                    
                    {/* Price line */}
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={false}
                      animationDuration={300}
                    />
                  </ComposedChart>
                </ResponsiveContainer>

                {currentPhase === DemoPhase.CRASH && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-semibold"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Flash Crash in Progress
                  </motion.div>
                )}
              </div>
            </div>

            {/* Agent Actions Timeline */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Agent Activity
              </h3>

              <div className="space-y-3">
                <AnimatePresence>
                  {agentActions.map((action) => (
                    <motion.div
                      key={`${action.agent}-${action.timestamp}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass-card p-4 border-l-4"
                      style={{
                        borderLeftColor:
                          action.status === 'complete'
                            ? '#10B981'
                            : action.status === 'in-progress'
                            ? '#F59E0B'
                            : '#6B7280',
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {action.agent}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {action.action}
                          </div>
                        </div>
                        {action.status === 'complete' && (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                        {action.status === 'in-progress' && (
                          <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {agentActions.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Waiting for market event...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Health Factor & Status */}
          <div className="space-y-6">
            {/* Health Factor Gauge */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-6 text-center">
                Position Health
              </h3>
              <div className="flex justify-center">
                <HealthFactorGauge healthFactor={healthFactor} size="lg" />
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Collateral</span>
                  <span className="text-sm font-semibold text-white">
                    {formatCurrency(collateralUSD)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Debt</span>
                  <span className="text-sm font-semibold text-white">
                    {formatCurrency(debtUSD)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">LTV Ratio</span>
                  <span className="text-sm font-semibold text-white">
                    {((debtUSD / collateralUSD) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Explanatory Overlay */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                What's Happening?
              </h3>

              <div className="space-y-3 text-sm text-gray-300">
                {currentPhase === DemoPhase.NORMAL && (
                  <p>
                    Your DeFi position is healthy with a Health Factor of {formatHealthFactor(healthFactor)}. 
                    Our AI agents are monitoring markets 24/7.
                  </p>
                )}
                {currentPhase === DemoPhase.CRASH && (
                  <p>
                    A flash crash is occurring! ETH price is dropping {((2500 - ethPrice) / 2500 * 100).toFixed(1)}%, 
                    reducing your collateral value and health factor.
                  </p>
                )}
                {currentPhase === DemoPhase.DETECTION && (
                  <p>
                    Position Monitor detected your Health Factor dropped below the safe threshold. 
                    It's alerting other agents to take action.
                  </p>
                )}
                {currentPhase === DemoPhase.PLANNING && (
                  <p>
                    AI agents are analyzing the best strategy: Should we add collateral, 
                    repay debt, or rebalance to a more stable asset like stETH?
                  </p>
                )}
                {currentPhase === DemoPhase.EXECUTION && (
                  <p>
                    Executing optimal strategy via 1inch Fusion+ for best prices and MEV protection. 
                    Swapping volatile assets to staked ETH for stability.
                  </p>
                )}
                {currentPhase === DemoPhase.RECOVERY && (
                  <p>
                    Strategy executed successfully! Your position is recovering with improved 
                    stability from yield-bearing assets.
                  </p>
                )}
                {currentPhase === DemoPhase.COMPLETE && (
                  <p className="text-green-400 font-semibold">
                    Mission accomplished! Liquidation prevented, $45K in value protected, 
                    and position is now secure with improved health factor.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Before/After Comparison (shown at completion) */}
        {currentPhase === DemoPhase.COMPLETE && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <BeforeAfterComparison
              data={{
                before: {
                  healthFactor: 1.12,
                  collateralUSD: 7000,
                  debtUSD: 5000,
                  atRisk: true,
                },
                after: {
                  healthFactor: 1.65,
                  collateralUSD: 8800,
                  debtUSD: 5000,
                  atRisk: false,
                },
              }}
            />

            {/* Success Metrics */}
            <div className="grid grid-cols-3 gap-6 mt-8">
              <div className="glass-card p-6 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">3</div>
                <div className="text-sm text-gray-400">Liquidations Prevented</div>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">$45K</div>
                <div className="text-sm text-gray-400">Value Protected</div>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">47%</div>
                <div className="text-sm text-gray-400">HF Improvement</div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mt-8 text-center">
              <Link href="/presentation" className="btn-primary text-lg px-8 py-4">
                See It Work With Real Data →
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}