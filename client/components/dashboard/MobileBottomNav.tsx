"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiMapPin, FiList, FiSettings } from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { useAuth } from "@/context";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const homeHref = user?.role === "admin" ? "/dashboard/admin" : "/dashboard";
  const nearbyHref = "/dashboard/nearby";
  const requestHref = "/dashboard/emergency";
  const myRequestsHref = "/dashboard/requests";
  const settingsHref = "/dashboard/settings";

  // Active status matching
  const isHomeActive = pathname === homeHref;
  const isNearbyActive = pathname === nearbyHref || pathname.startsWith("/dashboard/nearby");
  const isRequestActive = pathname === requestHref || pathname.startsWith("/dashboard/emergency");
  const isMyRequestsActive = pathname === myRequestsHref || pathname.startsWith("/dashboard/requests");
  const isSettingsActive = pathname === settingsHref || pathname.startsWith("/dashboard/settings");

  return (
    <nav
      id="mobile-bottom-nav"
      role="navigation"
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
      style={{
        paddingBottom: "max(0.35rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="grid grid-cols-5 items-end max-w-lg mx-auto px-1 sm:px-2 py-1">
        {/* 1. Home */}
        <Link
          href={homeHref}
          id="mobile-nav-home"
          aria-label="Home"
          aria-current={isHomeActive ? "page" : undefined}
          className={[
            "flex flex-col items-center justify-center py-1 transition-colors group select-none min-w-0",
            isHomeActive
              ? "text-red-600 dark:text-red-400 font-semibold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium",
          ].join(" ")}
        >
          <span className="p-1 rounded-xl transition-transform group-active:scale-90">
            <FiHome
              size={20}
              className={isHomeActive ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}
            />
          </span>
          <span className="text-[10px] sm:text-[11px] leading-tight truncate max-w-full text-center">
            Home
          </span>
        </Link>

        {/* 2. Nearby */}
        <Link
          href={nearbyHref}
          id="mobile-nav-nearby"
          aria-label="Nearby"
          aria-current={isNearbyActive ? "page" : undefined}
          className={[
            "flex flex-col items-center justify-center py-1 transition-colors group select-none min-w-0",
            isNearbyActive
              ? "text-red-600 dark:text-red-400 font-semibold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium",
          ].join(" ")}
        >
          <span className="p-1 rounded-xl transition-transform group-active:scale-90">
            <FiMapPin
              size={20}
              className={isNearbyActive ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}
            />
          </span>
          <span className="text-[10px] sm:text-[11px] leading-tight truncate max-w-full text-center">
            Nearby
          </span>
        </Link>

        {/* 3. Request (Central Prominent Action) */}
        <Link
          href={requestHref}
          id="mobile-nav-request"
          aria-label="Request emergency blood"
          aria-current={isRequestActive ? "page" : undefined}
          className="flex flex-col items-center justify-center group select-none min-w-0 relative -top-2.5"
        >
          <span
            className={[
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-active:scale-95",
              "bg-gradient-to-br from-red-600 to-red-700 text-white shadow-red-600/35",
              "ring-4 ring-white dark:ring-slate-950",
              isRequestActive ? "ring-red-400/80 dark:ring-red-500/80 scale-105" : "",
            ].join(" ")}
          >
            <FaDroplet size={19} className="text-white drop-shadow-sm ml-px" />
          </span>
          <span
            className={[
              "text-[10px] sm:text-[11px] leading-tight mt-0.5 truncate max-w-full text-center",
              isRequestActive
                ? "text-red-600 dark:text-red-400 font-bold"
                : "text-slate-700 dark:text-slate-300 font-semibold",
            ].join(" ")}
          >
            Request
          </span>
        </Link>

        {/* 4. My Requests */}
        <Link
          href={myRequestsHref}
          id="mobile-nav-my-requests"
          aria-label="My Requests"
          aria-current={isMyRequestsActive ? "page" : undefined}
          className={[
            "flex flex-col items-center justify-center py-1 transition-colors group select-none min-w-0",
            isMyRequestsActive
              ? "text-red-600 dark:text-red-400 font-semibold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium",
          ].join(" ")}
        >
          <span className="p-1 rounded-xl transition-transform group-active:scale-90">
            <FiList
              size={20}
              className={isMyRequestsActive ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}
            />
          </span>
          <span className="text-[10px] sm:text-[11px] leading-tight truncate max-w-full text-center">
            My Requests
          </span>
        </Link>

        {/* 5. Settings */}
        <Link
          href={settingsHref}
          id="mobile-nav-settings"
          aria-label="Settings"
          aria-current={isSettingsActive ? "page" : undefined}
          className={[
            "flex flex-col items-center justify-center py-1 transition-colors group select-none min-w-0",
            isSettingsActive
              ? "text-red-600 dark:text-red-400 font-semibold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium",
          ].join(" ")}
        >
          <span className="p-1 rounded-xl transition-transform group-active:scale-90">
            <FiSettings
              size={20}
              className={isSettingsActive ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}
            />
          </span>
          <span className="text-[10px] sm:text-[11px] leading-tight truncate max-w-full text-center">
            Settings
          </span>
        </Link>
      </div>
    </nav>
  );
}
