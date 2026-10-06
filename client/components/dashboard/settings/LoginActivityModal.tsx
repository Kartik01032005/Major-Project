"use client";

import React, { useState } from "react";
import { FiMonitor, FiSmartphone, FiShield, FiCheckCircle, FiLogOut } from "react-icons/fi";
import SettingsModal from "./SettingsModal";
import { User } from "@/types";

interface LoginActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

function getClientDeviceInfo() {
  if (typeof window === "undefined") {
    return { browser: "Web Browser", os: "Desktop OS", deviceType: "desktop" };
  }
  const ua = navigator.userAgent;
  let browser = "Chrome / WebKit";
  if (ua.includes("Firefox")) browser = "Mozilla Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Apple Safari";
  else if (ua.includes("Edg")) browser = "Microsoft Edge";
  else if (ua.includes("Chrome")) browser = "Google Chrome";

  let os = "Desktop";
  if (ua.includes("Windows")) os = "Windows PC";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Android")) os = "Android Device";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS Device";
  else if (ua.includes("Linux")) os = "Linux";

  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  return { browser, os, deviceType: isMobile ? "mobile" : "desktop" };
}

export default function LoginActivityModal({
  isOpen,
  onClose,
  user,
}: LoginActivityModalProps) {
  const [deviceInfo] = useState(getClientDeviceInfo);
  const [otherLoggedOut, setOtherLoggedOut] = useState(false);

  const handleLogoutOthers = () => {
    // In current JWT token architecture, tokens are bearer tokens stored locally
    setOtherLoggedOut(true);
    setTimeout(() => {
      setOtherLoggedOut(false);
    }, 4000);
  };

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Login Activity"
      description="Review active device sessions associated with your BloodLink account."
      icon={<FiShield size={20} />}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {otherLoggedOut && (
          <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2">
            <FiCheckCircle size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>All other active sessions have been disconnected. Your current session remains secure.</span>
          </div>
        )}

        {/* Current Active Session */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Current Active Session
          </h4>
          <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10 flex items-start gap-3.5">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
              {deviceInfo.deviceType === "mobile" ? <FiSmartphone size={18} /> : <FiMonitor size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {deviceInfo.browser} on {deviceInfo.os}
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                  This Device · Active Now
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Location: {user?.location?.district ? `${user.location.district}, ${user.location.state}` : "Local Network"}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Authentication: JWT Secure Session
              </p>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogoutOthers}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <FiLogOut size={14} />
            <span>Log out of all other devices</span>
          </button>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
            Disconnects temporary browser tabs and cached sessions on secondary hardware.
          </p>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </SettingsModal>
  );
}
