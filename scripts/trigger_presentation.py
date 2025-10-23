#!/usr/bin/env python3
"""
LiquidityGuard AI - Presentation Trigger Script

Manual trigger for live presentations and demos.
Only works when PRESENTATION_MODE=true in .env

Usage:
  python scripts/trigger_presentation.py --event market_crash --eth-drop 30
  python scripts/trigger_presentation.py --event alert_position --position-id 0x123...
  python scripts/trigger_presentation.py --event price_drop --token WETH --price 2500
"""

from agents.message_protocols import PresentationTrigger
from uagents import Agent, Context
import asyncio
import argparse
import time
import uuid
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


load_dotenv()

# ═══════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════

PRESENTATION_MODE = os.getenv('PRESENTATION_MODE', 'false').lower() == 'true'
PRESENTATION_TRIGGER_SECRET = os.getenv(
    'PRESENTATION_TRIGGER_SECRET', 'liqx_demo_2025')
POSITION_MONITOR_ADDRESS = "agent1qvvp0sl4xwj04jjheaqwl9na6n4ef8zqrv55qfw96jv2584ze0v6cehs64a"

# ═══════════════════════════════════════════════════════
# TRIGGER SENDER AGENT
# ═══════════════════════════════════════════════════════


class PresentationTriggerSender:
    """Sends presentation triggers to Position Monitor"""

    def __init__(self, event_type: str, **kwargs):
        self.event_type = event_type
        self.kwargs = kwargs

        # Create temporary agent for sending
        self.agent = Agent(
            name="presentation_trigger_sender",
            seed=f"trigger-{uuid.uuid4()}",
            port=9999,
            mailbox=True  # Use mailbox for remote communication
        )

        @self.agent.on_event("startup")
        async def send_trigger(ctx: Context):
            """Send trigger on startup"""

            # Validate mode
            if not PRESENTATION_MODE:
                print("\n❌ ERROR: PRESENTATION_MODE is not enabled!")
                print("   Set PRESENTATION_MODE=true in .env file")
                print(
                    "   This is a safety feature to prevent accidental triggers in production.\n")
                ctx.agent.shutdown()
                return

            # Build trigger message
            trigger_id = str(uuid.uuid4())

            trigger = PresentationTrigger(
                trigger_id=trigger_id,
                trigger_type=self.event_type,
                secret=PRESENTATION_TRIGGER_SECRET
            )

            # Add optional parameters
            if self.event_type == "market_crash":
                trigger.eth_price_drop_percent = self.kwargs.get(
                    'eth_drop', 30.0)

            elif self.event_type == "alert_position":
                trigger.target_position_id = self.kwargs.get('position_id')

            elif self.event_type == "price_drop":
                trigger.target_token = self.kwargs.get('token', 'WETH')
                trigger.custom_price = self.kwargs.get('price')

            # Send trigger
            print("\n" + "="*60)
            print("🎬 PRESENTATION TRIGGER ACTIVATED")
            print("="*60)
            print(f"   Trigger ID: {trigger_id}")
            print(f"   Event Type: {self.event_type}")

            if self.event_type == "market_crash":
                print(f"   ETH Price Drop: {trigger.eth_price_drop_percent}%")
            elif self.event_type == "alert_position":
                print(
                    f"   Target Position: {trigger.target_position_id or 'First available'}")
            elif self.event_type == "price_drop":
                print(f"   Token: {trigger.target_token}")
                print(f"   New Price: ${trigger.custom_price:.2f}")

            print(
                f"\n   Sending to Position Monitor: {POSITION_MONITOR_ADDRESS}")
            print("="*60 + "\n")

            try:
                await ctx.send(POSITION_MONITOR_ADDRESS, trigger)
                print("✅ Trigger sent successfully!")
                print("\n📺 Watch your agent logs to see the response...")
                print("   Terminal 1: Position Monitor will receive trigger")
                print("   Terminal 2: Yield Optimizer will receive alerts")
                print("   Terminal 3: Swap Optimizer will receive strategies")
                print("   Terminal 4: Executor will execute transactions\n")

            except Exception as e:
                print(f"❌ Failed to send trigger: {e}")

            # Shutdown after sending
            await asyncio.sleep(2)
            ctx.agent.shutdown()

    def run(self):
        """Run the trigger sender"""
        self.agent.run()


# ═══════════════════════════════════════════════════════
# CLI INTERFACE
# ═══════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="LiquidityGuard AI - Presentation Trigger",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Trigger market crash (30% ETH drop)
  python scripts/trigger_presentation.py --event market_crash --eth-drop 30
  
  # Trigger market crash (50% ETH drop)
  python scripts/trigger_presentation.py --event market_crash --eth-drop 50
  
  # Force alert for specific position
  python scripts/trigger_presentation.py --event alert_position --position-id 0x123abc...
  
  # Force alert for first available position
  python scripts/trigger_presentation.py --event alert_position
  
  # Set custom token price
  python scripts/trigger_presentation.py --event price_drop --token WETH --price 2500
  
  # Set custom token price (ETH to $2000)
  python scripts/trigger_presentation.py --event price_drop --token ETH --price 2000

Note: PRESENTATION_MODE must be enabled in .env for this to work!
        """
    )

    parser.add_argument(
        '--event',
        type=str,
        required=True,
        choices=['market_crash', 'alert_position', 'price_drop'],
        help='Type of event to trigger'
    )

    parser.add_argument(
        '--eth-drop',
        type=float,
        default=30.0,
        help='Percentage drop in ETH price (for market_crash event)'
    )

    parser.add_argument(
        '--position-id',
        type=str,
        help='Specific position ID to alert (for alert_position event)'
    )

    parser.add_argument(
        '--token',
        type=str,
        default='WETH',
        help='Token symbol (for price_drop event)'
    )

    parser.add_argument(
        '--price',
        type=float,
        help='New price in USD (for price_drop event)'
    )

    args = parser.parse_args()

    # Validate arguments
    if args.event == 'price_drop' and not args.price:
        print("❌ ERROR: --price is required for price_drop event")
        sys.exit(1)

    # Build kwargs
    kwargs = {}
    if args.event == 'market_crash':
        kwargs['eth_drop'] = args.eth_drop
    elif args.event == 'alert_position':
        kwargs['position_id'] = args.position_id
    elif args.event == 'price_drop':
        kwargs['token'] = args.token
        kwargs['price'] = args.price

    # Create and run trigger sender
    sender = PresentationTriggerSender(args.event, **kwargs)
    sender.run()


if __name__ == "__main__":
    main()
