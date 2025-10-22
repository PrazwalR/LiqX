"""
LiquidityGuard AI - Individual Agent Deployment for Almanac

Run agents separately (not in Bureau) for Almanac registration.
Each agent needs to be funded with FET tokens first.

Usage:
    # Terminal 1
    python deploy_individual_agents.py --agent position_monitor
    
    # Terminal 2  
    python deploy_individual_agents.py --agent yield_optimizer
    
    # Terminal 3
    python deploy_individual_agents.py --agent swap_optimizer
    
    # Terminal 4
    python deploy_individual_agents.py --agent cross_chain_executor
"""

import argparse
import sys
from loguru import logger

# Import agent classes
from agents.position_monitor import PositionMonitorAgent
from agents.yield_optimizer import YieldOptimizerAgent
from agents.swap_optimizer import SwapOptimizerAgent
from agents.cross_chain_executor import CrossChainExecutor


def deploy_position_monitor():
    """Deploy Position Monitor agent to Almanac"""
    logger.info("🚀 Deploying Position Monitor to Almanac...")
    agent_instance = PositionMonitorAgent()

    logger.info(f"Agent address: {agent_instance.agent.address}")
    logger.info(f"Agent name: {agent_instance.agent.name}")
    logger.info("⚠️  Make sure this address is funded with FET tokens!")
    logger.info("💡 Get testnet FET from: https://faucet.fetch.ai")

    # Run agent (will register on Almanac)
    agent_instance.agent.run()


def deploy_yield_optimizer():
    """Deploy Yield Optimizer agent to Almanac"""
    logger.info("🚀 Deploying Yield Optimizer to Almanac...")
    agent_instance = YieldOptimizerAgent()

    logger.info(f"Agent address: {agent_instance.agent.address}")
    logger.info(f"Agent name: {agent_instance.agent.name}")
    logger.info("⚠️  Make sure this address is funded with FET tokens!")
    logger.info("💡 Get testnet FET from: https://faucet.fetch.ai")

    # Run agent (will register on Almanac)
    agent_instance.agent.run()


def deploy_swap_optimizer():
    """Deploy Swap Optimizer agent to Almanac"""
    logger.info("🚀 Deploying Swap Optimizer to Almanac...")
    agent_instance = SwapOptimizerAgent()

    logger.info(f"Agent address: {agent_instance.agent.address}")
    logger.info(f"Agent name: {agent_instance.agent.name}")
    logger.info("⚠️  Make sure this address is funded with FET tokens!")
    logger.info("💡 Get testnet FET from: https://faucet.fetch.ai")

    # Run agent (will register on Almanac)
    agent_instance.agent.run()


def deploy_executor():
    """Deploy Cross-Chain Executor agent to Almanac"""
    logger.info("🚀 Deploying Cross-Chain Executor to Almanac...")
    agent_instance = CrossChainExecutor()

    logger.info(f"Agent address: {agent_instance.agent.address}")
    logger.info(f"Agent name: {agent_instance.agent.name}")
    logger.info("⚠️  Make sure this address is funded with FET tokens!")
    logger.info("💡 Get testnet FET from: https://faucet.fetch.ai")

    # Run agent (will register on Almanac)
    agent_instance.agent.run()


def main():
    parser = argparse.ArgumentParser(
        description="Deploy individual LiquidityGuard AI agents to Almanac"
    )
    parser.add_argument(
        "--agent",
        type=str,
        required=True,
        choices=["position_monitor", "yield_optimizer",
                 "swap_optimizer", "cross_chain_executor"],
        help="Which agent to deploy"
    )

    args = parser.parse_args()

    print("\n" + "="*60)
    print("🌐 LIQUIDITYGUARD AI - ALMANAC DEPLOYMENT")
    print("="*60)
    print()

    # Deploy selected agent
    if args.agent == "position_monitor":
        deploy_position_monitor()
    elif args.agent == "yield_optimizer":
        deploy_yield_optimizer()
    elif args.agent == "swap_optimizer":
        deploy_swap_optimizer()
    elif args.agent == "cross_chain_executor":
        deploy_executor()
    else:
        logger.error(f"Unknown agent: {args.agent}")
        sys.exit(1)


if __name__ == "__main__":
    main()
