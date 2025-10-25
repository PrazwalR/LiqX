'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Shield, TrendingUp, Zap, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className='min-h-screen bg-black overflow-hidden relative'>
      <div className='fixed inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/10 to-black pointer-events-none' />

      <div
        className='fixed top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse'
        style={{
          transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)`,
          transition: 'transform 0.5s ease-out'
        }}
      />
      <div
        className='fixed bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse'
        style={{
          transform: `translate(${-mousePosition.x * 1.5}px, ${-mousePosition.y * 1.5}px)`,
          transition: 'transform 0.5s ease-out',
          animationDelay: '1s'
        }}
      />
      <div
        className='fixed top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse'
        style={{
          transform: `translate(calc(-50% + ${mousePosition.x}px), calc(-50% + ${mousePosition.y}px))`,
          transition: 'transform 0.5s ease-out',
          animationDelay: '2s'
        }}
      />

      <div className='fixed inset-0 opacity-[0.015]'
        style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      />

      <div className='container mx-auto px-4 py-16 relative z-10'>
        <div className={`flex flex-col items-center justify-center min-h-[90vh] text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className='mb-8 relative group'>
            <div className='absolute inset-0 bg-blue-500/30 blur-3xl rounded-full group-hover:bg-blue-500/50 transition-all duration-500' />
            <div className='relative'>
              <Image
                src='/liqx_logo.webp'
                alt='LiqX Logo'
                width={180}
                height={180}
                className='drop-shadow-2xl hover:scale-110 transition-transform duration-500'
                priority
              />
            </div>
          </div>

          <h1 className='text-7xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 animate-gradient'>
            Protect. Optimize. Execute.
          </h1>

          <p className='text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl leading-relaxed'>
            Autonomous AI agents monitoring your DeFi positions <span className='text-blue-400'>24/7</span>.
            <br />
            Real-time protection, intelligent optimization, instant execution.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 mb-16'>
            <Link href='/demo' className='group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/50 hover:scale-105 flex items-center gap-2'>
              Launch Demo
              <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
            </Link>
            <Link href='/presentation' className='group px-8 py-4 bg-purple-600/80 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all duration-300 border border-purple-500/50 hover:border-purple-400 backdrop-blur-sm hover:scale-105 flex items-center gap-2'>
              <Zap className='w-5 h-5' />
              Presentation
            </Link>
            <Link href='/production' className='group px-8 py-4 bg-gray-800/50 hover:bg-gray-700/50 text-white font-semibold rounded-xl transition-all duration-300 border border-gray-700 hover:border-gray-600 backdrop-blur-sm hover:scale-105 flex items-center gap-2'>
              <Sparkles className='w-5 h-5' />
              Connect Wallet
            </Link>
          </div>

          <div className='grid md:grid-cols-3 gap-8 w-full max-w-4xl'>
            <div className='bg-gray-900/40 backdrop-blur-md p-8 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20'>
              <div className='text-4xl font-bold text-blue-400 mb-2'>$45K+</div>
              <div className='text-gray-500 text-sm uppercase tracking-wider'>Protected Value</div>
            </div>
            <div className='bg-gray-900/40 backdrop-blur-md p-8 rounded-2xl border border-gray-800 hover:border-green-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20'>
              <div className='text-4xl font-bold text-green-400 mb-2'>95%</div>
              <div className='text-gray-500 text-sm uppercase tracking-wider'>Success Rate</div>
            </div>
            <div className='bg-gray-900/40 backdrop-blur-md p-8 rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20'>
              <div className='text-4xl font-bold text-purple-400 mb-2'>&lt;5s</div>
              <div className='text-gray-500 text-sm uppercase tracking-wider'>Response Time</div>
            </div>
          </div>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24 mt-24'>
          <div className={`group bg-gray-900/30 backdrop-blur-md p-8 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Shield className='w-14 h-14 text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300' />
            <h3 className='text-xl font-semibold text-white mb-3'>Position Monitoring</h3>
            <p className='text-gray-400 leading-relaxed'>24/7 monitoring of your DeFi positions with real-time health factor tracking</p>
          </div>

          <div className={`group bg-gray-900/30 backdrop-blur-md p-8 rounded-2xl border border-gray-800 hover:border-green-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <TrendingUp className='w-14 h-14 text-green-400 mb-6 group-hover:scale-110 transition-transform duration-300' />
            <h3 className='text-xl font-semibold text-white mb-3'>Yield Optimization</h3>
            <p className='text-gray-400 leading-relaxed'>Automatically find and execute the best yield strategies across protocols</p>
          </div>

          <div className={`group bg-gray-900/30 backdrop-blur-md p-8 rounded-2xl border border-gray-800 hover:border-yellow-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/20 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Zap className='w-14 h-14 text-yellow-400 mb-6 group-hover:scale-110 transition-transform duration-300' />
            <h3 className='text-xl font-semibold text-white mb-3'>Instant Execution</h3>
            <p className='text-gray-400 leading-relaxed'>Multi-chain transactions executed in milliseconds when needed</p>
          </div>

          <div className={`group bg-gray-900/30 backdrop-blur-md p-8 rounded-2xl border border-gray-800 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Lock className='w-14 h-14 text-purple-400 mb-6 group-hover:scale-110 transition-transform duration-300' />
            <h3 className='text-xl font-semibold text-white mb-3'>Risk Prevention</h3>
            <p className='text-gray-400 leading-relaxed'>AI-powered risk assessment prevents liquidations before they happen</p>
          </div>
        </div>

        <div className='relative group mb-24'>
          <div className='absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-xl group-hover:blur-2xl transition-all duration-500 rounded-3xl' />
          <div className='relative bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-sm p-16 rounded-3xl border border-blue-500/20 text-center overflow-hidden'>
            <div className='absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5 animate-gradient' />
            <div className='relative z-10'>
              <h2 className='text-4xl md:text-5xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300'>
                Ready to Protect Your DeFi Positions?
              </h2>
              <p className='text-gray-300 text-lg mb-10 max-w-2xl mx-auto leading-relaxed'>
                Join the future of automated DeFi position management.
                Our AI agents work <span className='text-blue-400 font-semibold'>24/7</span> to keep your positions safe and optimized.
              </p>
              <Link href='/demo' className='group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 hover:scale-105'>
                Get Started Now
                <ArrowRight className='w-5 h-5 group-hover:translate-x-2 transition-transform' />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className='border-t border-gray-900 py-12 relative z-10'>
        <div className='container mx-auto px-4 text-center text-gray-500'>
          <p className='text-sm'>© 2024 LiqX. Powered by autonomous AI agents.</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
      `}</style>
    </div>
  );
}
