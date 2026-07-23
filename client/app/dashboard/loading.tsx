import React from "react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Banner Skeleton */}
      <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    </div>
  );
}
