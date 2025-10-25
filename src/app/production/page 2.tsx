import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Wallet, Rocket, CheckCircle, Clock } from 'lucide-react';

export default function ProductionPage() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="glass-card border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Production Mode</h1>
                <p className="text-sm text-gray-400">
                  Full production deployment • Coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/20 mb-6">
            <Rocket className="w-10 h-10 text-yellow-400" />
          </div>
          
          <h2 className="text-5xl font-bold text-white mb-4">
            Production Mode
            <span className="block text-2xl text-yellow-400 mt-2">Coming Soon</span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Full production deployment with smart contract integration is currently in development.
            We're working on security audits and mainnet preparation.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Demo & Presentation Ready</h3>
                <p className="text-sm text-gray-400">
                  Try our demo mode or watch live presentation with real Sepolia testnet data.
                </p>
                <div className="flex gap-2 mt-3">
                  <Link href="/demo" className="text-sm text-blue-400 hover:text-blue-300">
                    Try Demo →
                  </Link>
                  <Link href="/presentation" className="text-sm text-purple-400 hover:text-purple-300">
                    Watch Presentation →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">In Development</h3>
                <p className="text-sm text-gray-400">
                  Smart contract deployment, security audits, and mainnet preparation are underway.
                </p>
                <div className="text-sm text-yellow-400 mt-2">
                  Expected: Q1 2025
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap */}
        <div className="glass-card p-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            Development Roadmap
          </h3>

          <div className="space-y-6">
            {/* Phase 1 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="w-0.5 h-full bg-green-500 mt-2" />
              </div>
              <div className="pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-bold text-white">Phase 1: AI Agents & Demo</h4>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                    Complete
                  </span>
                </div>
                <ul className="text-sm text-gray-400 space-y-1 ml-4">
                  <li>✓ Position monitoring agent</li>
                  <li>✓ Yield optimization agent</li>
                  <li>✓ Swap optimization agent</li>
                  <li>✓ Cross-chain executor</li>
                  <li>✓ Interactive demo mode</li>
                  <li>✓ Live presentation mode with Sepolia data</li>
                </ul>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div className="w-0.5 h-full bg-yellow-500/30 mt-2" />
              </div>
              <div className="pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-bold text-white">Phase 2: Smart Contract Development</h4>
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                    In Progress
                  </span>
                </div>
                <ul className="text-sm text-gray-400 space-y-1 ml-4">
                  <li>⏳ LiquidityGuardVault contract (monolithic)</li>
                  <li>⏳ Aave V3 integration</li>
                  <li>⏳ 1inch Fusion+ integration</li>
                  <li>⏳ Lido staking integration</li>
                  <li>⏳ Safety mechanisms (HF checks, limits)</li>
                  <li>⏳ Comprehensive test suite</li>
                </ul>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div className="w-0.5 h-full bg-gray-600/30 mt-2" />
              </div>
              <div className="pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-bold text-white">Phase 3: Security Audit</h4>
                  <span className="text-xs bg-gray-600/20 text-gray-400 px-2 py-1 rounded-full">
                    Pending
                  </span>
                </div>
                <ul className="text-sm text-gray-400 space-y-1 ml-4">
                  <li>• Third-party security audit</li>
                  <li>• Vulnerability assessment</li>
                  <li>• Gas optimization review</li>
                  <li>• Bug bounty program launch</li>
                  <li>• Insurance coverage setup</li>
                </ul>
              </div>
            </div>

            {/* Phase 4 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-bold text-white">Phase 4: Mainnet Launch</h4>
                  <span className="text-xs bg-gray-600/20 text-gray-400 px-2 py-1 rounded-full">
                    Q1 2025
                  </span>
                </div>
                <ul className="text-sm text-gray-400 space-y-1 ml-4">
                  <li>• Mainnet contract deployment</li>
                  <li>• Production frontend launch</li>
                  <li>• Wallet connection (MetaMask, WalletConnect)</li>
                  <li>• User onboarding & documentation</li>
                  <li>• 24/7 monitoring & support</li>
                  <li>• Marketing & growth campaign</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* What's Available Now */}
        <div className="mt-12 glass-card p-8 gradient-bg-animated">
          <h3 className="text-2xl font-bold text-white mb-4 text-center">
            Try It Today
          </h3>
          <p className="text-white/90 text-center mb-6">
            While production mode is in development, you can explore the full system functionality
            through our demo and presentation modes.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/demo"
              className="bg-white text-purple-600 px-6 py-4 rounded-lg font-bold text-center hover:bg-gray-100 transition-all"
            >
              <div className="text-lg mb-1">Interactive Demo</div>
              <div className="text-sm font-normal opacity-80">
                2-minute simulation with mock data
              </div>
            </Link>
            
            <Link
              href="/presentation"
              className="bg-white/20 backdrop-blur text-white px-6 py-4 rounded-lg font-bold text-center hover:bg-white/30 transition-all border border-white/30"
            >
              <div className="text-lg mb-1">Live Presentation</div>
              <div className="text-sm font-normal opacity-80">
                Real Sepolia testnet data & agents
              </div>
            </Link>
          </div>
        </div>

        {/* Placeholder Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="glass-card p-6 text-center opacity-50">
            <Wallet className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h4 className="text-white font-bold mb-2">Wallet Connection</h4>
            <p className="text-sm text-gray-400">
              Connect MetaMask or WalletConnect
            </p>
          </div>
          
          <div className="glass-card p-6 text-center opacity-50">
            <Shield className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h4 className="text-white font-bold mb-2">Manage Positions</h4>
            <p className="text-sm text-gray-400">
              View and manage your DeFi positions
            </p>
          </div>
          
          <div className="glass-card p-6 text-center opacity-50">
            <Lock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h4 className="text-white font-bold mb-2">Agent Approval</h4>
            <p className="text-sm text-gray-400">
              Approve AI agents to protect positions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}