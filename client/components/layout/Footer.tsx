import React from "react";
import Link from "next/link";
import { FaDroplet, FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { MdOutlineEmail, MdOutlinePhone, MdOutlineLocationOn } from "react-icons/md";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "About", href: "/#about" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

const socialLinks = [
  { icon: FaGithub, href: "https://github.com/Kartik01032005/Major-Project", label: "GitHub" },
  { icon: FaLinkedin, href: "#", label: "LinkedIn" },
  { icon: FaXTwitter, href: "#", label: "X / Twitter" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="bg-slate-950 text-slate-400"
      role="contentinfo"
      aria-label="Site footer"
    >
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-600/60 to-transparent" />

      <div className="container-custom py-14 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* ── Brand Column ────────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-5">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <FaDroplet
                size={18}
                className="text-red-500 group-hover:text-red-400 transition-colors"
                aria-hidden="true"
              />
              <span className="text-[17px] font-bold text-white tracking-tight">
                Blood<span className="text-red-500">Link</span>
              </span>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Connecting blood donors, blood banks, and hospitals in
              real time — because every second matters during a medical
              emergency.
            </p>

            <ul className="space-y-2.5" role="list" aria-label="Contact information">
              {[
                { icon: MdOutlineEmail, text: "support@bloodlink.in", href: "mailto:support@bloodlink.in" },
                { icon: MdOutlinePhone, text: "+91 1800-000-0000", href: "tel:+911800000000" },
                { icon: MdOutlineLocationOn, text: "Mysore, Karnataka, India", href: undefined },
              ].map(({ icon: Icon, text, href }) => (
                <li key={text} className="flex items-center gap-2.5">
                  <Icon size={15} className="text-red-500/70 shrink-0" aria-hidden="true" />
                  {href ? (
                    <a href={href} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {text}
                    </a>
                  ) : (
                    <span className="text-sm">{text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Quick Links ──────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-500">
              Navigation
            </h3>
            <ul className="space-y-2.5" role="list">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Legal + Social ───────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-500">
                Legal
              </h3>
              <ul className="space-y-2.5" role="list">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-500">
                Follow us
              </h3>
              <div className="flex gap-2.5">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={[
                      "w-9 h-9 flex items-center justify-center rounded-xl",
                      "bg-slate-900 border border-slate-800",
                      "text-slate-400 hover:text-white hover:bg-red-600 hover:border-red-600",
                      "transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                    ].join(" ")}
                  >
                    <Icon size={15} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Bar ─────────────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            © {year} BloodLink. All rights reserved.
          </p>
          <p className="text-xs text-slate-600">
            Built with ❤️ by{" "}
            <a
              href="https://github.com/Kartik01032005"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              Kartik Nilekani
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
