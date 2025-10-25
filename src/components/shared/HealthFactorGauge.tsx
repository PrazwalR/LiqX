'use client';

import React from 'react';
import { getHealthFactorColor, formatHealthFactor } from '@/lib/utils';

interface HealthFactorGaugeProps {
  healthFactor: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function HealthFactorGauge({
  healthFactor,
  size = 'md',
  showLabel = true,
}: HealthFactorGaugeProps) {
  const sizes = {
    sm: { width: 80, stroke: 6, fontSize: 'text-sm' },
    md: { width: 120, stroke: 8, fontSize: 'text-lg' },
    lg: { width: 160, stroke: 10, fontSize: 'text-2xl' },
  };

  const config = sizes[size];
  const radius = (config.width - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate progress (0-100%)
  // HF < 1.2 = 0%, HF 1.2 = 25%, HF 1.5 = 50%, HF 2.0+ = 100%
  let progress = 0;
  if (healthFactor < 1.2) {
    progress = (healthFactor / 1.2) * 25;
  } else if (healthFactor < 1.5) {
    progress = 25 + ((healthFactor - 1.2) / 0.3) * 25;
  } else if (healthFactor < 2.0) {
    progress = 50 + ((healthFactor - 1.5) / 0.5) * 50;
  } else {
    progress = 100;
  }

  const offset = circumference - (progress / 100) * circumference;
  const color = getHealthFactorColor(healthFactor);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        {/* Background Circle */}
        <svg
          className="transform -rotate-90"
          width={config.width}
          height={config.width}
        >
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={config.stroke}
          />
          {/* Progress Circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-bold ${config.fontSize}`} style={{ color }}>
            {formatHealthFactor(healthFactor)}
          </div>
          {showLabel && (
            <div className="text-xs text-gray-400 mt-1">Health Factor</div>
          )}
        </div>
      </div>

      {/* Status Label */}
      {showLabel && (
        <div
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{
            backgroundColor: `${color}20`,
            color: color,
          }}
        >
          {healthFactor < 1.2
            ? 'CRITICAL'
            : healthFactor < 1.5
              ? 'WARNING'
              : 'SAFE'}
        </div>
      )}
    </div>
  );
}

// Compact linear version
export function HealthFactorBar({
  healthFactor,
  showValue = true,
}: {
  healthFactor: number;
  showValue?: boolean;
}) {
  const color = getHealthFactorColor(healthFactor);
  const progress = Math.min((healthFactor / 2.0) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">Health Factor</span>
        {showValue && (
          <span className="text-sm font-semibold" style={{ color }}>
            {formatHealthFactor(healthFactor)}
          </span>
        )}
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 ease-out rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
    </div>
  );
}
