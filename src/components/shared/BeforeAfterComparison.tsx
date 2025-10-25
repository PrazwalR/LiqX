'use client';

import React from 'react';
import { BeforeAfterData } from '@/lib/types';
import { formatCurrency, formatHealthFactor, getHealthFactorColor } from '@/lib/utils';
import { ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';

interface BeforeAfterComparisonProps {
  data: BeforeAfterData;
}

export function BeforeAfterComparison({ data }: BeforeAfterComparisonProps) {
  const beforeColor = getHealthFactorColor(data.before.healthFactor);
  const afterColor = getHealthFactorColor(data.after.healthFactor);

  const improvement = data.after.healthFactor - data.before.healthFactor;
  const improvementPercent = (improvement / data.before.healthFactor) * 100;

  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-green-400" />
        Strategy Impact
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Before State */}
        <div className="glass-card p-4 border-2" style={{ borderColor: beforeColor + '40' }}>
          <div className="text-xs text-gray-400 mb-3 uppercase tracking-wider">
            Before
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-400">Health Factor</div>
              <div className="text-2xl font-bold" style={{ color: beforeColor }}>
                {formatHealthFactor(data.before.healthFactor)}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400">Collateral</div>
              <div className="text-lg font-semibold text-white">
                {formatCurrency(data.before.collateralUSD)}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400">Debt</div>
              <div className="text-lg font-semibold text-white">
                {formatCurrency(data.before.debtUSD)}
              </div>
            </div>
          </div>

          {data.before.atRisk && (
            <div className="mt-3 flex items-center gap-1 text-xs text-red-400">
              <AlertTriangle className="w-3 h-3" />
              At Risk of Liquidation
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="glass-card p-4 rounded-full">
            <ArrowRight className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        {/* After State */}
        <div className="glass-card p-4 border-2" style={{ borderColor: afterColor + '40' }}>
          <div className="text-xs text-gray-400 mb-3 uppercase tracking-wider">
            After
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-400">Health Factor</div>
              <div className="text-2xl font-bold" style={{ color: afterColor }}>
                {formatHealthFactor(data.after.healthFactor)}
              </div>
              {improvement > 0 && (
                <div className="text-xs text-green-400 mt-1">
                  +{improvementPercent.toFixed(1)}% improvement
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-gray-400">Collateral</div>
              <div className="text-lg font-semibold text-white">
                {formatCurrency(data.after.collateralUSD)}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400">Debt</div>
              <div className="text-lg font-semibold text-white">
                {formatCurrency(data.after.debtUSD)}
              </div>
            </div>
          </div>

          {!data.after.atRisk && data.before.atRisk && (
            <div className="mt-3 flex items-center gap-1 text-xs text-green-400">
              <CheckCircle className="w-3 h-3" />
              Position Secured
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">
              +{improvementPercent.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400 mt-1">HF Improvement</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {formatCurrency(Math.abs(data.after.collateralUSD - data.before.collateralUSD))}
            </div>
            <div className="text-xs text-gray-400 mt-1">Collateral Change</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {formatCurrency(Math.abs(data.after.debtUSD - data.before.debtUSD))}
            </div>
            <div className="text-xs text-gray-400 mt-1">Debt Change</div>
          </div>
        </div>
      </div>
    </div>
  );
}
