"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  HelpCircle,
  User,
  History,
  Trophy,
  ShoppingBag,
  Home,
  Zap,
} from "lucide-react";
import { getCompetitionStatus, type CompetitionStatus } from "@/config/competition";
import Link from "next/link";
import { SoundMenu } from "./SoundMenu";
import { useAudio } from "@/hooks/useAudio";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const MiniPayAccountModal = dynamic(
  () => import("./MiniPayAccountModal").then((m) => m.MiniPayAccountModal),
  { ssr: false },
);

interface NavbarProps {
  onOpenProfile?: () => void;
  minimal?: boolean;
}

const NAV_LINKS = [
  { label: "Shop", href: "/app/shop" },
  { label: "Leaderboard", href: "/app/leaderboard" },
  { label: "Activities", href: "/app/activities" },
  { label: "Guide", href: "/app/guide" },
];

const MOBILE_LINKS = [
  { label: "Home", href: "/app", icon: <Home size={16} /> },
  { label: "Shop", href: "/app/shop", icon: <ShoppingBag size={16} /> },
  { label: "Leaderboard", href: "/app/leaderboard", icon: <Trophy size={16} /> },
  { label: "Activities", href: "/app/activities", icon: <History size={16} /> },
  { label: "Guide", href: "/app/guide", icon: <HelpCircle size={16} /> },
];

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <div className="w-5 h-4 flex flex-col justify-between">
      <motion.span
        animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="block h-[1.5px] w-full bg-white origin-center"
      />
      <motion.span
        animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.15 }}
        className="block h-[1.5px] w-full bg-white"
      />
      <motion.span
        animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="block h-[1.5px] w-full bg-white origin-center"
      />
    </div>
  );
}

function WalletButton({ address, onClick }: { address: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 bg-neutral-100 text-neutral-900 rounded-full font-mono text-xs hover:bg-white transition-colors"
    >
      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
      {address.slice(0, 6)}…{address.slice(-3)}
    </button>
  );
}

export function Navbar({ onOpenProfile, minimal }: NavbarProps) {
  const { address } = useAuth();
  const { playSound } = useAudio();
  const [compStatus, setCompStatus] = useState<CompetitionStatus>(getCompetitionStatus);
  const showBlitz = compStatus === "upcoming" || compStatus === "live";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setCompStatus(getCompetitionStatus()), 30_000);
    return () => clearInterval(id);
  }, []);

  function closeMenu() { setIsMobileMenuOpen(false); }

  if (minimal) {
    return (
      <>
        <div className="h-[72px] lg:h-[102px]" aria-hidden="true" />
        <header className="fixed top-0 left-0 right-0 z-50 w-full bg-black border-b border-neutral-900">
          <div className="px-5 sm:px-10 lg:px-[80px] flex items-center justify-between">
            <img src="/focus-pet-logo.svg" alt="logo" className="w-[140px] lg:w-[200px]" />
            <div className="flex items-center gap-3">
              {address && (
                <WalletButton address={address} onClick={() => { setIsModalOpen(true); playSound("click"); }} />
              )}
            </div>
          </div>
        </header>
        <MiniPayAccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="h-[72px] lg:h-[102px]" aria-hidden="true" />
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-black border-b border-neutral-900">
        <div className="px-5 sm:px-10 lg:px-[80px] flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-x-2 shrink-0">
            <img src="/focus-pet-logo.svg" alt="" className="w-[140px] lg:w-[200px]" />
          </Link>

          <div className="flex items-center gap-x-2">
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/app" className="px-6 py-5 text-sm text-neutral-300 hover:text-white transition-colors font-outfit">
                Home
              </Link>
              {NAV_LINKS.map((l) => (
                <Link key={l.label} href={l.href} className="px-6 py-5 text-sm text-neutral-300 hover:text-white transition-colors font-outfit">
                  {l.label}
                </Link>
              ))}
              {showBlitz && (
                <Link
                  href="/app/competition"
                  className="relative ml-1 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-black transition-all font-outfit"
                  style={{ background: "linear-gradient(135deg, #C48E57 0%, #d4a26a 100%)", color: "#000" }}
                >
                  <Zap size={13} fill="currentColor" />
                  Blitz
                  {compStatus === "live" && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#01FF8B] border-2 border-black animate-pulse" />
                  )}
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-3">
              {onOpenProfile && (
                <button
                  onClick={() => { onOpenProfile(); playSound("click"); }}
                  className="hidden md:flex w-9 h-9 items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                  aria-label="Edit profile"
                >
                  <User size={16} />
                </button>
              )}

              {address && (
                <WalletButton address={address} onClick={() => { setIsModalOpen(true); playSound("click"); }} />
              )}

              <button
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                className="md:hidden p-2 -mr-1"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                <HamburgerIcon open={isMobileMenuOpen} />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden overflow-hidden border-t border-neutral-900 bg-black"
            >
              <div className="px-5 py-4 flex flex-col gap-0.5">
                {showBlitz && (
                  <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0, duration: 0.2 }}>
                    <Link
                      href="/app/competition"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-black transition-colors"
                      style={{ color: "#C48E57" }}
                    >
                      <Zap size={16} fill="currentColor" />
                      Focus Blitz
                      {compStatus === "live" && (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-[#01FF8B] bg-[#01FF8B15] px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#01FF8B] animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </Link>
                  </motion.div>
                )}
                {MOBILE_LINKS.map((l, i) => (
                  <motion.div
                    key={l.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (i + (showBlitz ? 1 : 0)) * 0.05, duration: 0.2 }}
                  >
                    <Link
                      href={l.href}
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
                    >
                      {l.icon}
                      {l.label}
                    </Link>
                  </motion.div>
                ))}

                {onOpenProfile && (
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (MOBILE_LINKS.length + 1) * 0.05, duration: 0.2 }}
                  >
                    <button
                      onClick={() => { onOpenProfile(); playSound("click"); closeMenu(); }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors text-left"
                    >
                      <User size={16} />
                      Edit Profile
                    </button>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 pt-3 mt-2 border-t border-neutral-900"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mr-auto">
                    Preferences
                  </span>
                  <SoundMenu />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <MiniPayAccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
