"""Simplified message protocols - uagents compatible"""
from uagents import Model
from typing import List, Optional


class PositionAlert(Model):
    user_address: str
    position_id: str  # Changed to str to support subgraph hash IDs
    protocol: str
    chain: str
    health_factor: float
    collateral_value: float
    debt_value: float
    collateral_token: str
    debt_token: str
    risk_level: str
    timestamp: int


class RebalanceStep(Model):
    step: int
    action: str  # withdraw, swap, bridge, supply
    token: Optional[str] = None
    amount: Optional[str] = None
    from_token: Optional[str] = None
    to_token: Optional[str] = None
    from_chain: Optional[str] = None
    to_chain: Optional[str] = None
    # Protocol or bridge name (1inch, layerzero, jupiter, etc.)
    via: Optional[str] = None
    protocol: Optional[str] = None  # For supply/withdraw actions
    apy: Optional[float] = None


class RebalanceStrategy(Model):
    strategy_id: str
    user_address: str
    position_id: int
    source_chain: str
    target_chain: str
    source_protocol: str
    target_protocol: str
    amount_to_move: float
    expected_apy_improvement: float
    execution_method: str  # direct_swap, layerzero_pyusd, etc.
    estimated_gas_cost: float
    estimated_time: int  # seconds
    priority: str  # emergency, high, normal
    reason: str
    steps: Optional[List[dict]] = None  # Serialized RebalanceStep objects


class SwapRoute(Model):
    route_id: str
    from_token: str
    to_token: str
    amount: float
    transaction_data: str  # JSON string with route details, Fusion+ data, etc.


class ExecutionResult(Model):
    execution_id: str
    status: str


class DemoMarketCrash(Model):
    crash_id: str
    target_price_drop_percent: float
    duration_seconds: int


class DemoPriceUpdate(Model):
    crash_id: str
    token: str
    new_price: float


class HealthCheckRequest(Model):
    agent_name: str
    timestamp: int


class HealthCheckResponse(Model):
    agent_name: str
    status: str
    uptime: float
    messages_processed: int
    timestamp: int


class PresentationTrigger(Model):
    """Manual trigger for live presentations - only works in PRESENTATION_MODE"""
    trigger_id: str
    trigger_type: str  # "market_crash", "price_drop", "alert_position", "force_rebalance"
    secret: str  # Must match PRESENTATION_TRIGGER_SECRET in .env

    # Optional parameters
    # Specific position to trigger alert
    target_position_id: Optional[str] = None
    eth_price_drop_percent: Optional[float] = None  # For market_crash
    custom_price: Optional[float] = None  # For price_drop
    target_token: Optional[str] = None  # For price_drop
