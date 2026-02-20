"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  userLabel?: string | null;
  onSignOut?: () => void;
};

export default function SiteNav({ userLabel, onSignOut }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full relative z-50 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          <a href="https://ualgotrade.com" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border border-white/10 bg-slate-900 relative flex items-center justify-center text-cyan-300 font-bold">
                U2
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white leading-none">U2ALGO</span>
              <span className="text-[10px] sm:text-xs font-medium text-slate-400 tracking-wider sm:tracking-widest uppercase">
                GAMES
              </span>
            </div>
          </a>

          <div className="hidden sm:flex items-center gap-2 sm:gap-4">
            <a href="https://ualgotrade.com/indicators" className="px-3 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              Indicators
            </a>
            <a href="https://school.ualgotrade.com" className="px-3 py-2 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              School
            </a>
            <Link href="/" className="px-3 py-2 text-xs sm:text-sm font-semibold text-cyan-300 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              Games
            </Link>
            {userLabel ? (
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {(userLabel[0] || "?").toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-200 max-w-[140px] truncate">{userLabel}</span>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="sm:hidden p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="sm:hidden border-t border-white/5 py-3 space-y-1">
            <a
              href="https://ualgotrade.com/indicators"
              className="block px-4 py-3 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Indicators
            </a>
            <a
              href="https://school.ualgotrade.com"
              className="block px-4 py-3 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              School
            </a>
            <Link
              href="/"
              className="block px-4 py-3 text-sm font-semibold text-cyan-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Games
            </Link>

            {userLabel ? (
              <>
                <div className="px-4 py-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {(userLabel[0] || "?").toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-200 truncate">{userLabel}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOut?.();
                  }}
                  className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <a
                href="https://ualgotrade.com/auth"
                className="block px-4 py-3 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </a>
            )}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
