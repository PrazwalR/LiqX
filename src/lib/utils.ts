// Utility Functions for LiquidityGuard AI

import { HEALTH_FACTOR_THRESHOLDS, FORMAT_CONFIG } from './constants';
import { HealthFactorStatus, PricePoint } from './types';

// ============ Number Formatting ============

/**
 * Format number as USD currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', FORMAT_CONFIG.currency).format(value);
}

/**
 * Format number as percentage
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', FORMAT_CONFIG.percentage).format(value / 100);
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return formatCurrency(value);
}

/**
 * Format health factor with appropriate precision
 */
export function formatHealthFactor(hf: number): string {
  if (hf === Infinity || hf > 1000) {
    return '∞';
  }
  return hf.toFixed(2);
}

// ============ Health Factor Utilities ============

/**
 * Get health factor status (safe, warning, critical)
 */
export function getHealthFactorStatus(hf: number): HealthFactorStatus {
  if (hf < HEALTH_FACTOR_THRESHOLDS.CRITICAL) {
    return 'critical';
  }
  if (hf < HEALTH_FACTOR_THRESHOLDS.WARNING) {
    return 'warning';
  }
  return 'safe';
}

/**
 * Get color for health factor status
 */
export function getHealthFactorColor(hf: number): string {
  const status = getHealthFactorStatus(hf);
  switch (status) {
    case 'safe':
      return '#10B981'; // Green
    case 'warning':
      return '#F59E0B'; // Yellow
    case 'critical':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
}

/**
 * Calculate health factor from collateral and debt
 */
export function calculateHealthFactor(
  collateralUSD: number,
  debtUSD: number,
  liquidationThreshold: number = 0.85
): number {
  if (debtUSD === 0) {
    return Infinity;
  }
  return (collateralUSD * liquidationThreshold) / debtUSD;
}

// ============ Time Utilities ============

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format duration in seconds to readable string
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

// ============ Chart Data Utilities ============

/**
 * Downsample array to target length (for performance)
 */
export function downsample<T>(data: T[], targetLength: number): T[] {
  if (data.length <= targetLength) {
    return data;
  }

  const step = data.length / targetLength;
  const result: T[] = [];

  for (let i = 0; i < targetLength; i++) {
    const index = Math.floor(i * step);
    result.push(data[index]);
  }

  return result;
}

/**
 * Calculate moving average for smoothing
 */
export function movingAverage(data: number[], window: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const values = data.slice(start, i + 1);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    result.push(avg);
  }

  return result;
}

/**
 * Calculate volatility (standard deviation)
 */
export function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) {
    return 0;
  }

  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const squaredDiffs = prices.map(p => Math.pow(p - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / prices.length;

  return Math.sqrt(variance);
}

/**
 * Calculate percentage change
 */
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) {
    return 0;
  }
  return ((current - previous) / previous) * 100;
}

// ============ Mock Data Generation ============

/**
 * Generate mock price data with volatility
 */
export function generateMockPrices(
  basePrice: number,
  points: number,
  volatility: number = 0.02,
  trend: number = 0
): PricePoint[] {
  const result: PricePoint[] = [];
  const now = Date.now();
  const interval = 3600000; // 1 hour

  let currentPrice = basePrice;

  for (let i = 0; i < points; i++) {
    // Add random volatility
    const randomChange = (Math.random() - 0.5) * 2 * volatility;

    // Apply trend
    const trendChange = trend / points;

    currentPrice = currentPrice * (1 + randomChange + trendChange);

    result.push({
      timestamp: now - (points - i) * interval,
      price: currentPrice,
    });
  }

  return result;
}

/**
 * Generate mock position data
 */
export function generateMockPosition(atRisk: boolean = false) {
  const collateral = 10000 + Math.random() * 40000; // $10K - $50K
  const debtRatio = atRisk ? 0.8 : 0.4 + Math.random() * 0.3; // 40-70% or 80%
  const debt = collateral * debtRatio;
  const healthFactor = calculateHealthFactor(collateral, debt);

  return {
    id: `0x${Math.random().toString(16).slice(2, 10)}`,
    user: `0x${Math.random().toString(16).slice(2, 42)}`,
    totalCollateralUSD: collateral,
    totalDebtUSD: debt,
    healthFactor,
    collateralTokens: [
      {
        token: 'WETH',
        symbol: 'WETH',
        amount: collateral * 0.6 / 2500, // Assume ETH = $2500
        amountUSD: collateral * 0.6,
      },
      {
        token: 'WBTC',
        symbol: 'WBTC',
        amount: collateral * 0.4 / 50000, // Assume BTC = $50000
        amountUSD: collateral * 0.4,
      },
    ],
    debtTokens: [
      {
        token: 'USDC',
        symbol: 'USDC',
        amount: debt,
        amountUSD: debt,
      },
    ],
    lastUpdate: Date.now(),
  };
}

// ============ Address Utilities ============

/**
 * Shorten Ethereum address
 */
export function shortenAddress(address: string): string {
  if (address.length < 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// ============ CSS Utilities ============

/**
 * Combine CSS class names
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============ Async Utilities ============

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// ============ Data Validation ============

/**
 * Check if data is stale (older than threshold)
 */
export function isStale(timestamp: number, thresholdMs: number): boolean {
  return Date.now() - timestamp > thresholdMs;
}

/**
 * Safe parse JSON
 */
export function safeParseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
