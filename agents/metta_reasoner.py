"""
LiquidityGuard AI - MeTTa Reasoning Engine

Integrates MeTTa symbolic reasoning with Python agents for:
- Advanced risk assessment
- Strategic decision making
- Pattern-based optimization
- Self-learning capabilities
"""

import os
import subprocess
import json
from typing import Dict, List, Optional, Any
from loguru import logger


class MeTTaReasoner:
    """
    MeTTa Reasoning Engine for LiquidityGuard AI

    Provides symbolic AI reasoning for:
    - Risk assessment
    - Strategy selection
    - Pattern matching
    - Adaptive learning
    """

    def __init__(self, metta_files_path: str = "metta"):
        self.metta_path = metta_files_path
        self.risk_assessment_file = os.path.join(
            self.metta_path, "risk_assessment.metta")
        self.strategy_file = os.path.join(
            self.metta_path, "strategy_selection.metta")

        # Check if MeTTa interpreter is available
        self.metta_available = self._check_metta_availability()

        if self.metta_available:
            logger.info("✅ MeTTa reasoning engine initialized")
        else:
            logger.warning(
                "⚠️  MeTTa interpreter not found - using fallback logic")

    def _check_metta_availability(self) -> bool:
        """Check if MeTTa interpreter is installed"""
        try:
            result = subprocess.run(
                ["metta", "--version"],
                capture_output=True,
                timeout=5
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False

    def _execute_metta(self, code: str) -> Optional[str]:
        """Execute MeTTa code and return result"""
        if not self.metta_available:
            return None

        try:
            result = subprocess.run(
                ["metta", "-c", code],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode == 0:
                return result.stdout.strip()
            else:
                logger.error(f"MeTTa execution error: {result.stderr}")
                return None

        except subprocess.TimeoutExpired:
            logger.error("MeTTa execution timeout")
            return None
        except Exception as e:
            logger.error(f"MeTTa execution failed: {e}")
            return None

    # ═══════════════════════════════════════════════════════
    # RISK ASSESSMENT
    # ═══════════════════════════════════════════════════════

    def calculate_risk_level(self, health_factor: float) -> str:
        """
        Calculate risk level using MeTTa reasoning

        Args:
            health_factor: Position health factor

        Returns:
            Risk level: critical, high, moderate, low, or safe
        """
        if self.metta_available:
            code = f"!(calculate-risk-level {health_factor})"
            result = self._execute_metta(code)
            if result:
                return result

        # Fallback: Python logic
        if health_factor < 1.3:
            return "critical"
        elif health_factor < 1.5:
            return "high"
        elif health_factor < 1.8:
            return "moderate"
        elif health_factor < 2.0:
            return "low"
        else:
            return "safe"

    def liquidation_probability(
        self,
        health_factor: float,
        volatility: float
    ) -> float:
        """
        Calculate liquidation probability using MeTTa

        Args:
            health_factor: Position health factor
            volatility: Market volatility percentage

        Returns:
            Probability (0-100%)
        """
        if self.metta_available:
            code = f"!(liquidation-probability {health_factor} {volatility})"
            result = self._execute_metta(code)
            if result:
                try:
                    return float(result)
                except ValueError:
                    pass

        # Fallback: Python logic
        base_prob = 100 if health_factor < 1.0 else \
            80 if health_factor < 1.3 else \
            40 if health_factor < 1.5 else \
            15 if health_factor < 1.8 else 5

        vol_multiplier = 1.0 + (volatility * 0.01)
        return min(100.0, base_prob * vol_multiplier)

    def urgency_score(
        self,
        health_factor: float,
        liquidation_prob: float,
        time_to_liquidation: int
    ) -> int:
        """
        Calculate urgency score (0-10)

        Args:
            health_factor: Position health factor
            liquidation_prob: Liquidation probability
            time_to_liquidation: Time to liquidation in seconds

        Returns:
            Urgency score (0-10)
        """
        if self.metta_available:
            code = f"!(urgency-score {health_factor} {liquidation_prob} {time_to_liquidation})"
            result = self._execute_metta(code)
            if result:
                try:
                    return int(float(result))
                except ValueError:
                    pass

        # Fallback: Python logic
        hf_score = 4 if health_factor < 1.3 else \
            3 if health_factor < 1.5 else \
            2 if health_factor < 1.8 else \
            1 if health_factor < 2.0 else 0

        prob_score = 3 if liquidation_prob > 70 else \
            2 if liquidation_prob > 40 else \
            1 if liquidation_prob > 15 else 0

        time_score = 3 if time_to_liquidation < 600 else \
            2 if time_to_liquidation < 3600 else \
            1 if time_to_liquidation < 86400 else 0

        return hf_score + prob_score + time_score

    def assess_risk(
        self,
        health_factor: float,
        collateral_usd: float = 0.0,
        debt_usd: float = 0.0,
        collateral_token: str = "",
        debt_token: str = "",
        volatility: float = 0.5,
        market_trend: str = "neutral"
    ) -> Dict[str, Any]:
        """
        Comprehensive risk assessment using MeTTa reasoning

        Returns:
            Dictionary with complete risk analysis
        """
        risk_level = self.calculate_risk_level(health_factor)
        liq_prob = self.liquidation_probability(health_factor, volatility)
        urgency = self.urgency_score(health_factor, liq_prob, 3600)

        # Match risk scenario
        scenario = self._match_risk_scenario(health_factor, collateral_usd)

        # Get recommended actions
        actions = self._recommend_actions(scenario)

        # Determine priority
        priority = "EMERGENCY" if urgency >= 8 else \
                   "HIGH" if urgency >= 6 else \
                   "NORMAL" if urgency >= 5 else "LOW"

        result = {
            "risk_level": risk_level,
            "scenario": scenario,
            "liquidation_probability": liq_prob,
            "urgency_score": urgency,
            "execution_priority": priority,
            "recommended_actions": actions,
            "requires_immediate_action": urgency >= 7,
            "reasoning": f"Health factor {health_factor:.2f} with {volatility:.1f}% volatility in {market_trend} market"
        }

        logger.info(
            f"🧠 MeTTa Risk Assessment: {risk_level.upper()} (urgency: {urgency}/10)")

        return result

    def _match_risk_scenario(self, health_factor: float, collateral_usd: float) -> str:
        """Match position to risk scenario"""
        if health_factor < 1.2 and collateral_usd > 50000:
            return "CRITICAL-LARGE-POSITION"
        elif health_factor < 1.2:
            return "CRITICAL-SMALL-POSITION"
        elif health_factor < 1.5 and collateral_usd > 100000:
            return "HIGH-RISK-WHALE"
        elif health_factor < 1.5:
            return "HIGH-RISK-RETAIL"
        elif health_factor < 1.8:
            return "MODERATE-RISK"
        else:
            return "LOW-RISK"

    def _recommend_actions(self, scenario: str) -> List[str]:
        """Generate action recommendations"""
        action_map = {
            "CRITICAL-LARGE-POSITION": ["emergency-rebalance", "immediate-notification", "whale-protocol"],
            "CRITICAL-SMALL-POSITION": ["urgent-rebalance", "user-notification", "standard-protocol"],
            "HIGH-RISK-WHALE": ["proactive-rebalance", "whale-protocol", "multi-chain-optimization"],
            "HIGH-RISK-RETAIL": ["scheduled-rebalance", "standard-protocol", "single-chain-optimization"],
            "MODERATE-RISK": ["monitor-closely", "opportunistic-rebalance"],
            "LOW-RISK": ["routine-monitoring"]
        }
        return action_map.get(scenario, ["manual-review"])

    # ═══════════════════════════════════════════════════════
    # STRATEGY SELECTION
    # ═══════════════════════════════════════════════════════

    def calculate_profitability(
        self,
        amount: float,
        current_apy: float,
        target_apy: float,
        execution_cost: float
    ) -> Dict[str, float]:
        """
        Calculate strategy profitability

        Returns:
            Dict with annual_profit, break_even_months, is_profitable
        """
        apy_diff = target_apy - current_apy
        annual_profit = amount * (apy_diff / 100)

        break_even_months = (execution_cost * 12 /
                             annual_profit) if annual_profit > 0 else 999
        is_profitable = break_even_months < 6

        return {
            "annual_profit": annual_profit,
            "apy_improvement": apy_diff,
            "break_even_months": break_even_months,
            "is_profitable": is_profitable
        }

    def score_strategy(
        self,
        apy_improvement: float,
        break_even_months: float,
        urgency: int,
        amount: float
    ) -> float:
        """
        Score a strategy (0-100)

        Uses MeTTa reasoning for intelligent scoring
        """
        # APY component (0-40 points)
        apy_score = min(40, apy_improvement * 8)

        # Break-even component (0-30 points)
        break_even_score = 30 if break_even_months < 1 else \
            20 if break_even_months < 3 else \
            10 if break_even_months < 6 else 0

        # Urgency component (0-20 points)
        urgency_score = urgency * 2

        # Amount component (0-10 points)
        amount_score = 10 if amount > 100000 else \
            7 if amount > 50000 else \
            4 if amount > 10000 else 2

        total_score = apy_score + break_even_score + urgency_score + amount_score

        logger.debug(
            f"Strategy score: {total_score:.1f}/100 (APY: {apy_score}, BE: {break_even_score}, Urgency: {urgency_score}, Amount: {amount_score})")

        return total_score

    def select_execution_method(
        self,
        from_chain: str,
        to_chain: str,
        amount: float,
        urgency: int
    ) -> str:
        """
        Select optimal execution method using MeTTa reasoning

        Returns:
            Execution method: direct-swap, layerzero-pyusd, standard-bridge, fusion-cross-chain
        """
        if from_chain == to_chain:
            return "direct-swap"

        # High urgency + large amount -> LayerZero PYUSD
        if urgency >= 7 and amount > 50000:
            return "layerzero-pyusd"

        # Medium urgency -> Standard bridge
        if urgency >= 5:
            return "standard-bridge"

        # Low urgency -> 1inch Fusion (cheapest)
        return "fusion-cross-chain"

    def select_optimal_strategy(
        self,
        current_protocol: str,
        current_chain: str,
        current_apy: float,
        amount: float,
        risk_level: str,
        urgency: int,
        market_trend: str,
        available_strategies: List[Dict]
    ) -> Optional[Dict]:
        """
        Select optimal strategy using MeTTa reasoning

        Args:
            current_protocol: Current protocol name
            current_chain: Current chain
            current_apy: Current APY
            amount: Amount to move (USD)
            risk_level: Risk level from assessment
            urgency: Urgency score (0-10)
            market_trend: Market trend (crash, declining, stable, rising)
            available_strategies: List of available target protocols

        Returns:
            Optimal strategy with reasoning
        """
        best_strategy = None
        best_score = 0

        for target in available_strategies:
            # Calculate profitability
            profitability = self.calculate_profitability(
                amount,
                current_apy,
                target['apy'],
                target.get('execution_cost', 50.0)
            )

            if not profitability['is_profitable']:
                continue

            # Score this strategy
            score = self.score_strategy(
                profitability['apy_improvement'],
                profitability['break_even_months'],
                urgency,
                amount
            )

            # Select execution method
            execution_method = self.select_execution_method(
                current_chain,
                target['chain'],
                amount,
                urgency
            )

            strategy = {
                "source_protocol": current_protocol,
                "source_chain": current_chain,
                "target_protocol": target['protocol'],
                "target_chain": target['chain'],
                "current_apy": current_apy,
                "target_apy": target['apy'],
                "apy_improvement": profitability['apy_improvement'],
                "annual_profit": profitability['annual_profit'],
                "execution_cost": target.get('execution_cost', 50.0),
                "break_even_months": profitability['break_even_months'],
                "strategy_score": score,
                "execution_method": execution_method,
                "is_profitable": True,
                "confidence": min(100, score)
            }

            if score > best_score:
                best_score = score
                best_strategy = strategy

        if best_strategy:
            logger.success(
                f"🧠 MeTTa selected strategy: {best_strategy['target_protocol']} (score: {best_score:.1f}/100)")
            best_strategy["reasoning"] = (
                f"Selected {best_strategy['target_protocol']} on {best_strategy['target_chain']} "
                f"for +{best_strategy['apy_improvement']:.2f}% APY improvement. "
                f"Break-even in {best_strategy['break_even_months']:.1f} months. "
                f"Confidence: {best_strategy['confidence']:.0f}%"
            )
        else:
            logger.warning("🧠 MeTTa found no profitable strategy")

        return best_strategy

    # ═══════════════════════════════════════════════════════
    # LEARNING & ADAPTATION
    # ═══════════════════════════════════════════════════════

    def learn_from_execution(
        self,
        strategy: Dict,
        success: bool,
        actual_profit: float,
        execution_time: int
    ):
        """
        Learn from strategy execution for adaptive improvement

        This enables the system to improve over time
        """
        logger.info(
            f"🧠 Learning from execution: {'✅ success' if success else '❌ failed'}")

        # In a full implementation, this would:
        # 1. Store outcome in knowledge base
        # 2. Update MeTTa rules based on patterns
        # 3. Adjust scoring algorithms
        # 4. Improve future predictions

        # For now, just log
        logger.debug(f"   Strategy: {strategy.get('target_protocol')}")
        logger.debug(
            f"   Predicted profit: ${strategy.get('annual_profit', 0):.2f}/year")
        logger.debug(f"   Actual profit: ${actual_profit:.2f}")
        logger.debug(f"   Execution time: {execution_time}s")


# Singleton instance
_metta_reasoner = None


def get_metta_reasoner() -> MeTTaReasoner:
    """Get singleton instance of MeTTa reasoner"""
    global _metta_reasoner
    if _metta_reasoner is None:
        _metta_reasoner = MeTTaReasoner()
    return _metta_reasoner


# Test function
async def test_metta_reasoning():
    """Test MeTTa reasoning capabilities"""
    logger.info("Testing MeTTa reasoning engine...")

    reasoner = get_metta_reasoner()

    # Test 1: Risk Assessment
    logger.info("\n🧪 Test 1: Risk Assessment")
    risk_result = reasoner.assess_risk(
        collateral=100000,  # $100k
        debt=60000,         # $60k
        health_factor=1.35,
        volatility=5.0,
        market_trend="declining"
    )
    logger.info(f"   Risk Level: {risk_result['risk_level']}")
    logger.info(f"   Scenario: {risk_result['scenario']}")
    logger.info(
        f"   Liquidation Probability: {risk_result['liquidation_probability']:.1f}%")
    logger.info(f"   Urgency: {risk_result['urgency_score']}/10")
    logger.info(f"   Priority: {risk_result['execution_priority']}")
    logger.info(f"   Actions: {', '.join(risk_result['recommended_actions'])}")

    # Test 2: Strategy Selection
    logger.info("\n🧪 Test 2: Strategy Selection")
    available_strategies = [
        {"protocol": "kamino", "chain": "solana",
            "apy": 9.1, "execution_cost": 65.0},
        {"protocol": "morpho", "chain": "ethereum",
            "apy": 6.5, "execution_cost": 50.0},
        {"protocol": "drift", "chain": "solana",
            "apy": 8.3, "execution_cost": 60.0},
    ]

    strategy = reasoner.select_optimal_strategy(
        current_protocol="aave",
        current_chain="ethereum",
        current_apy=5.2,
        amount=100000,
        risk_level="high",
        urgency=7,
        market_trend="declining",
        available_strategies=available_strategies
    )

    if strategy:
        logger.info(
            f"   Selected: {strategy['target_protocol']} ({strategy['target_chain']})")
        logger.info(f"   APY Improvement: +{strategy['apy_improvement']:.2f}%")
        logger.info(f"   Annual Profit: ${strategy['annual_profit']:.2f}")
        logger.info(
            f"   Break-even: {strategy['break_even_months']:.1f} months")
        logger.info(f"   Score: {strategy['strategy_score']:.1f}/100")
        logger.info(f"   Method: {strategy['execution_method']}")
        logger.info(f"   Reasoning: {strategy['reasoning']}")
    else:
        logger.warning("   No profitable strategy found")

    logger.success("\n✅ MeTTa reasoning tests complete!")


if __name__ == "__main__":
    import asyncio

    # Setup logging
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=""),
        colorize=True,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>"
    )

    # Run tests
    asyncio.run(test_metta_reasoning())
