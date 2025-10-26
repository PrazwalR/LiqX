"""Clean message protocols - uagents compatible"""
from uagents import Model
from typing import List, Optional, Dict


class PositionAlert(Model):
    """Position Monitor → Yield Optimizer"""
    user_address: str
    position_id: str
    protocol: str
    chain: str
    health_factor: float
    collateral_value: float
    debt_value: float
    collateral_token: str
    debt_token: str
    risk_level: str
    timestamp: int
    predicted_liquidation_time: Optional[int] = None


class OptimizationStrategy(Model):
    """Yield Optimizer → Swap Optimizer"""
    position_id: str
    user_address: str
    current_protocol: str
    current_chain: str
    target_protocol: str
    target_chain: str
    collateral_token: str
    debt_token: str
    collateral_amount: float
    debt_amount: float
    current_apy: float
    target_apy: float
    estimated_gas_cost: float
    timestamp: int


class ExecutionPlan(Model):
    """Swap Optimizer → Cross-Chain Executor"""
    position_id: str
    user_address: str
    source_protocol: str
    source_chain: str
    target_protocol: str
    target_chain: str
    steps: List[Dict]  # List of execution steps
    total_gas_cost: float
    estimated_completion_time: int  # seconds
    timestamp: int


class ExecutionResult(Model):
    """Cross-Chain Executor → Position Monitor"""
    position_id: str
    success: bool
    tx_hashes: List[str]
    message: str
    actual_gas_cost: float
    timestamp: int


class HealthCheckRequest(Model):
    """Health check request"""
    timestamp: int


class HealthCheckResponse(Model):
    """Health check response"""
    agent_name: str
    status: str
    timestamp: int
    positions_monitored: Optional[int] = None


class PresentationTrigger(Model):
    """Manual trigger for presentations/demos"""
    event_type: str  # market_crash, flash_crash, gradual_decline, etc.
    eth_drop: float  # 0.0 to 1.0 (percentage as decimal)
    duration: int  # seconds
    volatility: float = 0.0
    position_id: Optional[str] = None
    trigger_id: Optional[str] = None
