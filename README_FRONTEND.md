# 🎨 LiquidityGuard AI - Frontend Implementation Guide

> **Complete guide for building a modern Next.js 15 frontend with Demo, Presentation, and Production modes.**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Setup](#project-setup)
5. [Operation Modes Explained](#operation-modes-explained)
6. [Page Implementations](#page-implementations)
7. [Component Library](#component-library)
8. [API Integration](#api-integration)
9. [Real-Time Updates](#real-time-updates)
10. [Demo Mode Features](#demo-mode-features)
11. [Presentation Mode Features](#presentation-mode-features)
12. [Production Mode Features](#production-mode-features)
13. [Deployment](#deployment)

---

## 🎯 Overview

### **What You're Building**

A **Next.js 15 frontend** that:
- Connects user wallets (MetaMask, WalletConnect, Coinbase Wallet)
- Displays real-time DeFi positions and health factors
- Shows live AI agent activity
- Supports **THREE operation modes**: Demo, Presentation, Production
- Allows manual event triggering (Presentation mode)
- Provides analytics and historical data
- Works seamlessly with the smart contract and AI agents

### **Current System Status**

✅ **Complete:**
- 4 AI agents running (Position Monitor, Yield Optimizer, Swap Optimizer, Executor)
- Data integration (The Graph, CoinGecko, 1inch)
- Operation mode system (Demo/Presentation/Production)
- Manual trigger system (`scripts/trigger_presentation.py`)

⏳ **Your Task:**
- Build Next.js 15 frontend
- Integrate with agents via API
- Support all three operation modes
- Create interactive demo experience
- Real-time agent activity feed

### **Key Difference from Typical DeFi Apps**

Most DeFi apps have **one mode**. We have **THREE**:

1. **Demo Mode** - Pure simulation for presentations (no blockchain, works offline)
2. **Presentation Mode** - Real data + manual triggers (judges can interact)
3. **Production Mode** - Full autonomous operation (real user funds)

Your frontend must support **ALL THREE** seamlessly.

---

## 🏗️ Architecture

### **Frontend Structure**

```
src/
├── app/                          # Next.js 15 App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── demo/
│   │   └── page.tsx            # Demo mode page
│   ├── presentation/
│   │   └── page.tsx            # Presentation mode page (production view)
│   ├── dashboard/
│   │   └── page.tsx            # User dashboard
│   ├── positions/
│   │   └── page.tsx            # Positions list
│   ├── agents/
│   │   └── page.tsx            # Agent management
│   ├── analytics/
│   │   └── page.tsx            # Analytics & charts
│   ├── settings/
│   │   └── page.tsx            # User settings
│   └── api/                     # API routes
│       ├── demo/
│       │   └── route.ts        # Demo mode API
│       ├── presentation/
│       │   └── trigger/
│       │       └── route.ts    # Trigger events
│       ├── positions/
│       │   └── route.ts        # Fetch positions
│       ├── agents/
│       │   └── activity/
│       │       └── route.ts    # Agent activity feed
│       └── analytics/
│           └── route.ts        # Analytics data
├── components/
│   ├── wallet/
│   │   └── WalletConnect.tsx   # Wallet connection
│   ├── positions/
│   │   ├── PositionCard.tsx
│   │   └── PositionList.tsx
│   ├── agents/
│   │   ├── AgentActivityFeed.tsx
│   │   └── AgentCard.tsx
│   ├── demo/
│   │   ├── DemoController.tsx  # Demo mode controls
│   │   └── DemoWorkflow.tsx    # Animated workflow
│   ├── presentation/
│   │   ├── TriggerButtons.tsx  # Manual triggers
│   │   └── LiveTerminal.tsx    # Terminal output
│   └── ui/                      # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Chart.tsx
│       └── HealthFactorBar.tsx
├── lib/
│   ├── web3/
│   │   ├── wagmi.ts            # Wagmi configuration
│   │   └── contracts.ts        # Contract ABIs & addresses
│   ├── api/
│   │   ├── positions.ts        # Position fetching
│   │   ├── agents.ts           # Agent activity
│   │   └── subgraph.ts         # The Graph queries
│   └── utils/
│       ├── formatting.ts       # Number formatting
│       └── constants.ts        # App constants
├── store/
│   ├── usePositionsStore.ts    # Position state
│   ├── useAgentStore.ts        # Agent activity state
│   └── useAppStore.ts          # App-wide state
├── hooks/
│   ├── usePositions.ts         # Position data hook
│   ├── useAgentActivity.ts     # Agent activity hook
│   └── useRealtime.ts          # Real-time updates
└── types/
    ├── positions.ts
    ├── agents.ts
    └── strategies.ts
```

### **Data Flow**

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Landing │  │   Demo   │  │Production│             │
│  │   Page   │  │   Page   │  │   Page   │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │              │                    │
│       └─────────────┴──────────────┘                    │
│                     │                                    │
│              ┌──────▼──────┐                            │
│              │  API Routes │                            │
│              └──────┬──────┘                            │
└─────────────────────┼────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌─────────────┐
│  The Graph   │ │  Agents  │ │  Contract   │
│  (Positions) │ │  (HTTP)  │ │  (Web3)     │
└──────────────┘ └──────────┘ └─────────────┘
```

---

## 🛠️ Tech Stack

### **Core Framework**

```json
{
  "framework": "Next.js 15 (App Router)",
  "runtime": "React 18",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "package-manager": "pnpm"
}
```

### **Web3 Stack**

```json
{
  "wallet-connection": "wagmi v2",
  "wallet-ui": "@rainbow-me/rainbowkit",
  "web3-library": "viem",
  "chain-support": ["ethereum", "sepolia"],
  "rpc-provider": "Alchemy"
}
```

### **Data & State Management**

```json
{
  "state-management": "Zustand",
  "data-fetching": "@tanstack/react-query",
  "real-time": "Socket.io or polling",
  "graphql": "@apollo/client"
}
```

### **UI Components**

```json
{
  "component-library": "shadcn/ui",
  "charts": "recharts",
  "animations": "framer-motion",
  "icons": "lucide-react",
  "notifications": "sonner"
}
```

### **Development Tools**

```json
{
  "linting": "ESLint",
  "formatting": "Prettier",
  "type-checking": "TypeScript strict mode",
  "testing": "Vitest + React Testing Library"
}
```

---

## 🚀 Project Setup

### **Step 1: Create Next.js Project**

```bash
# Navigate to project root
cd /Users/prazw/Desktop/LiqX

# Create Next.js app in src/ directory
pnpm create next-app@latest src --typescript --tailwind --app --use-pnpm

# Options:
# ✔ Would you like to use ESLint? … Yes
# ✔ Would you like to use Tailwind CSS? … Yes
# ✔ Would you like to use `src/` directory? … No (already in src/)
# ✔ Would you like to use App Router? … Yes
# ✔ Would you like to customize the default import alias? … No

cd src
```

### **Step 2: Install Dependencies**

```bash
# Web3 dependencies
pnpm add wagmi viem @rainbow-me/rainbowkit

# State management & data fetching
pnpm add zustand @tanstack/react-query

# GraphQL client (for The Graph)
pnpm add @apollo/client graphql

# UI components
pnpm add @radix-ui/react-* # shadcn uses Radix
pnpm add class-variance-authority clsx tailwind-merge
pnpm add lucide-react
pnpm add recharts
pnpm add framer-motion
pnpm add sonner

# Utilities
pnpm add date-fns
pnpm add axios

# Development dependencies
pnpm add -D @types/node
pnpm add -D vitest @vitejs/plugin-react
```

### **Step 3: Initialize shadcn/ui**

```bash
pnpm dlx shadcn-ui@latest init

# Install commonly used components
pnpm dlx shadcn-ui@latest add button
pnpm dlx shadcn-ui@latest add card
pnpm dlx shadcn-ui@latest add dialog
pnpm dlx shadcn-ui@latest add dropdown-menu
pnpm dlx shadcn-ui@latest add table
pnpm dlx shadcn-ui@latest add tabs
pnpm dlx shadcn-ui@latest add toast
pnpm dlx shadcn-ui@latest add skeleton
```

### **Step 4: Configure Environment**

Create `src/.env.local`:

```bash
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_AGENT_URL=http://localhost:8000

# The Graph
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/1704206/liq-x/v0.1.0

# Alchemy (for RPC)
NEXT_PUBLIC_ALCHEMY_KEY=your_alchemy_key

# WalletConnect (for wallet connection)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Smart Contract (from deployment)
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=11155111  # Sepolia

# Mode (for server-side rendering)
NEXT_PUBLIC_DEFAULT_MODE=presentation

# Presentation trigger secret
PRESENTATION_TRIGGER_SECRET=liqx_demo_2025
```

### **Step 5: Configure Tailwind**

Edit `src/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color scheme
        safe: "#10b981",       // green-500
        moderate: "#f59e0b",   // amber-500
        high: "#f97316",       // orange-500
        critical: "#ef4444",   // red-500
        primary: "#6366f1",    // indigo-500
        secondary: "#8b5cf6",  // violet-500
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 🎭 Operation Modes Explained

### **Understanding the Three Modes**

Your frontend must support **THREE** distinct operation modes. Here's what makes each unique:

---

### **1. Demo Mode** (`/demo`)

**Purpose:** Wow factor for presentations, works offline

**Characteristics:**
- ✅ 100% simulated data
- ✅ No blockchain calls
- ✅ No API dependencies
- ✅ Works offline
- ✅ 2-minute automated flow
- ✅ 1 fake position (HF=1.09, $6,400 collateral)
- ✅ Mock prices (ETH=$3,200, crash to $2,240)

**Data Source:**
```typescript
// All data is hardcoded
const DEMO_POSITION = {
  id: "0x742d35Cc...",
  collateral: [{ token: "WETH", amount: 2.0, valueUSD: 6400 }],
  debt: [{ token: "USDC", amount: 5000, valueUSD: 5000 }],
  healthFactor: 1.09,
  protocol: "Aave V3",
  chain: "Ethereum"
};
```

**UI Features:**
- Big "Start Demo" button
- Animated workflow showing agent responses
- Terminal-style log output (simulated)
- Confetti animation on success
- Progress bar (0% → 100% over 2 minutes)

**Backend Integration:**
```
Frontend → NO backend needed (all client-side simulation)
```

---

### **2. Presentation Mode** (`/presentation`)

**Purpose:** Show real data to judges, allow manual triggers

**Characteristics:**
- ✅ Real Sepolia blockchain data (20 Aave positions)
- ✅ Live prices from CoinGecko
- ✅ Real agent activity logs
- ✅ Manual trigger buttons (market crash, alert position, price drop)
- ✅ Fusion+ execution is **MOCKED** (no real swaps)
- ✅ Internet required

**Data Source:**
```typescript
// Fetch from The Graph + Agents
const positions = await fetch('/api/positions?mode=presentation');
const agentActivity = await fetch('/api/agents/activity');
```

**UI Features:**
- Real position cards (20 positions from Sepolia)
- Live agent activity feed (updates every 5 seconds)
- **Three trigger buttons:**
  - 🚨 Market Crash (-30% ETH)
  - ⚠️ Alert Position
  - 📉 Price Drop (custom)
- Terminal showing actual agent logs
- Charts with real data

**Backend Integration:**
```
Frontend → Next.js API Routes → Python Agents (HTTP) → The Graph
Frontend → Next.js API Routes → trigger_presentation.py script
```

---

### **3. Production Mode** (`/dashboard`)

**Purpose:** Real user interface for actual DeFi positions

**Characteristics:**
- ✅ Real mainnet/Sepolia positions (user's wallet)
- ✅ Live prices
- ✅ Real agent activity
- ✅ Real Fusion+ execution (actual swaps)
- ✅ Wallet connection required
- ✅ Smart contract integration

**Data Source:**
```typescript
// Fetch user's actual positions
const { address } = useAccount();
const positions = await fetch(`/api/positions?address=${address}`);
```

**UI Features:**
- Wallet connect button (MetaMask, WalletConnect)
- User's real positions from connected wallet
- Agent approval/revoke buttons
- Real transaction history
- Analytics (portfolio value over time)
- Settings (risk tolerance, notifications)

**Backend Integration:**
```
Frontend → Smart Contract (read positions)
Frontend → Smart Contract (approve agents)
Agents → Smart Contract (execute strategies)
```

---

### **Mode Comparison Table**

| Feature | Demo Mode | Presentation Mode | Production Mode |
|---------|-----------|-------------------|-----------------|
| **Data Source** | Hardcoded | The Graph (Sepolia) | Blockchain (user's wallet) |
| **Positions** | 1 fake | 20 real Sepolia | User's actual positions |
| **Prices** | Mock ($3,200) | Live CoinGecko | Live CoinGecko + Chainlink |
| **Agent Logs** | Simulated | Real agent HTTP logs | Real agent activity |
| **Triggers** | Automatic (2-min cycle) | Manual buttons | Automatic (market-driven) |
| **Swaps** | Fake | Mocked | Real (1inch Fusion+) |
| **Wallet** | Not needed | Not needed | Required |
| **Internet** | Optional | Required | Required |
| **Backend** | None | Python agents + API | Agents + Contract |
| **Best For** | Presentations | Judge demos | Real users |

---

## 📄 Page Implementations

### **1. Landing Page** (`app/page.tsx`)

```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-6">
            🛡️ LiquidityGuard AI
          </h1>
          <p className="text-2xl mb-4">
            Your AI Guardian for DeFi
          </p>
          <p className="text-xl mb-12 opacity-90">
            24/7 AI-powered protection against liquidation + automatic yield optimization
          </p>
          
          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center">
            <Link href="/demo">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                🎬 Try Interactive Demo
              </Button>
            </Link>
            
            <Link href="/presentation">
              <Button size="lg" className="text-lg px-8">
                🚀 View Live Positions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            icon="💰"
            value="$12.5M"
            label="Total Value Protected"
          />
          <StatsCard
            icon="🏦"
            value="1,234"
            label="Positions Monitored"
          />
          <StatsCard
            icon="⚡"
            value="5,678"
            label="Alerts Sent Today"
          />
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon="🔍"
            title="24/7 Monitoring"
            description="AI agents watch your positions every 30 seconds"
          />
          <FeatureCard
            icon="🧠"
            title="AI-Powered Decisions"
            description="MeTTa reasoning engine thinks, not just reacts"
          />
          <FeatureCard
            icon="💸"
            title="Gasless Transactions"
            description="1inch Fusion+ saves $50-100 per transaction"
          />
          <FeatureCard
            icon="📈"
            title="Yield Optimization"
            description="Automatically finds the best yields across protocols"
          />
        </div>
      </section>

      {/* How It Works - Visual */}
      <section className="container mx-auto px-4 py-12">
        <WorkflowDiagram />
      </section>
    </div>
  );
}

function StatsCard({ icon, value, label }: {
  icon: string;
  value: string;
  label: string;
}) {
  return (
    <Card className="p-6 text-center bg-white/10 backdrop-blur-md border-white/20">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/80">{label}</div>
    </Card>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/80">{description}</p>
    </Card>
  );
}
```

---

### **2. Demo Mode Page** (`app/demo/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DemoWorkflow } from '@/components/demo/DemoWorkflow';
import { DemoTerminal } from '@/components/demo/DemoTerminal';
import Confetti from 'react-confetti';

export default function DemoPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const startDemo = async () => {
    setIsRunning(true);
    setProgress(0);
    setCurrentStep(0);
    
    // Simulate demo flow (2 minutes)
    const steps = [
      { delay: 0, step: 0, progress: 0, message: "🔍 Monitoring position..." },
      { delay: 15000, step: 1, progress: 25, message: "⚠️ Alert: Health factor dropped to 1.09" },
      { delay: 30000, step: 2, progress: 50, message: "🧮 Calculating optimal strategy..." },
      { delay: 45000, step: 3, progress: 75, message: "💡 Strategy: Rebalance to Lido (+2.3% APY)" },
      { delay: 60000, step: 4, progress: 90, message: "🔗 Finding best route via 1inch Fusion+..." },
      { delay: 75000, step: 5, progress: 100, message: "✅ Position secured! New HF: 1.45" },
    ];
    
    for (const { delay, step, progress: prog, message } of steps) {
      await new Promise(resolve => setTimeout(resolve, delay));
      setCurrentStep(step);
      setProgress(prog);
      console.log(message);
      
      if (step === 5) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
    
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {showConfetti && <Confetti />}
      
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            🎬 Interactive Demo
          </h1>
          <p className="text-xl text-gray-400">
            Watch our AI agents respond to a market crash in real-time
          </p>
        </div>

        {/* Demo Controls */}
        <Card className="p-8 mb-8 bg-gray-800 border-gray-700">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Current Scenario</h2>
              <div className="text-gray-400">
                <p>Demo Position: $100K ETH collateral, $80K USDC debt</p>
                <p>Health Factor: 1.33 (SAFE)</p>
                <p>ETH Price: $3,200</p>
              </div>
            </div>

            {!isRunning && (
              <Button
                size="lg"
                className="w-full bg-red-500 hover:bg-red-600 text-white text-xl py-6"
                onClick={startDemo}
              >
                🚨 Start Demo: Trigger Market Crash (-30%)
              </Button>
            )}

            {isRunning && (
              <div className="space-y-4">
                <Progress value={progress} className="h-4" />
                <p className="text-center text-lg">
                  Demo in progress... {progress}%
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Split View: Workflow + Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Visual Workflow */}
          <Card className="p-6 bg-gray-800 border-gray-700">
            <h3 className="text-xl font-bold mb-4">Workflow</h3>
            <DemoWorkflow currentStep={currentStep} />
          </Card>

          {/* Right: Terminal Logs */}
          <Card className="p-6 bg-gray-800 border-gray-700">
            <h3 className="text-xl font-bold mb-4">Agent Logs</h3>
            <DemoTerminal isRunning={isRunning} />
          </Card>
        </div>
      </div>
    </div>
  );
}
```

---

### **3. Presentation Mode Page** (`app/presentation/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PositionList } from '@/components/positions/PositionList';
import { AgentActivityFeed } from '@/components/agents/AgentActivityFeed';
import { TriggerButtons } from '@/components/presentation/TriggerButtons';
import { LiveTerminal } from '@/components/presentation/LiveTerminal';

export default function PresentationPage() {
  const [triggerResult, setTriggerResult] = useState<string | null>(null);

  // Fetch positions from The Graph (Sepolia)
  const { data: positions, isLoading } = useQuery({
    queryKey: ['positions', 'presentation'],
    queryFn: async () => {
      const res = await fetch('/api/positions?mode=presentation');
      return res.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const handleTrigger = async (event: string, params: any) => {
    setTriggerResult(`Triggering ${event}...`);
    
    const res = await fetch('/api/presentation/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ...params }),
    });
    
    const result = await res.json();
    setTriggerResult(result.message);
    
    setTimeout(() => setTriggerResult(null), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            🚀 Production Ready Demo
          </h1>
          <p className="text-gray-400">
            Real Aave V3 positions from Sepolia testnet
          </p>
          {triggerResult && (
            <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500 rounded">
              {triggerResult}
            </div>
          )}
        </div>

        {/* Manual Triggers */}
        <Card className="p-6 mb-8 bg-gray-800 border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Manual Triggers</h2>
          <TriggerButtons onTrigger={handleTrigger} />
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Positions (2 columns) */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h2 className="text-2xl font-bold mb-4">
                Risky Positions ({positions?.length || 0})
              </h2>
              {isLoading ? (
                <div>Loading positions...</div>
              ) : (
                <PositionList positions={positions} />
              )}
            </Card>
          </div>

          {/* Right: Agent Activity + Terminal */}
          <div className="space-y-8">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h2 className="text-xl font-bold mb-4">Agent Activity</h2>
              <AgentActivityFeed mode="presentation" />
            </Card>

            <Card className="p-6 bg-gray-800 border-gray-700">
              <h2 className="text-xl font-bold mb-4">Live Logs</h2>
              <LiveTerminal />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### **4. Production Dashboard** (`app/dashboard/page.tsx`)

```typescript
'use client';

import { useAccount } from 'wagmi';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { PositionList } from '@/components/positions/PositionList';
import { AgentActivityFeed } from '@/components/agents/AgentActivityFeed';
import { PortfolioChart } from '@/components/analytics/PortfolioChart';
import { usePositions } from '@/hooks/usePositions';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { positions, isLoading } = usePositions(address);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8">
            Connect Your Wallet
          </h1>
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-400">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Portfolio Value</p>
              <p className="text-3xl font-bold">
                ${positions?.reduce((sum, p) => sum + p.totalCollateralUSD, 0).toLocaleString()}
              </p>
            </div>
            <WalletConnect />
          </div>
        </div>

        {/* Portfolio Chart */}
        <Card className="p-6 mb-8 bg-gray-800 border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Portfolio Value</h2>
          <PortfolioChart address={address} />
        </Card>

        {/* Positions & Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Positions */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h2 className="text-2xl font-bold mb-4">Your Positions</h2>
              {isLoading ? (
                <div>Loading positions...</div>
              ) : (
                <PositionList positions={positions} />
              )}
            </Card>
          </div>

          {/* Agent Activity */}
          <div>
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h2 className="text-xl font-bold mb-4">Agent Activity</h2>
              <AgentActivityFeed mode="production" address={address} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🧩 Component Library

### **Key Components to Build**

#### **1. Position Card**

```typescript
// components/positions/PositionCard.tsx
import { Card } from '@/components/ui/card';
import { HealthFactorBar } from '@/components/ui/HealthFactorBar';
import { Position } from '@/types/positions';

export function PositionCard({ position }: { position: Position }) {
  const riskLevel = getRiskLevel(position.healthFactor);
  const riskColor = {
    SAFE: 'text-safe',
    MODERATE: 'text-moderate',
    HIGH: 'text-high',
    CRITICAL: 'text-critical',
  }[riskLevel];

  return (
    <Card className="p-6 bg-gray-800 border-gray-700 hover:border-gray-600 transition">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold">{position.protocol}</h3>
          <p className="text-sm text-gray-400">{position.chain}</p>
        </div>
        <span className={`text-sm font-bold ${riskColor}`}>
          {riskLevel}
        </span>
      </div>

      {/* Collateral */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-1">Collateral</p>
        {position.collateral.map((c) => (
          <div key={c.token} className="flex justify-between text-sm">
            <span>{c.amount} {c.token}</span>
            <span className="text-gray-400">${c.valueUSD.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Debt */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-1">Debt</p>
        {position.debt.map((d) => (
          <div key={d.token} className="flex justify-between text-sm">
            <span>{d.amount} {d.token}</span>
            <span className="text-gray-400">${d.valueUSD.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Health Factor */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-1">Health Factor</p>
        <HealthFactorBar value={position.healthFactor} />
      </div>

      {/* Current APY */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">Current APY</span>
        <span className="text-lg font-bold text-green-500">
          {position.currentAPY}%
        </span>
      </div>
    </Card>
  );
}

function getRiskLevel(hf: number): string {
  if (hf >= 2.0) return 'SAFE';
  if (hf >= 1.5) return 'MODERATE';
  if (hf >= 1.2) return 'HIGH';
  return 'CRITICAL';
}
```

#### **2. Agent Activity Feed**

```typescript
// components/agents/AgentActivityFeed.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { formatRelativeTime } from '@/lib/utils/formatting';

export function AgentActivityFeed({ mode, address }: {
  mode: 'demo' | 'presentation' | 'production';
  address?: string;
}) {
  const { data: activities } = useQuery({
    queryKey: ['agent-activity', mode, address],
    queryFn: async () => {
      const url = `/api/agents/activity?mode=${mode}${address ? `&address=${address}` : ''}`;
      const res = await fetch(url);
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto">
      {activities?.map((activity: any) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

function ActivityItem({ activity }: { activity: any }) {
  const icon = {
    monitoring: '🔍',
    alert: '⚠️',
    strategy: '💡',
    execution: '⚡',
    success: '✅',
    failure: '❌',
  }[activity.type] || '📝';

  return (
    <div className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-800/50 rounded">
      <div className="flex items-start gap-2">
        <span className="text-xl">{icon}</span>
        <div className="flex-1">
          <p className="text-sm">{activity.message}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatRelativeTime(activity.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}
```

#### **3. Trigger Buttons (Presentation Mode)**

```typescript
// components/presentation/TriggerButtons.tsx
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function TriggerButtons({ onTrigger }: {
  onTrigger: (event: string, params: any) => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleTrigger = async (event: string, params: any = {}) => {
    setLoading(event);
    await onTrigger(event, params);
    setLoading(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Market Crash */}
      <Button
        size="lg"
        className="bg-red-500 hover:bg-red-600 h-24 flex flex-col gap-2"
        onClick={() => handleTrigger('market_crash', { ethDrop: 30 })}
        disabled={loading !== null}
      >
        <span className="text-3xl">🚨</span>
        <span>Market Crash (-30%)</span>
        {loading === 'market_crash' && <span className="text-xs">Triggering...</span>}
      </Button>

      {/* Alert Position */}
      <Button
        size="lg"
        className="bg-orange-500 hover:bg-orange-600 h-24 flex flex-col gap-2"
        onClick={() => handleTrigger('alert_position', {})}
        disabled={loading !== null}
      >
        <span className="text-3xl">⚠️</span>
        <span>Alert First Position</span>
        {loading === 'alert_position' && <span className="text-xs">Triggering...</span>}
      </Button>

      {/* Price Drop */}
      <Button
        size="lg"
        className="bg-yellow-500 hover:bg-yellow-600 h-24 flex flex-col gap-2"
        onClick={() => handleTrigger('price_drop', { token: 'WETH', price: 2500 })}
        disabled={loading !== null}
      >
        <span className="text-3xl">📉</span>
        <span>Price Drop (ETH=$2500)</span>
        {loading === 'price_drop' && <span className="text-xs">Triggering...</span>}
      </Button>
    </div>
  );
}
```

---

## 🔌 API Integration

### **API Routes**

#### **1. Fetch Positions** (`app/api/positions/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient, gql } from 'graphql-request';

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL!;
const client = new GraphQLClient(SUBGRAPH_URL);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode') || 'presentation';
  const address = searchParams.get('address');

  if (mode === 'presentation') {
    // Fetch from The Graph (Sepolia)
    const query = gql`
      query GetRiskyPositions {
        aaveV3Positions(
          where: { healthFactor_lt: "1.5" }
          orderBy: healthFactor
          orderDirection: asc
          first: 20
        ) {
          id
          user
          healthFactor
          totalCollateralBase
          totalDebtBase
          availableBorrowsBase
        }
      }
    `;

    const data = await client.request(query);
    
    // Transform to frontend format
    const positions = data.aaveV3Positions.map((p: any) => ({
      id: p.id,
      user: p.user,
      protocol: 'Aave V3',
      chain: 'Sepolia',
      healthFactor: parseFloat(p.healthFactor),
      totalCollateralUSD: parseFloat(p.totalCollateralBase) / 1e8,
      totalDebtUSD: parseFloat(p.totalDebtBase) / 1e8,
      collateral: [], // TODO: Fetch detailed breakdown
      debt: [],
    }));

    return NextResponse.json(positions);
  }

  if (mode === 'production' && address) {
    // Fetch user's positions from smart contract
    // TODO: Implement contract reading
    return NextResponse.json([]);
  }

  return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
}
```

#### **2. Trigger Events** (`app/api/presentation/trigger/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { event, ethDrop, token, price } = body;

  // Build command
  let command = `cd /Users/prazw/Desktop/LiqX && source .venv/bin/activate && python scripts/trigger_presentation.py --event ${event}`;

  if (event === 'market_crash' && ethDrop) {
    command += ` --eth-drop ${ethDrop}`;
  }

  if (event === 'price_drop' && token && price) {
    command += ` --token ${token} --price ${price}`;
  }

  try {
    const { stdout, stderr } = await execAsync(command);
    
    return NextResponse.json({
      success: true,
      message: `Trigger sent: ${event}`,
      output: stdout,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Trigger failed',
      error: error.message,
    }, { status: 500 });
  }
}
```

#### **3. Agent Activity** (`app/api/agents/activity/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode') || 'presentation';

  // Read agent log files
  const logsDir = path.join(process.cwd(), '..', 'logs');
  
  try {
    const files = [
      'position_monitor.log',
      'yield_optimizer.log',
      'swap_optimizer.log',
      'cross_chain_executor.log',
    ];

    const activities = [];

    for (const file of files) {
      const filePath = path.join(logsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').slice(-50); // Last 50 lines

      for (const line of lines) {
        if (line.includes('ALERT SENT')) {
          activities.push({
            id: Math.random().toString(),
            type: 'alert',
            message: 'Alert sent for position',
            timestamp: new Date().toISOString(),
          });
        }
        // Parse more log patterns...
      }
    }

    return NextResponse.json(activities.slice(-20)); // Last 20 activities
  } catch (error) {
    return NextResponse.json([]);
  }
}
```

---

## ⚡ Real-Time Updates

### **Option 1: Polling (Simpler)**

```typescript
// hooks/useAgentActivity.ts
import { useQuery } from '@tanstack/react-query';

export function useAgentActivity(mode: string) {
  return useQuery({
    queryKey: ['agent-activity', mode],
    queryFn: async () => {
      const res = await fetch(`/api/agents/activity?mode=${mode}`);
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });
}
```

### **Option 2: WebSocket (Real-Time)**

```typescript
// lib/websocket.ts
import { io } from 'socket.io-client';

export const socket = io('http://localhost:8000', {
  transports: ['websocket'],
});

// hooks/useRealtimeActivity.ts
import { useEffect, useState } from 'react';
import { socket } from '@/lib/websocket';

export function useRealtimeActivity() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    socket.on('agent-activity', (activity) => {
      setActivities((prev) => [activity, ...prev].slice(0, 20));
    });

    return () => {
      socket.off('agent-activity');
    };
  }, []);

  return activities;
}
```

---

## 🚀 Deployment

### **Vercel Deployment**

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy
cd src
vercel

# Production deployment
vercel --prod
```

### **Environment Variables (Vercel)**

Set in Vercel dashboard:
```
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/1704206/liq-x/v0.1.0
NEXT_PUBLIC_ALCHEMY_KEY=your_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_VAULT_ADDRESS=0x...
PRESENTATION_TRIGGER_SECRET=liqx_demo_2025
```

---

## ✅ Success Criteria

Your implementation is complete when:

- [ ] Landing page with clear CTAs
- [ ] Demo mode page (offline simulation)
- [ ] Presentation mode page (real data + triggers)
- [ ] Production dashboard (wallet connection)
- [ ] Position cards displaying correctly
- [ ] Agent activity feed updating in real-time
- [ ] Manual trigger buttons working (presentation mode)
- [ ] Charts showing historical data
- [ ] Mobile responsive design
- [ ] Dark mode support
- [ ] <3 second page load time
- [ ] Deployed to Vercel
- [ ] All three modes working end-to-end

---

**Build an amazing UI that makes DeFi safer! 🎨**
