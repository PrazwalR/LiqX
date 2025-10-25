import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function Loading({ text, size = 'md', fullScreen = false }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center gap-4">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-purple-500`} />
      {text && (
        <p className="text-sm text-gray-400 animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

// Skeleton loaders for specific components
export function PositionSkeleton() {
  return (
    <div className="glass-card p-4 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="h-4 w-32 bg-white/10 rounded mb-2" />
          <div className="h-3 w-24 bg-white/5 rounded" />
        </div>
        <div className="h-6 w-16 bg-white/10 rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="h-3 w-20 bg-white/5 rounded mb-2" />
          <div className="h-5 w-28 bg-white/10 rounded" />
        </div>
        <div>
          <div className="h-3 w-20 bg-white/5 rounded mb-2" />
          <div className="h-5 w-28 bg-white/10 rounded" />
        </div>
      </div>

      <div className="h-2 w-full bg-white/5 rounded-full" />
    </div>
  );
}

export function AgentStatusSkeleton() {
  return (
    <div className="glass-card p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-full" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-white/10 rounded mb-2" />
          <div className="h-3 w-24 bg-white/5 rounded" />
        </div>
        <div className="h-6 w-16 bg-white/10 rounded-full" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-6 w-48 bg-white/10 rounded mb-6" />
      <div className="h-64 bg-white/5 rounded flex items-end gap-2 p-4">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-white/10 rounded-t"
            style={{ height: `${Math.random() * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/10 rounded-full" />
        <div className="flex-1">
          <div className="h-3 w-24 bg-white/5 rounded mb-2" />
          <div className="h-6 w-32 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  );
}

// Grid of skeleton loaders
export function PositionGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <PositionSkeleton key={i} />
      ))}
    </div>
  );
}

export function AgentGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <AgentStatusSkeleton key={i} />
      ))}
    </div>
  );
}
