#!/bin/bash

# LiquidityGuard AI - Backend Setup Script
# This script sets up the complete Python agent environment

set -e  # Exit on error

echo "🚀 LiquidityGuard AI - Backend Setup"
echo "====================================="
echo ""

# Check Python version
echo "📋 Checking Python version..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "✅ Python $PYTHON_VERSION found"
echo ""

# Create virtual environment
echo "📦 Creating virtual environment..."
if [ -d "venv" ]; then
    echo "⚠️  Virtual environment already exists. Removing..."
    rm -rf venv
fi

python3 -m venv venv
echo "✅ Virtual environment created"
echo ""

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip
echo ""

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p logs
mkdir -p data
mkdir -p agents
mkdir -p tests
mkdir -p config
echo "✅ Directories created"
echo ""

# Copy .env.example to .env if not exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  IMPORTANT: Edit .env file and add your API keys!"
else
    echo "ℹ️  .env file already exists"
fi
echo ""

# Test imports
echo "🧪 Testing Python imports..."
python3 << EOF
try:
    import uagents
    import web3
    import aiohttp
    import loguru
    print("✅ All core imports successful")
except ImportError as e:
    print(f"❌ Import error: {e}")
    exit(1)
EOF
echo ""

# Display next steps
echo "====================================="
echo "✅ Setup Complete!"
echo "====================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Activate the virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "2. Edit .env file with your API keys:"
echo "   nano .env"
echo ""
echo "3. Get API keys from:"
echo "   - Alchemy: https://www.alchemy.com/"
echo "   - 1inch: https://portal.1inch.dev/"
echo "   - CoinGecko: https://www.coingecko.com/en/api"
echo ""
echo "4. Test the price feeds:"
echo "   python3 data/price_feeds.py"
echo ""
echo "5. Test protocol data:"
echo "   python3 data/protocol_data.py"
echo ""
echo "6. Run the Position Monitor agent:"
echo "   python3 agents/position_monitor.py"
echo ""
echo "🎉 Happy coding!"
