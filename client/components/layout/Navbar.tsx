"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMenu,
  FiX,
  FiArrowRight,
  FiMapPin,
  FiHome,
  FiMap,
  FiInfo,
  FiGrid,
  FiUser,
  FiAlertCircle,
  FiList,
  FiBell,
  FiSettings,
  FiPackage,
  FiCrosshair,
} from "react-icons/fi";
import { FaDroplet } from "react-icons/fa6";
import { BiSolidDroplet } from "react-icons/bi";
import Button from "@/components/ui/Button";
import { useAuth, useTranslation } from "@/context";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const dashboardHref = user?.role === "admin" ? "/dashboard/admin" : "/dashboard";
  const userInitials = user?.name
    ? (() => {
        const parts = user.name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return "?";
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      })()
    : "?";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      return window.location.hash;
    }
    return "";
  });
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Synchronize active section with URL hash and homepage scroll position
  useEffect(() => {
    if (pathname !== "/") return;

    const syncSectionFromHash = () => {
      const hash = window.location.hash;
      if (hash === "#how-it-works" || hash === "#about") {
        setActiveSection(hash);
      } else {
        setActiveSection("");
      }
    };

    const onScroll = () => {
      setScrolled(window.scrollY > 16);

      // Homepage scroll spy for sections
      if (window.scrollY < 200 && !window.location.hash) {
        setActiveSection("");
        return;
      }

      const sections = ["about", "how-it-works"];
      const scrollPosition = window.scrollY + 160;

      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && scrollPosition >= el.offsetTop) {
          setActiveSection(`#${id}`);
          return;
        }
      }

      if (window.scrollY < 200) {
        setActiveSection("");
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", syncSectionFromHash);
    window.addEventListener("popstate", syncSectionFromHash);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", syncSectionFromHash);
      window.removeEventListener("popstate", syncSectionFromHash);
    };
  }, [pathname]);

  const isLinkActive = (href: string) => {
    if (pathname === "/nearby") {
      return href === "/nearby";
    }
    if (pathname === "/") {
      if (activeSection === "#how-it-works") return href === "/#how-it-works";
      if (activeSection === "#about") return href === "/#about";
      return href === "/";
    }
    return pathname === href;
  };

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setMobileOpen(false);
    if (pathname === "/") {
      e.preventDefault();
      if (window.location.hash) {
        window.history.pushState(null, "", "/");
        setActiveSection("");
      }
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      const hero = document.getElementById("home") || document.getElementById("main-content");
      if (hero) {
        hero.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const navLinks = [
    {
      label: t("nav_home"),
      href: "/",
      mobileIcon: <FiHome size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
    {
      label: t("nav_nearby"),
      href: "/nearby",
      desktopIcon: <FiMapPin size={15} className="text-red-600 shrink-0" aria-hidden="true" />,
      mobileIcon: <FiMapPin size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
    {
      label: t("nav_how_it_works"),
      href: "/#how-it-works",
      mobileIcon: <FiMap size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
    {
      label: t("nav_about"),
      href: "/#about",
      mobileIcon: <FiInfo size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
  ];

  const dashboardNavLinks = user?.role === "admin" ? [
    {
      label: t("sidebar_overview") || "Overview",
      href: "/dashboard/admin",
      icon: <FiGrid size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
    {
      label: t("sidebar_blood_inventory") || "Blood Inventory",
      href: "/dashboard/admin/inventory",
      icon: <FiPackage size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
    {
      label: t("sidebar_hospitals") || "Hospitals",
      href: "/dashboard/admin/hospitals",
      icon: <FiCrosshair size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
    {
      label: t("sidebar_emergency_requests") || "Emergency Requests",
      href: "/dashboard/admin/requests",
      icon: <FiAlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
    {
      label: t("sidebar_settings") || "Settings",
      href: "/dashboard/settings",
      icon: <FiSettings size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
  ] : [
    {
      label: t("sidebar_overview") || "Overview",
      href: "/dashboard",
      icon: <FiGrid size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
    {
      label: t("sidebar_my_profile") || "My Profile",
      href: "/dashboard/profile",
      icon: <FiUser size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
    {
      label: t("sidebar_emergency_request") || "Emergency Request",
      href: "/dashboard/emergency",
      icon: <FiAlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
    {
      label: t("sidebar_my_requests") || "My Requests",
      href: "/dashboard/requests",
      icon: <FiList size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
    {
      label: t("sidebar_notifications") || "Notifications",
      href: "/dashboard/notifications",
      icon: <FiBell size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
    {
      label: t("sidebar_nearby_banks") || "Nearby Banks",
      href: "/dashboard/nearby",
      icon: <FiMap size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
    {
      label: t("sidebar_settings") || "Settings",
      href: "/dashboard/settings",
      icon: <FiSettings size={18} className="text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />,
    },
  ];

  useEffect(() => {
    if (mobileOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileOpen]);

  const isHome = pathname === "/";
  const isDashboard = pathname?.startsWith("/dashboard");
  const hasSolidNav = !isHome || scrolled;

  return (
    <>
      <header
        role="banner"
        className={[
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          isDashboard ? "max-md:hidden" : "",
          hasSolidNav
            ? "bg-white/72 dark:bg-slate-950/72 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-xs"
            : "bg-transparent border-b border-transparent",
        ].join(" ")}
      >
        <div className="container-custom navbar-container max-sm:px-3">
          <nav
            className="flex items-center justify-between h-16"
            aria-label="Main navigation"
          >
            {/* ── Logo ─────────────────────────────────────────── */}
            <Link
              href="/"
              onClick={handleHomeClick}
              className="flex shrink-0 items-center gap-2 sm:gap-2.5 group outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg"
              aria-label="BloodLink – Home"
            >
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-sm shrink-0"
                aria-hidden="true"
              >
                <BiSolidDroplet size={15} className="text-white" />
              </div>
              <div className="flex items-baseline gap-0">
                <span className="text-[16px] sm:text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">
                  Blood
                </span>
                <span className="text-[16px] sm:text-[17px] font-bold tracking-tight text-red-600">
                  Link
                </span>
              </div>
            </Link>

            {/* ── Desktop Links ─────────────────────────────────── */}
            <ul className="hidden md:flex flex-1 min-w-0 items-center justify-center gap-0.5 px-4" role="list">
              {navLinks.map((link) => {
                const active = isLinkActive(link.href);
                return (
                  <li key={link.href} className="flex-none">
                    <Link
                      href={link.href}
                      onClick={link.href === "/" ? handleHomeClick : undefined}
                      className={[
                        "relative inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 outline-none",
                        "focus-visible:ring-2 focus-visible:ring-red-500",
                        active
                          ? "text-red-600 dark:text-red-400"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/70",
                      ].join(" ")}
                    >
                      {link.desktopIcon}
                      <span>{link.label}</span>
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
            <div className="hidden md:flex shrink-0 items-center gap-3 whitespace-nowrap">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("bloodlink:toggle-chatbot"));
                  }
                }}
                id="navbar-ai-assistant-btn"
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-900 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
                aria-label="BloodLink AI Assistant"
                title="BloodLink AI Assistant"
              >
                <span className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0">
                  <BiSolidDroplet size={11} />
                </span>
                <span>AI Assistant</span>
              </button>

              {user ? (
                <>
                  <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {t("nav_hello")}{" "}
                    <span className="font-semibold text-slate-900 dark:text-white">{user.name.split(" ")[0]}</span>
                  </span>
                  <Link
                    href={dashboardHref}
                    id="nav-dashboard-btn"
                    className={[
                      "inline-flex items-center justify-center h-9 px-4 rounded-full border border-red-600/40",
                      "bg-red-50/50 hover:bg-red-100/70 dark:bg-red-950/30 dark:hover:bg-red-950/50",
                      "text-slate-900 dark:text-white text-xs font-semibold transition-all duration-150",
                      "hover:border-red-600 active:scale-95 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                    ].join(" ")}
                    aria-label={t("nav_dashboard") || "Dashboard"}
                  >
                    <span>{t("nav_dashboard") || "Dashboard"}</span>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => { logout(); router.push("/"); }}>
                    {t("nav_sign_out")}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" href="/login">
                    {t("nav_sign_in")}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    href="/register"
                    icon={<FiArrowRight size={13} />}
                    iconPosition="right"
                  >
                    {t("nav_get_started")}
                  </Button>
                </>
              )}
            </div>

            {/* ── Mobile Right Actions & Hamburger ─────────────────── */}
            <div className="md:hidden flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("bloodlink:toggle-chatbot"));
                  }
                }}
                id="mobile-navbar-ai-btn"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
                aria-label="BloodLink AI Assistant"
                title="BloodLink AI Assistant"
              >
                <BiSolidDroplet size={14} />
              </button>
              {user ? (
                <>
                  <span className="hidden min-[360px]:inline-flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[80px] min-[390px]:max-w-[110px]">
                    <span className="truncate">
                      {t("nav_hello")}{" "}
                      <strong className="font-semibold text-slate-900 dark:text-white">
                        {user.name.split(" ")[0]}
                      </strong>
                    </span>
                  </span>
                  <Link
                    href={dashboardHref}
                    id="mobile-nav-dashboard-btn"
                    className={[
                      "inline-flex items-center justify-center h-8 px-3 rounded-full text-xs font-semibold transition-all duration-150 outline-none shrink-0",
                      "text-slate-900 dark:text-white border border-red-600/40 hover:border-red-600 bg-red-50/50 dark:bg-red-950/40 hover:bg-red-100/60",
                      "active:scale-95 focus-visible:ring-2 focus-visible:ring-red-500",
                    ].join(" ")}
                    aria-label={t("nav_dashboard") || "Dashboard"}
                  >
                    <span>{t("nav_dashboard") || "Dashboard"}</span>
                  </Link>
                </>
              ) : null}
              <button
                id="mobile-menu-toggle"
                suppressHydrationWarning
                className={[
                  "w-9 h-9 flex items-center justify-center rounded-lg transition-colors shrink-0",
                  "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
                  "dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                ].join(" ")}
                onClick={() => setMobileOpen((p) => !p)}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
                aria-label={mobileOpen ? t("nav_close_menu") : t("nav_open_menu")}
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
            </div>
          </nav>
        </div>
      </header>

      {/* ── Mobile Overlay ──────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && !isDashboard && (
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
                "fixed top-0 right-0 z-50 w-[290px] sm:w-[320px]",
                "h-screen h-[100dvh] max-h-[100dvh]",
                "bg-white dark:bg-slate-950",
                "border-l border-slate-200 dark:border-slate-800",
                "flex flex-col shadow-2xl md:hidden",
              ].join(" ")}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <Link
                  href="/"
                  onClick={handleHomeClick}
                  className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg"
                  aria-label="BloodLink – Home"
                >
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0 shadow-sm" aria-hidden="true">
                    <BiSolidDroplet size={13} />
                  </div>
                  <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                    Blood<span className="text-red-600">Link</span>
                  </span>
                </Link>
                <button
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => setMobileOpen(false)}
                  aria-label={t("nav_close_menu")}
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Drawer Links */}
              <nav
                className="flex-1 overflow-y-auto min-h-0 p-3 overscroll-contain space-y-3"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {/* ── Site Links ── */}
                <div className="space-y-1">
                  <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Menu
                  </div>
                  {navLinks.map((link, i) => {
                    const active = isLinkActive(link.href);
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 + 0.05 }}
                      >
                        <Link
                          href={link.href}
                          className={[
                            "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                            active
                              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-semibold"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
                          ].join(" ")}
                          onClick={(e) => {
                            if (link.href === "/") {
                              handleHomeClick(e);
                              return;
                            }
                            if (link.href.includes("#")) {
                              setActiveSection(link.href.replace("/", ""));
                            } else {
                              setActiveSection("");
                            }
                            setMobileOpen(false);
                          }}
                        >
                          <span className="w-5 flex items-center justify-center shrink-0">
                            {link.mobileIcon}
                          </span>
                          <span className="leading-snug">{link.label}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                  {/* ── Dashboard Links ── */}
                  {dashboardNavLinks.map((item, i) => {
                    const active = pathname === item.href;
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (navLinks.length + i) * 0.03 + 0.1 }}
                      >
                        <Link
                          href={item.href}
                          className={[
                            "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                            active
                              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-semibold"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
                          ].join(" ")}
                          onClick={() => setMobileOpen(false)}
                        >
                          <span className="w-5 flex items-center justify-center shrink-0">
                            {item.icon}
                          </span>
                          <span className="leading-snug">{item.label}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* ── AI Assistant ── */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("bloodlink:open-chatbot"));
                      }
                    }}
                    className="group flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white shrink-0 shadow-sm" aria-hidden="true">
                      <BiSolidDroplet size={11} />
                    </div>
                    <span className="leading-snug">BloodLink AI Assistant</span>
                  </button>
                </div>
              </nav>

              {/* Drawer Footer CTA */}
              <div
                className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 shrink-0"
                style={{
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
                }}
              >
                {user ? (
                  <>
                    <Link
                      href={dashboardHref}
                      id="drawer-nav-dashboard-btn"
                      className="w-full inline-flex items-center justify-center h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors shadow-xs active:scale-95"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span>{t("nav_dashboard") || "Dashboard"}</span>
                    </Link>
                    <Button variant="outline" size="md" onClick={() => { logout(); setMobileOpen(false); router.push("/"); }} fullWidth>
                      {t("nav_sign_out")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="md" href="/login" fullWidth onClick={() => setMobileOpen(false)}>
                      {t("nav_sign_in")}
                    </Button>
                    <Button variant="primary" size="md" href="/register" fullWidth onClick={() => setMobileOpen(false)}>
                      {t("nav_get_started_free")}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
