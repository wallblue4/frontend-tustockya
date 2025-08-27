import React from 'react';

export const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 p-6 animate-pulse">
    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
      ))}
    </div>
    
    {/* Content Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-200 h-64 rounded-lg"></div>
      <div className="bg-gray-200 h-64 rounded-lg"></div>
    </div>
    
    {/* Table Skeleton */}
    <div className="bg-white rounded-lg border">
      <div className="bg-gray-200 h-12 rounded-t-lg"></div>
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-gray-100 h-8 rounded"></div>
        ))}
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border animate-pulse">
    <div className="bg-gray-200 h-12 rounded-t-lg"></div>
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <div key={i} className="bg-gray-100 h-12 rounded"></div>
      ))}
    </div>
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg border p-6 animate-pulse">
    <div className="bg-gray-200 h-6 w-1/3 rounded mb-4"></div>
    <div className="space-y-3">
      <div className="bg-gray-100 h-4 rounded"></div>
      <div className="bg-gray-100 h-4 w-2/3 rounded"></div>
      <div className="bg-gray-100 h-4 w-1/2 rounded"></div>
    </div>
  </div>
);