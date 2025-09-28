import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

export function Skeleton({ 
  className = '', 
  width, 
  height, 
  rounded = false,
  animate = true 
}: SkeletonProps) {
  const baseClasses = `bg-gray-200 ${rounded ? 'rounded-full' : 'rounded-md'} ${animate ? 'animate-pulse' : ''}`;
  
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  
  return (
    <div 
      className={`${baseClasses} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton components for common patterns
export function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
      <div className="flex items-center space-x-4 flex-1">
        <Skeleton width={100} height={24} className="flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={14} />
        </div>
      </div>
      <div className="flex items-center space-x-2 ml-4">
        <Skeleton width={24} height={24} rounded />
        <Skeleton width={24} height={24} rounded />
      </div>
    </div>
  );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <Skeleton width={120} height={16} />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <TransactionSkeleton key={i} />
      ))}
    </div>
  );
}

export function BalanceSkeleton() {
  return (
    <div className="text-center">
      <Skeleton width="80%" height={64} className="mx-auto mb-6" />
      <Skeleton width="60%" height={20} className="mx-auto mb-2" />
      <Skeleton width="40%" height={14} className="mx-auto" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="space-y-4">
        <Skeleton width="50%" height={20} />
        <div className="space-y-2">
          <Skeleton width="100%" height={16} />
          <Skeleton width="80%" height={16} />
          <Skeleton width="60%" height={16} />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton width={48} height={48} rounded />
              <Skeleton width={120} height={16} />
            </div>
            <Skeleton width={24} height={24} rounded />
          </div>
        </div>
      </header>

      {/* Balance Section Skeleton */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <BalanceSkeleton />
      </div>

      {/* Action Buttons Skeleton */}
      <div className="bg-gray-50 px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton width="100%" height={120} className="rounded-2xl" />
          <Skeleton width="100%" height={120} className="rounded-2xl" />
        </div>

        {/* Recent Transactions Skeleton */}
        <TransactionListSkeleton count={3} />
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}