import React from "react";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-0 page-transition">
      {children}
    </div>
  );
}
