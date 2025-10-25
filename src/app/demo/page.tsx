'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
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
  aaveCollateral: number;
  lidoCollateral: number;
  totalETH: number;
}

export default function DemoPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<DemoPhase>(DemoPhase.NORMAL);

  // Demo state - CORRECT VALUES from specification
  const [ethPrice, setEthPrice] = useState(3200);
  const [healthFactor, setHealthFactor] = useState(1.87);
  const [collateralUSD, setCollateralUSD] = useState(100000); // 31.25 ETH * $3,200
  const [debtUSD, setDebtUSD] = useState(75000); // $75,000 USDC
  const [agentActions, setAgentActions] = useState<DemoAgentAction[]>([]);

  // Start with empty chart - will populate when demo starts
  const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([]);

  // Track Aave (blue) and Lido (orange) collateral separately
  const [aaveCollateralETH, setAaveCollateralETH] = useState(31.25); // Initially all in Aave
  const [lidoCollateralETH, setLidoCollateralETH] = useState(0); // None in Lido initially

  // Track which actions have been triggered (kept for debugging, actual checks use ref)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [actionsTriggered, setActionsTriggered] = useState({
    positionMonitor: false,
    yieldOptimizer: false,
    swapOptimizer: false,
    yieldComplete: false,
    swapInProgress: false,
    swapComplete: false,
    crossChain: false,
    recoveryComplete: false,
    executorStep1: false,
    executorStep2: false,
    executorStep3: false,
    executorStep4: false,
  });

  // Use ref to avoid stale closure issues in interval
  const actionsExecutedRef = useRef({
    positionMonitor: false,
    yieldOptimizer: false,
    swapOptimizer: false,
    yieldComplete: false,
    swapComplete: false,
    recoveryComplete: false,
    executorStep1: false,
    executorStep2: false,
    executorStep3: false,
    executorStep4: false,
    chartTransitionAdded: false,
  });

  // Reset demo
  const resetDemo = () => {
    setIsPlaying(false);
    setElapsedTime(0);
    setCurrentPhase(DemoPhase.NORMAL);
    setEthPrice(3200);
    setHealthFactor(1.87);
    setCollateralUSD(100000);
    setDebtUSD(75000);
    setAgentActions([]);
    setPriceHistory([]); // Empty chart on reset
    setAaveCollateralETH(31.25); // Reset to all in Aave
    setLidoCollateralETH(0); // Reset to none in Lido

    setActionsTriggered({
      positionMonitor: false,
      yieldOptimizer: false,
      swapOptimizer: false,
      yieldComplete: false,
      swapInProgress: false,
      swapComplete: false,
      crossChain: false,
      recoveryComplete: false,
      executorStep1: false,
      executorStep2: false,
      executorStep3: false,
      executorStep4: false,
    });

    // Reset ref
    actionsExecutedRef.current = {
      positionMonitor: false,
      yieldOptimizer: false,
      swapOptimizer: false,
      yieldComplete: false,
      swapComplete: false,
      recoveryComplete: false,
      executorStep1: false,
      executorStep2: false,
      executorStep3: false,
      executorStep4: false,
      chartTransitionAdded: false,
    };
  };

  // Demo animation logic - 2 MINUTE TIMELINE
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        const newTime = prev + 0.1;

        // T+0:00 - T+0:20: Normal Market ($3,200, HF 1.87)
        if (newTime < 20) {
          setCurrentPhase(DemoPhase.NORMAL);
          setEthPrice(3200);
          setHealthFactor(1.87);
          setCollateralUSD(100000); // 31.25 ETH * $3,200
          setAaveCollateralETH(31.25); // All in Aave
          setLidoCollateralETH(0);

          // T+0: Position Monitor starts monitoring (yellow/in-progress)
          if (!actionsExecutedRef.current.positionMonitor && newTime >= 0) {
            actionsExecutedRef.current.positionMonitor = true;
            setActionsTriggered(prev => ({ ...prev, positionMonitor: true }));
            setAgentActions([
              {
                agent: 'Position Monitor',
                timestamp: Date.now(),
                action: '👁️ Monitoring position health... | Current HF: 1.87 | Status: Safe | Checking every 5s...',
                status: 'in-progress',
              },
            ]);
          }

          // Add data point every 0.5 seconds
          if (Math.floor(newTime * 2) !== Math.floor((newTime - 0.1) * 2)) {
            setPriceHistory(prev => [...prev, {
              time: newTime,
              price: 3200,
              healthFactor: 1.87,
              aaveCollateral: 31.25,
              lidoCollateral: 0,
              totalETH: 31.25
            }]);
          }
        }

        // T+0:20 - T+0:25: Flash Crash Begins (drop to $2,500, -22%)
        else if (newTime >= 20 && newTime < 25) {
          setCurrentPhase(DemoPhase.CRASH);

          // Crash from $3,200 to $2,500 over 5 seconds
          const crashProgress = (newTime - 20) / 5;
          const newPrice = 3200 - (3200 - 2500) * crashProgress;
          setEthPrice(newPrice);

          // Collateral: 31.25 ETH * newPrice (still all in Aave)
          const newCollateral = 31.25 * newPrice;
          setCollateralUSD(newCollateral);
          setAaveCollateralETH(31.25);
          setLidoCollateralETH(0);

          // Health Factor = (collateral * 0.85) / debt
          const newHF = (newCollateral * 0.85) / 75000;
          setHealthFactor(newHF);

          // Update chart every 0.2 seconds during crash
          if (Math.floor(newTime * 5) !== Math.floor((newTime - 0.1) * 5)) {
            setPriceHistory(prev => [...prev, {
              time: newTime,
              price: newPrice,
              healthFactor: newHF,
              aaveCollateral: 31.25,
              lidoCollateral: 0,
              totalETH: 31.25
            }]);
          }
        }

        // T+0:25 - T+0:35: Crash Deepens ($2,500 → $2,240, -30% total)
        else if (newTime >= 25 && newTime < 35) {
          setCurrentPhase(DemoPhase.DETECTION);

          // Continue crash from $2,500 to $2,240 over 10 seconds
          const crashProgress = (newTime - 25) / 10;
          const newPrice = 2500 - (2500 - 2240) * crashProgress;
          setEthPrice(newPrice);

          // Collateral: 31.25 ETH * newPrice (still all in Aave)
          const newCollateral = 31.25 * newPrice;
          setCollateralUSD(newCollateral);
          setAaveCollateralETH(31.25);
          setLidoCollateralETH(0);

          // Health Factor = (collateral * 0.85) / 75000
          const newHF = (newCollateral * 0.85) / 75000;
          setHealthFactor(newHF);

          // Update chart every 0.5 seconds
          if (Math.floor(newTime * 2) !== Math.floor((newTime - 0.1) * 2)) {
            setPriceHistory(prev => [...prev, {
              time: newTime,
              price: newPrice,
              healthFactor: newHF,
              aaveCollateral: 31.25,
              lidoCollateral: 0,
              totalETH: 31.25
            }]);
          }

          // T+0:25: Position Monitor completes detection, Yield Optimizer starts
          if (!actionsExecutedRef.current.yieldOptimizer && newTime >= 25) {
            actionsExecutedRef.current.yieldOptimizer = true;
            setActionsTriggered(prev => ({ ...prev, yieldOptimizer: true }));

            setAgentActions((prev) => {
              // Complete Position Monitor
              const updated = prev.map((action) => {
                if (action.agent === 'Position Monitor') {
                  return {
                    ...action,
                    action: '🚨 CRITICAL! Health Factor: 1.12 | Liquidation probability: 80% | MeTTa AI: "Immediate action required"',
                    status: 'complete' as const,
                  };
                }
                return action;
              });

              // Add Yield Optimizer (in-progress)
              return [
                ...updated,
                {
                  agent: 'Yield Optimizer',
                  timestamp: Date.now(),
                  action: '💡 Analyzing yields → Scanning protocols... | Checking: Aave, Lido, Compound, Yearn...',
                  status: 'in-progress',
                },
              ];
            });
          }

        }

        // T+0:35 - T+0:38: Yield Optimizer running (stays in-progress)
        else if (newTime >= 35 && newTime < 38) {
          setCurrentPhase(DemoPhase.PLANNING);

          // Keep price at $2,240 during planning
          setEthPrice(2240);
          const collateral = 31.25 * 2240;
          setCollateralUSD(collateral);
          setHealthFactor((collateral * 0.85) / 75000);
          setAaveCollateralETH(31.25);
          setLidoCollateralETH(0);

          // Update chart
          if (Math.floor(newTime * 2) !== Math.floor((newTime - 0.1) * 2)) {
            setPriceHistory(prev => [...prev, {
              time: newTime,
              price: 2240,
              healthFactor: (collateral * 0.85) / 75000,
              aaveCollateral: 31.25,
              lidoCollateral: 0,
              totalETH: 31.25
            }]);
          }
        }

        // T+0:38 - T+0:40: Complete Yield Optimizer, add Swap Optimizer
        else if (newTime >= 38 && newTime < 40) {
          setCurrentPhase(DemoPhase.PLANNING);

          // Keep price stable during planning
          setEthPrice(2240);
          const collateral = 31.25 * 2240;
          setCollateralUSD(collateral);
          setHealthFactor((collateral * 0.85) / 75000);
          setAaveCollateralETH(31.25);
          setLidoCollateralETH(0);

          // T+38s: Complete Yield Optimizer
          if (!actionsExecutedRef.current.yieldComplete && newTime >= 38) {
            actionsExecutedRef.current.yieldComplete = true;
            setActionsTriggered(prev => ({ ...prev, yieldComplete: true }));

            setAgentActions((prev) =>
              prev.map((action) => {
                if (action.agent === 'Yield Optimizer' && action.status === 'in-progress') {
                  return {
                    ...action,
                    action: '💡 Strategy confirmed: Move 6.4 ETH to Lido | Improvement: +2.3% APY | +$460/year ✅',
                    status: 'complete' as const,
                  };
                }
                return action;
              })
            );
          }

          // Add Swap Optimizer with Fusion+ quote details
          if (!actionsExecutedRef.current.swapOptimizer && newTime >= 38) {
            actionsExecutedRef.current.swapOptimizer = true;
            setActionsTriggered(prev => ({ ...prev, swapOptimizer: true }));

            setAgentActions((prev) => [
              ...prev,
              {
                agent: 'Swap Optimizer',
                timestamp: Date.now(),
                action: '🔄 1inch Fusion+ Quote → From: 6.4 WETH | To: 6.38 wstETH | Gas: $0 (gasless!) | MEV Protection: ✅ | Execution time: ~10s',
                status: 'in-progress',
              },
            ]);
          }

          // Update chart during planning
          if (Math.floor(newTime * 2) !== Math.floor((newTime - 0.1) * 2)) {
            setPriceHistory(prev => [...prev, {
              time: newTime,
              price: 2240,
              healthFactor: (collateral * 0.85) / 75000,
              aaveCollateral: 31.25,
              lidoCollateral: 0,
              totalETH: 31.25
            }]);
          }
        }

        // T+0:40 - T+0:50: Agent 4 (Executor) Executes All Steps
        else if (newTime >= 40 && newTime < 50) {
          setCurrentPhase(DemoPhase.EXECUTION);

          // Keep collateral at starting position during execution (transaction pending)
          // Collateral split will instantly change at T+50s when transaction confirms
          setAaveCollateralETH(31.25); // All still in Aave until T+50s
          setLidoCollateralETH(0);     // Nothing in Lido yet

          // Complete Swap Optimizer and trigger all executor steps (ONLY ONCE)
          if (!actionsExecutedRef.current.swapComplete) {
            actionsExecutedRef.current.swapComplete = true;
            setActionsTriggered(prev => ({ ...prev, swapComplete: true }));

            // Complete Swap Optimizer
            setAgentActions((prev) =>
              prev.map((action) => {
                if (action.agent === 'Swap Optimizer') {
                  return {
                    ...action,
                    action: '🔄 Quote accepted: 6.4 WETH → 6.38 wstETH | Sending to Executor ✅',
                    status: 'complete' as const
                  };
                }
                return action;
              })
            );

            // T+0:40.5s: Step 1 - Withdraw from Aave
            setTimeout(() => {
              if (!actionsExecutedRef.current.executorStep1) {
                actionsExecutedRef.current.executorStep1 = true;
                setActionsTriggered(prev => ({ ...prev, executorStep1: true }));
                setAgentActions((prevActions) => [
                  ...prevActions,
                  {
                    agent: 'Cross-Chain Executor',
                    timestamp: Date.now(),
                    action: '⚡ Step 1/4: Withdrawing from Aave... | Tx: 0xabc123... | Gas: $12.50 ✅',
                    status: 'complete',
                  },
                ]);
              }
            }, 500);

            // T+0:42s: Step 2 - Fusion+ Dutch Auction starts (async, in progress)
            setTimeout(() => {
              if (!actionsExecutedRef.current.executorStep2) {
                actionsExecutedRef.current.executorStep2 = true;
                setActionsTriggered(prev => ({ ...prev, executorStep2: true }));
                setAgentActions((prevActions) => [
                  ...prevActions,
                  {
                    agent: 'Cross-Chain Executor',
                    timestamp: Date.now() + 1,
                    action: '⚡ Step 2/4: Fusion+ Dutch Auction started (60s) | Start: 6.40 wstETH → End: 6.35 | Resolvers competing... 🔄',
                    status: 'in-progress',
                  },
                ]);
              }
            }, 2000);

            // T+0:50s: Step 2 completes - Auction finishes
            setTimeout(() => {
              if (!actionsExecutedRef.current.executorStep3) {
                actionsExecutedRef.current.executorStep3 = true;
                setActionsTriggered(prev => ({ ...prev, executorStep3: true }));

                // Update Step 2 to complete
                setAgentActions((prevActions) => {
                  const updated = prevActions.map((action) => {
                    if (action.agent === 'Cross-Chain Executor' && action.action.includes('Fusion+ Dutch Auction started')) {
                      return {
                        ...action,
                        action: '⚡ Step 2/4: Fusion+ Auction complete! | Winner: 0xdef1... | Rate: 6.38 wstETH | Your gas: $0 | Resolver profit: ~$15 ✅',
                        status: 'complete' as const,
                      };
                    }
                    return action;
                  });

                  return updated;
                });
              }
            }, 10000);

            // T+0:50.5s: Step 3 - Deposit collateral to Lido (AFTER auction completes)
            setTimeout(() => {
              if (!actionsExecutedRef.current.executorStep4) {
                actionsExecutedRef.current.executorStep4 = true;
                setActionsTriggered(prev => ({ ...prev, executorStep4: true }));
                setAgentActions((prevActions) => [
                  ...prevActions,
                  {
                    agent: 'Cross-Chain Executor',
                    timestamp: Date.now() + 2,
                    action: '⚡ Step 3/4: Depositing to Lido | Tx: 0xdef789... | Gas: $8.30 | Collateral secured ✅',
                    status: 'complete',
                  },
                ]);
              }
            }, 10500);
          }

          // During execution: Keep price stable at $2,240, but continue updating chart
          // Collateral stays at starting position until T+50s when transaction completes
          setEthPrice(2240);
          const executionCollateral = 31.25 * 2240; // Keep at starting value
          setCollateralUSD(executionCollateral);
          const executionHF = (executionCollateral * 0.85) / 75000;
          setHealthFactor(executionHF);

          // Continue chart updates during execution (shows time passing)
          if (Math.floor(newTime * 2) !== Math.floor((newTime - 0.1) * 2)) {
            setPriceHistory(prev => [...prev, {
              time: newTime,
              price: 2240,
              healthFactor: executionHF,
              aaveCollateral: 31.25, // Still all in Aave
              lidoCollateral: 0,     // Nothing in Lido yet
              totalETH: 31.25
            }]);
          }

        }

        // T+0:50 - T+2:00: Recovery & Success (Market Stabilizes + Position Saved)
        else if (newTime >= 50) {
          setCurrentPhase(DemoPhase.RECOVERY);

          // Transaction completes at T+50s - collateral instantly moves to final split
          // Final collateral split: 24.85 ETH in Aave + 6.4 wstETH in Lido (6.38 after slippage)
          setAaveCollateralETH(24.85);
          setLidoCollateralETH(6.4); // 6.4 ETH worth of wstETH (actual: 6.38 wstETH after 0.3% slippage)

          // Add spike at T+50s showing the instant transition (sudden jump in chart)
          if (!actionsExecutedRef.current.chartTransitionAdded && newTime >= 50) {
            actionsExecutedRef.current.chartTransitionAdded = true;
            setPriceHistory(prev => [...prev, {
              time: 50,
              price: 2240,
              healthFactor: (31.25 * 2240 * 0.85) / 75000,
              aaveCollateral: 24.85,  // Sudden spike down
              lidoCollateral: 6.4,    // Sudden spike up
              totalETH: 31.25
            }]);
          }

          // Final success message at T+53s (after all executor steps complete)
          if (!actionsExecutedRef.current.recoveryComplete && newTime >= 53) {
            actionsExecutedRef.current.recoveryComplete = true;
            setActionsTriggered(prev => ({ ...prev, recoveryComplete: true }));

            setAgentActions((prev) => [
              ...prev,
              {
                agent: 'System',
                timestamp: Date.now() + 10,
                action: '🎉 SUCCESS! Position secured | Health Factor: 1.65 ✅ | Total gas: $20.80 | Saved $82,960 | Time: 50 seconds ⚡',
                status: 'complete',
              },
            ]);
          }

          // Gradual price recovery: $2,240 → $4,661 over 67 seconds (T+53 to T+120)
          // Final price of $4,661 gives HF = 1.65 (31.25 ETH * $4,661 * 0.85 / $75,000)
          const recoveryProgress = Math.min((newTime - 53) / 67, 1);
          const recoveredPrice = 2240 + (4661 - 2240) * recoveryProgress;
          setEthPrice(recoveredPrice);

          const finalAaveETH = 24.85;
          const finalLidoETH = 6.4; // 6.4 ETH worth of wstETH
          const finalCollateral = (finalAaveETH + finalLidoETH) * recoveredPrice;
          setCollateralUSD(finalCollateral);

          const newHF = (finalCollateral * 0.85) / 75000;
          setHealthFactor(newHF);

          // Update chart (every 0.5 seconds during recovery)
          if (Math.floor(newTime * 2) !== Math.floor((newTime - 0.1) * 2)) {
            setPriceHistory(prev => [...prev, {
              time: newTime,
              price: recoveredPrice,
              healthFactor: newHF,
              aaveCollateral: finalAaveETH,
              lidoCollateral: finalLidoETH,
              totalETH: finalAaveETH + finalLidoETH
            }]);
          }

          // Mark as complete at T+2:00
          if (newTime >= 120) {
            setCurrentPhase(DemoPhase.COMPLETE);
            setIsPlaying(false);
          }
        }

        return newTime > 120 ? 0 : newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const phaseDescriptions = {
    [DemoPhase.NORMAL]: 'Market is stable. ETH at $3,200 | Health Factor: 1.87 ✅',
    [DemoPhase.CRASH]: '⚠️ Flash crash! ETH dropping to $2,500 (-22%) | HF: 1.39',
    [DemoPhase.DETECTION]: '� Critical! ETH at $2,240 (-30%) | HF: 1.12 | Liquidation risk: 80%',
    [DemoPhase.PLANNING]: '🧠 AI calculating strategy: Aave → Lido (+2.3% APY) | Routing via 1inch Fusion+',
    [DemoPhase.EXECUTION]: '⚡ Executing: Withdraw → Swap (gasless) → Deposit | Total gas: $20.80',
    [DemoPhase.RECOVERY]: '✅ Position secured! HF: 1.28 | Market recovering | +$460/year yield',
    [DemoPhase.COMPLETE]: '🎉 Demo complete! Prevented liquidation | Saved $82,960 in 50 seconds',
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden relative pb-20">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/10 to-black pointer-events-none" />

      {/* Floating orb effects */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Animated grid pattern */}
      <div className="fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Header */}
      <div className="relative z-10 border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-blue-400 transition-colors group">
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                  Demo Mode
                </h1>
                <p className="text-sm text-gray-400">
                  2-minute interactive simulation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:scale-105 flex items-center gap-2"
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
                className="px-6 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 text-white font-semibold rounded-lg transition-all duration-300 border border-gray-700 hover:border-gray-600 backdrop-blur-sm hover:scale-105 flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Timeline Progress */}
        <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 mb-8 hover:border-blue-500/30 transition-all duration-300">
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

        {/* Three Stacked Charts */}
        <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 mb-8">
          <h3 className="text-xl font-bold text-white mb-6">
            Live Market & Position Tracking
          </h3>

          <div className="space-y-6">
            {/* Chart 1: ETH Price */}
            <div className="relative">
              <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center justify-between">
                <span>ETH Price Movement</span>
                <div className="flex items-center gap-4">
                  <div className="text-xs">
                    <span className="text-gray-500">Current:</span>
                    <span className={`ml-2 font-bold ${ethPrice < 2500 ? 'text-red-400' : 'text-blue-400'}`}>
                      {formatCurrency(ethPrice)}
                    </span>
                  </div>
                  {ethPrice < 3000 && (
                    <div className="text-xs text-red-400 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      {(((ethPrice - 3200) / 3200) * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              </h4>
              <div className="h-[150px] bg-gray-900/50 rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={priceHistory} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis
                      dataKey="time"
                      type="number"
                      domain={[0, Math.max(elapsedTime + 10, 60)]}
                      stroke="#6B7280"
                      tick={{ fill: '#6B7280', fontSize: 10 }}
                      tickFormatter={(value) => `${Math.floor(value)}s`}
                    />
                    <YAxis
                      domain={[0, 5000]}
                      stroke="#3B82F6"
                      tick={{ fill: '#3B82F6', fontSize: 10 }}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'ETH Price']}
                      labelFormatter={(label) => `${Math.floor(label as number)}s`}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#3B82F6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                      animationDuration={0}
                      isAnimationActive={false}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Collateral Split */}
            <div className="relative">
              <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center justify-between">
                <span>Collateral Distribution</span>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-[2px] bg-blue-400"></div>
                    <span className="text-blue-400">Aave: {aaveCollateralETH.toFixed(2)} ETH</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-[2px] bg-orange-500"></div>
                    <span className="text-orange-500">Lido: {lidoCollateralETH.toFixed(2)} wstETH</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-[2px] bg-purple-400"></div>
                    <span className="text-purple-400">Total: {(aaveCollateralETH + lidoCollateralETH).toFixed(2)} ETH</span>
                  </div>
                </div>
              </h4>
              <div className="h-[150px] bg-gray-900/50 rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={priceHistory} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorAave" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorLido" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis
                      dataKey="time"
                      type="number"
                      domain={[0, Math.max(elapsedTime + 10, 60)]}
                      stroke="#6B7280"
                      tick={{ fill: '#6B7280', fontSize: 10 }}
                      tickFormatter={(value) => `${Math.floor(value)}s`}
                    />
                    <YAxis
                      domain={[0, 35]}
                      stroke="#A78BFA"
                      tick={{ fill: '#A78BFA', fontSize: 10 }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'aaveCollateral') return [`${value.toFixed(2)} ETH`, 'Aave'];
                        if (name === 'lidoCollateral') return [`${value.toFixed(2)} wstETH`, 'Lido'];
                        if (name === 'totalETH') return [`${value.toFixed(2)} ETH`, 'Total'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `${Math.floor(label as number)}s`}
                    />
                    <Area
                      type="monotone"
                      dataKey="aaveCollateral"
                      stroke="#60A5FA"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAave)"
                      animationDuration={0}
                      isAnimationActive={false}
                      connectNulls
                    />
                    <Area
                      type="monotone"
                      dataKey="lidoCollateral"
                      stroke="#F97316"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorLido)"
                      animationDuration={0}
                      isAnimationActive={false}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="totalETH"
                      stroke="#A78BFA"
                      strokeWidth={2}
                      dot={false}
                      animationDuration={0}
                      isAnimationActive={false}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Health Factor */}
            <div className="relative">
              <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center justify-between">
                <span>Health Factor Status</span>
                <div className="flex items-center gap-4 text-xs">
                  <div className={`font-bold`} style={{ color: getHealthFactorColor(healthFactor) }}>
                    Current: {formatHealthFactor(healthFactor)}
                    {healthFactor < 1.2 && <span className="ml-2 text-red-400">⚠️ At Risk</span>}
                    {healthFactor >= 1.2 && healthFactor < 1.5 && <span className="ml-2 text-yellow-400">⚠️ Monitor</span>}
                    {healthFactor >= 1.5 && currentPhase >= DemoPhase.RECOVERY && <span className="ml-2 text-green-400">+47.3%</span>}
                  </div>
                </div>
              </h4>
              <div className="h-[150px] bg-gray-900/50 rounded-lg p-4 relative">
                {/* Critical threshold line background */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-0 right-0 bg-red-500/5" style={{ top: '60%', height: '40%' }}></div>
                  <div className="absolute left-0 right-0 bg-yellow-500/5" style={{ top: '40%', height: '20%' }}></div>
                  <div className="absolute left-0 right-0 bg-green-500/5" style={{ top: '0%', height: '40%' }}></div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={priceHistory} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorHF" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis
                      dataKey="time"
                      type="number"
                      domain={[0, Math.max(elapsedTime + 10, 60)]}
                      stroke="#6B7280"
                      tick={{ fill: '#6B7280', fontSize: 10 }}
                      tickFormatter={(value) => `${Math.floor(value)}s`}
                      label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5, fill: '#6B7280', fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0.8, 2.0]}
                      stroke="#10B981"
                      tick={{ fill: '#10B981', fontSize: 10 }}
                      tickFormatter={(value) => value.toFixed(2)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [value.toFixed(3), 'Health Factor']}
                      labelFormatter={(label) => `${Math.floor(label as number)}s`}
                    />
                    {/* Critical threshold line at 1.0 */}
                    <Line
                      type="monotone"
                      dataKey={() => 1.0}
                      stroke="#EF4444"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      animationDuration={0}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="healthFactor"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={false}
                      animationDuration={0}
                      isAnimationActive={false}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Market Conditions - Below Chart */}
        <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">
            Market Conditions
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all duration-300">
              <div className="text-sm text-gray-400 mb-1">ETH Price</div>
              <div className="text-3xl font-bold text-white">
                {formatCurrency(ethPrice)}
              </div>
              <div
                className={`text-sm mt-1 ${ethPrice < 2500 ? 'text-red-400' : 'text-green-400'
                  }`}
              >
                {ethPrice < 2500 ? (
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    {(((ethPrice - 3200) / 3200) * 100).toFixed(1)}%
                  </span>
                ) : (
                  'Stable'
                )}
              </div>
            </div>

            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all duration-300">
              <div className="text-sm text-gray-400 mb-1">Position Value</div>
              <div className="text-3xl font-bold text-white">
                {formatCurrency(collateralUSD)}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Debt: {formatCurrency(debtUSD)}
              </div>
            </div>

            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all duration-300">
              <div className="text-sm text-gray-400 mb-1">Aave Collateral</div>
              <div className="text-2xl font-bold text-blue-400">
                {aaveCollateralETH.toFixed(2)} ETH
              </div>
              <div className="text-sm text-gray-400 mt-1">
                ${(aaveCollateralETH * ethPrice).toFixed(0)}
              </div>
            </div>

            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all duration-300">
              <div className="text-sm text-gray-400 mb-1">Lido Collateral</div>
              <div className="text-2xl font-bold text-orange-500">
                {lidoCollateralETH.toFixed(2)} wstETH
              </div>
              <div className="text-sm text-gray-400 mt-1">
                ${(lidoCollateralETH * ethPrice).toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Agent Activity */}
          <div className="lg:col-span-2">
            {/* Agent Actions Timeline */}
            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
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
                      className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all duration-300 border-l-4"
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
            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
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
            <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                What&apos;s Happening?
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
                    It&apos;s alerting other agents to take action.
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
                    Mission accomplished! Liquidation prevented, $83K in value protected,
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
                  collateralUSD: 70000,  // 31.25 ETH × $2,240 at crash
                  debtUSD: 75000,
                  atRisk: true,
                },
                after: {
                  healthFactor: 1.65,
                  collateralUSD: 145656,  // 31.25 ETH × $4,661 recovered
                  debtUSD: 75000,
                  atRisk: false,
                },
              }}
            />

            {/* Success Metrics */}
            <div className="grid grid-cols-3 gap-6 mt-8">
              <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">1</div>
                <div className="text-sm text-gray-400">Liquidation Prevented</div>
              </div>
              <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">$83K</div>
                <div className="text-sm text-gray-400">Value Protected</div>
              </div>
              <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">47%</div>
                <div className="text-sm text-gray-400">HF Improvement</div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mt-8 text-center">
              <Link href="/presentation" className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 hover:scale-105 text-lg">
                See It Work With Real Data →
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
