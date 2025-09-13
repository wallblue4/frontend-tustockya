import React from 'react';

export const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6 p-6 animate-pulse bg-background">
    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-muted/30 h-24 rounded-lg"></div>
      ))}
    </div>
    
    {/* Content Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-muted/30 h-64 rounded-lg"></div>
      <div className="bg-muted/30 h-64 rounded-lg"></div>
    </div>
    
    {/* Table Skeleton */}
    <div className="bg-card rounded-lg border border-border">
      <div className="bg-muted/30 h-12 rounded-t-lg"></div>
      <div className="space-y-2 p-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-muted/20 h-8 rounded"></div>
        ))}
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="bg-card rounded-lg border border-border animate-pulse">
    <div className="bg-muted/30 h-12 rounded-t-lg"></div>
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <div key={i} className="bg-muted/20 h-12 rounded"></div>
      ))}
    </div>
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-card rounded-lg border border-border p-6 animate-pulse">
    <div className="bg-muted/30 h-6 w-1/3 rounded mb-4"></div>
    <div className="space-y-3">
      <div className="bg-muted/20 h-4 rounded"></div>
      <div className="bg-muted/20 h-4 w-2/3 rounded"></div>
      <div className="bg-muted/20 h-4 w-1/2 rounded"></div>
    </div>
  </div>
);