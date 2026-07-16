"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiArrowRight } from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import Button from "@/components/ui/Button";
import { NavLink } from "@/types";

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "About", href: "/#about" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header
        role="banner"
        className={[
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm"
            : "bg-transparent",
        ].join(" ")}
      >
        <div className="container-custom">
          <nav
            className="flex items-center justify-between h-16"
            aria-label="Main navigation"
          >
            {/* ── Logo ─────────────────────────────────────────── */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg"
              aria-label="BloodLink – Home"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="text-red-600 group-hover:text-red-700 transition-colors"
              >
                <FaDroplet size={20} aria-hidden="true" />
              </motion.div>
              <div className="flex items-baseline gap-0">
                <span className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">
                  Blood
                </span>
                <span className="text-[17px] font-bold tracking-tight text-red-600">
                  Link
                </span>
              </div>
            </Link>

            {/* ── Desktop Links ─────────────────────────────────── */}
            <ul className="hidden md:flex items-center gap-0.5" role="list">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={[
                        "relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 outline-none",
                        "focus-visible:ring-2 focus-visible:ring-red-500",
                        active
                          ? "text-red-600 dark:text-red-400"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/70",
                      ].join(" ")}
                    >
                      {link.label}
                      {active && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 bg-red-50 dark:bg-red-950/40 rounded-lg -z-10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* ── Desktop CTA ───────────────────────────────────── */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="sm" href="/login">
                Sign in
              </Button>
              <Button
                variant="primary"
                size="sm"
                href="/register"
                icon={<FiArrowRight size={13} />}
                iconPosition="right"
              >
                Get started
              </Button>
            </div>

            {/* ── Hamburger ─────────────────────────────────────── */}
            <button
              id="mobile-menu-toggle"
              className={[
                "md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors",
                "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                "dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
              ].join(" ")}
              onClick={() => setMobileOpen((p) => !p)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait">
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <FiX size={20} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="open"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <FiMenu size={20} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </nav>
        </div>
      </header>

      {/* ── Mobile Overlay ──────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
              aria-hidden="true"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              id="mobile-menu"
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className={[
                "fixed top-0 right-0 bottom-0 z-50 w-[280px]",
                "bg-white dark:bg-slate-950",
                "border-l border-slate-200 dark:border-slate-800",
                "flex flex-col shadow-2xl md:hidden",
              ].join(" ")}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FaDroplet size={18} className="text-red-600" aria-hidden="true" />
                  <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                    Blood<span className="text-red-600">Link</span>
                  </span>
                </div>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="flex-1 overflow-y-auto p-3">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 + 0.1 }}
                  >
                    <Link
                      href={link.href}
                      className={[
                        "flex items-center px-4 py-3 rounded-xl text-sm font-medium mb-1 transition-colors",
                        pathname === link.href
                          ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
                      ].join(" ")}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Drawer Footer CTA */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <Button variant="outline" size="md" href="/login" fullWidth>
                  Sign in
                </Button>
                <Button variant="primary" size="md" href="/register" fullWidth>
                  Get started free
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
