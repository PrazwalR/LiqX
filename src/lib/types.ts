// TypeScript Types and Interfaces for LiquidityGuard AI

// ============ Position Types ============

export interface Position {
  id: string;
  user: string;
  totalCollateralUSD: number;
  totalDebtUSD: number;
  healthFactor: number;
  collateralTokens: TokenBalance[];
  debtTokens: TokenBalance[];
  lastUpdate: number;
  protocol?: string;  // e.g., 'aave-v3', 'compound', 'lido'
  chain?: string;     // e.g., 'ethereum', 'avalanche', 'bnb-chain'
}

export interface TokenBalance {
  token: string;
  symbol: string;
  amount: number;
  amountUSD: number;
}

// ============ Market Data Types ============

export interface MarketPrice {
  token: string;
  symbol: string;
  currentPrice: number;
  change24h: number;
  change7d: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  timestamp: number;
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface MarketData {
  prices: PricePoint[];
  currentPrice: number;
  change24h: number;
  change7d: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
}

export interface VolatilityData {
  token: string;
  volatility24h: number;
  volatility7d: number;
  riskLevel: 'low' | 'medium' | 'high';
  trendDirection?: 'up' | 'down';
  timestamp: number;
}

export interface CorrelationData {
  token: string;
  correlation: number; // -1 to 1
  healthFactorImpact: number;
  timestamp: number;
}

// ============ Agent Types ============

export interface AgentStatus {
  agentId: string;
  name: string;
  status: 'online' | 'busy' | 'offline';
  lastSeen: number;
  endpoint: string;
}

export interface AgentActivity {
  id: string;
  agentName: string;
  timestamp: number;
  action: string;
  details: string;
  success: boolean;
  txHash?: string;
}

export interface Strategy {
  strategyId: string;
  user: string;
  strategyType: StrategyType;
  fromProtocol: string;
  toProtocol: string;
  fromToken: string;
  toToken: string;
  amount: number;
  minAmountOut: number;
  deadline: number;
  extraData?: string;
  executed: boolean;
  executionTime?: number;
  txHash?: string;
}

export enum StrategyType {
  DEPOSIT_COLLATERAL = 'DEPOSIT_COLLATERAL',
  WITHDRAW_COLLATERAL = 'WITHDRAW_COLLATERAL',
  BORROW = 'BORROW',
  REPAY = 'REPAY',
  REBALANCE = 'REBALANCE',
  SWAP = 'SWAP',
  STAKE = 'STAKE',
  UNSTAKE = 'UNSTAKE',
}

// ============ Performance Metrics ============

export interface PerformanceMetrics {
  responseTime: number;           // seconds
  successRate: number;            // percentage
  totalStrategiesExecuted: number;
  valueProtected: number;         // USD
  preventedLiquidations: number;
  averageHealthFactorImprovement: number;
  gasUsed: number;                // ETH
  uptime: number;                 // percentage
}

// ============ Demo Mode Types ============

export interface DemoState {
  phase: DemoPhase;
  elapsedTime: number;
  currentHealthFactor: number;
  ethPrice: number;
  collateralUSD: number;
  debtUSD: number;
  agentActions: DemoAgentAction[];
}

export enum DemoPhase {
  NORMAL = 'normal',
  CRASH = 'crash',
  DETECTION = 'detection',
  PLANNING = 'planning',
  EXECUTION = 'execution',
  RECOVERY = 'recovery',
  COMPLETE = 'complete',
}

export interface DemoAgentAction {
  agent: string;
  timestamp: number;
  action: string;
  status: 'pending' | 'in-progress' | 'complete';
}

// ============ Presentation Mode Types ============

export interface CrashTrigger {
  type: 'marketCrash' | 'flashCrash' | 'gradualDecline' | 'randomVolatility' | 'custom';
  ethDrop: number;        // percentage (0-1)
  duration: number;       // seconds
  volatility?: number;    // optional volatility factor
}

export interface TriggerResult {
  success: boolean;
  triggerId: string;
  message: string;
  timestamp: number;
}

// ============ Chart Types ============

export interface ChartData {
  timestamp: number;
  eth: number;
  wbtc?: number;
  usdc?: number;
  healthFactor?: number;
}

export interface ChartConfig {
  height: number;
  showLegend: boolean;
  showTooltip: boolean;
  showGrid: boolean;
  timeRange: 1 | 7 | 30 | 90 | 365;
}

// ============ UI Component Props ============

export interface BeforeAfterData {
  before: {
    healthFactor: number;
    collateralUSD: number;
    debtUSD: number;
    atRisk: boolean;
  };
  after: {
    healthFactor: number;
    collateralUSD: number;
    debtUSD: number;
    atRisk: boolean;
  };
}

export interface TechnicalDetails {
  txHash?: string;
  blockNumber?: number;
  gasUsed?: number;
  swapDetails?: {
    fromToken: string;
    toToken: string;
    amountIn: number;
    amountOut: number;
    slippage: number;
  };
  protocolReasoning?: string;
}

// ============ API Response Types ============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PriceApiResponse {
  prices: PricePoint[];
  currentPrice: number;
  change24h: number;
  change7d: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
}

export interface PositionsApiResponse {
  positions: Position[];
  totalCount: number;
  atRiskCount: number;
}

export interface AgentStatusApiResponse {
  agents: AgentStatus[];
  allOnline: boolean;
}

// ============ 1inch Fusion+ API Types ============

export interface OneInchQuoteResponse {
  success: boolean;
  quote?: OneInchQuote;
  error?: string;
  timestamp: number;
}

export interface OneInchQuote {
  srcToken: string;
  dstToken: string;
  srcAmount: string;
  dstAmount: string;
  protocols: string[];
  gas: number;
  gasPrice: string;
  estimatedGas: number;
  route: RouteStep[];
  priceImpact: number;
  slippage: number;
  executionTime?: number;
}

export interface RouteStep {
  name: string;
  part: number;
  fromTokenAddress: string;
  toTokenAddress: string;
}

export interface SwapRouteDetails {
  agentId: string;
  timestamp: number;
  positionId: string;
  user: string;
  strategy: {
    fromProtocol: string;
    toProtocol: string;
    fromToken: string;
    toToken: string;
    amount: number;
    reason: string;
  };
  oneInchResponse?: OneInchQuote;
  status: 'pending' | 'success' | 'failed';
  executionPlan: ExecutionStep[];
}

export interface ExecutionStep {
  step: number;
  action: string;
  status: 'pending' | 'in-progress' | 'complete' | 'skipped';
  details: string;
  timestamp?: number;
  txHash?: string;
}

// ============ The Graph Types ============

export interface SubgraphReserve {
  symbol: string;
  decimals: string;
  priceInMarketReferenceCurrency: string;
}

export interface SubgraphUser {
  id: string;
}

export interface SubgraphUserReserve {
  id: string;
  user: SubgraphUser;
  currentATokenBalance: string;
  currentTotalDebt: string;
  reserve: SubgraphReserve;
}

export interface SubgraphPosition {
  id: string;
  user: string;
  totalCollateralETH: string;
  totalDebtETH: string;
  availableBorrowsETH: string;
  currentLiquidationThreshold: string;
  ltv: string;
  healthFactor: string;
}

export interface SubgraphQuery {
  positions?: SubgraphPosition[];
  userReserves?: SubgraphUserReserve[];
}

// ============ Utility Types ============

export type Mode = 'demo' | 'presentation' | 'production';

export type HealthFactorStatus = 'safe' | 'warning' | 'critical';

export interface TimeRange {
  label: string;
  days: number;
}

export interface Token {
  symbol: string;
  name: string;
  address: string;
  coingeckoId: string;
  decimals: number;
  color: string;
}
