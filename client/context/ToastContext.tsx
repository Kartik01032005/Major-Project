"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiAlertTriangle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toast: {
    success: (message: string, options?: ToastOptions | string) => void;
    error: (message: string, options?: ToastOptions | string) => void;
    warning: (message: string, options?: ToastOptions | string) => void;
    info: (message: string, options?: ToastOptions | string) => void;
  };
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  warning: 5500,
  error: 6500,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const recentMessagesRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, options?: ToastOptions | string) => {
      if (!message || typeof message !== "string") return;

      const trimmedMessage = message.trim();
      const now = Date.now();
      const lastSeen = recentMessagesRef.current.get(trimmedMessage) || 0;

      // Deduplicate: prevent showing identical toasts within 2 seconds
      if (now - lastSeen < 2000) {
        return;
      }
      recentMessagesRef.current.set(trimmedMessage, now);

      // Clean up old entries from dedup cache
      if (recentMessagesRef.current.size > 20) {
        recentMessagesRef.current.forEach((time, msg) => {
          if (now - time > 10000) {
            recentMessagesRef.current.delete(msg);
          }
        });
      }

      const opts: ToastOptions =
        typeof options === "string" ? { title: options } : options || {};

      const duration = opts.duration ?? DEFAULT_DURATIONS[type];
      const id = `${now}-${Math.random().toString(36).substring(2, 7)}`;

      const newToast: ToastItem = {
        id,
        type,
        message: trimmedMessage,
        title: opts.title,
        duration,
        action: opts.action,
      };

      setToasts((prev) => {
        // Keep max 4 toasts visible at a time
        const next = [...prev, newToast];
        return next.slice(-4);
      });

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const toast = {
    success: useCallback(
      (msg: string, opts?: ToastOptions | string) => addToast("success", msg, opts),
      [addToast]
    ),
    error: useCallback(
      (msg: string, opts?: ToastOptions | string) => addToast("error", msg, opts),
      [addToast]
    ),
    warning: useCallback(
      (msg: string, opts?: ToastOptions | string) => addToast("warning", msg, opts),
      [addToast]
    ),
    info: useCallback(
      (msg: string, opts?: ToastOptions | string) => addToast("info", msg, opts),
      [addToast]
    ),
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss, dismissAll }}>
      {children}

      {/* Accessible Toast Container: positioned top-center on mobile, top-right on desktop */}
      <div
        className="fixed top-4 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-md z-[9999] pointer-events-none flex flex-col gap-2.5 items-center sm:items-end pt-[env(safe-area-inset-top,0px)]"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastCard
              key={t.id}
              toast={t}
              onDismiss={() => dismiss(t.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const isError = toast.type === "error";

  const config = {
    success: {
      icon: <FiCheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />,
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      accent: "bg-emerald-500",
      label: "Success",
    },
    error: {
      icon: <FiAlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />,
      badge: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      accent: "bg-red-500",
      label: "Error",
    },
    warning: {
      icon: <FiAlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />,
      badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      accent: "bg-amber-500",
      label: "Warning",
    },
    info: {
      icon: <FiInfo className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" aria-hidden="true" />,
      badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      accent: "bg-blue-500",
      label: "Information",
    },
  }[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      role={isError ? "alert" : "status"}
      aria-label={`${config.label}: ${toast.message}`}
      className={[
        "pointer-events-auto w-full sm:w-auto sm:min-w-[320px] sm:max-w-md",
        "flex items-start gap-3 p-3.5 sm:p-4 rounded-xl shadow-xl",
        "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md",
        "border border-slate-200/90 dark:border-slate-800",
        "text-slate-900 dark:text-slate-100",
        "focus-within:ring-2 focus-within:ring-red-500/40",
      ].join(" ")}
    >
      {/* Icon */}
      {config.icon}

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
            {toast.title}
          </h4>
        )}
        <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200 break-words">
          {toast.message}
        </p>

        {toast.action && (
          <button
            type="button"
            onClick={toast.action.onClick}
            className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 rounded"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Manual dismiss button */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        <FiX className="w-4 h-4" aria-hidden="true" />
      </button>
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
