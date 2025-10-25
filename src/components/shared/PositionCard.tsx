'use client';

import React from 'react';
import { Position } from '@/lib/types';
import { formatCurrency, formatHealthFactor, getHealthFactorColor } from '@/lib/utils';
import { HealthFactorBar } from './HealthFactorGauge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PositionCardProps {
  position: Position;
  onClick?: () => void;
}

export function PositionCard({ position, onClick }: PositionCardProps) {
  const healthFactorColor = getHealthFactorColor(position.healthFactor);
  const isAtRisk = position.healthFactor < 1.5;

  return (
    <div
      className={`
        glass-card p-4 cursor-pointer transition-all duration-300
        ${onClick ? 'glass-card-hover' : ''}
        ${isAtRisk ? 'border-red-500/30' : ''}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Position {position.id.slice(0, 8)}
          </h3>
          <p className="text-sm text-gray-400">
            {position.user.slice(0, 6)}...{position.user.slice(-4)}
          </p>
        </div>

        {isAtRisk && (
          <div className="flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/20 px-2 py-1 rounded-full">
            <TrendingDown className="w-3 h-3" />
            At Risk
          </div>
        )}
      </div>

      {/* Collateral & Debt */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Collateral</div>
          <div className="text-lg font-bold text-green-400">
            {formatCurrency(position.totalCollateralUSD)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Debt</div>
          <div className="text-lg font-bold text-red-400">
            {formatCurrency(position.totalDebtUSD)}
          </div>
        </div>
      </div>

      {/* Health Factor Bar */}
      <HealthFactorBar healthFactor={position.healthFactor} />

      {/* Token Breakdown */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-xs text-gray-400 mb-2">Assets</div>
        <div className="flex flex-wrap gap-2">
          {position.collateralTokens.map((token, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 text-xs bg-white/5 px-2 py-1 rounded"
            >
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-white font-medium">{token.symbol}</span>
              <span className="text-gray-400">
                {formatCurrency(token.amountUSD)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact version for lists
export function PositionCardCompact({ position }: { position: Position }) {
  const healthFactorColor = getHealthFactorColor(position.healthFactor);
  const isAtRisk = position.healthFactor < 1.5;

  return (
    <div className="flex items-center justify-between p-3 glass-card rounded-lg">
      <div className="flex items-center gap-3">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: healthFactorColor }}
        />
        <div>
          <div className="text-sm font-semibold text-white">
            {position.id.slice(0, 12)}...
          </div>
          <div className="text-xs text-gray-400">
            {formatCurrency(position.totalCollateralUSD)} collateral
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-sm font-semibold" style={{ color: healthFactorColor }}>
          HF {formatHealthFactor(position.healthFactor)}
        </div>
        {isAtRisk && (
          <div className="text-xs text-red-400">At Risk</div>
        )}
      </div>
    </div>
  );
}
