"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useIsMiniPay } from "@/hooks/useMiniPay";
import {
  HelpCircle,
  User,
  Share2,
  Menu,
  X,
  History,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { SoundMenu } from "./SoundMenu";
import { StreakFlame } from "./StreakFlame";
import { PrivyConnectButton } from "./PrivyConnectButton";
import { useFocusPet } from "@/hooks/useFocusPet";
import { useAudio } from "@/hooks/useAudio";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { AccountModal } from "./AccountModal";
import { MiniPayAccountModal } from "./MiniPayAccountModal";
import { NotificationBell } from "./NotificationBell";

interface NavbarProps {
  onOpenOnboarding?: () => void;
  onOpenProfile?: () => void;
}

export function Navbar({ onOpenOnboarding, onOpenProfile }: NavbarProps) {
  const { address } = useAccount();
  const { streak } = useFocusPet();
  const { playSound } = useAudio();
  const isMiniPay = useIsMiniPay();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isMiniPayModalOpen, setIsMiniPayModalOpen] = useState(false);

  function closeMenu() {
    setIsMobileMenuOpen(false);
  }

  function copyInvite() {
    if (!address) {
      toast.error("Connect your wallet first.");
      return;
    }
    // In MiniPay: use the native share sheet — it's a full invite flow
    if (isMiniPay) {
      window.location.href = "https://link.minipay.xyz/invite_friends";
      return;
    }
    const link = `${window.location.origin}/?ref=${address}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
    playSound("click");
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-neutral-100 dark:border-neutral-900 bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 md:px-12 lg:px-20 h-14 sm:h-16 flex items-center justify-between gap-2">

          {/* Left — Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/focus-pet-logo.jpeg"
              className="rounded-full h-8 w-8 shadow-sm"
              alt="FocusPet"
            />
            <span className="font-black text-base tracking-tight hidden sm:block">
              FocusPet
            </span>
          </Link>

          {/* Right — Actions */}
          <div className="flex items-center gap-1.5">

            {/* Streak — always visible */}
            <StreakFlame count={streak} />

            {/* Desktop-only actions */}
            <div className="hidden sm:flex items-center gap-1.5">
              {address && (
                <NavIconBtn href="/app/history" title="History">
                  <History size={17} />
                </NavIconBtn>
              )}
              <NavIconBtn href="/app/leaderboard" title="Leaderboard">
                <Trophy size={17} />
              </NavIconBtn>
              {onOpenOnboarding && (
                <button
                  onClick={() => { onOpenOnboarding(); playSound("click"); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all font-bold text-xs"
                  title="How to Play"
                >
                  <HelpCircle size={15} />
                  <span>Guide</span>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
                  </span>
                </button>
              )}
              {!isMiniPay && <NotificationBell />}
              {!isMiniPay && <ThemeToggle />}
              {!isMiniPay && <SoundMenu />}
              {onOpenProfile && (
                <NavBtn onClick={() => { onOpenProfile(); playSound("click"); }} title="Edit Profile">
                  <User size={17} />
                </NavBtn>
              )}
              <NavBtn onClick={copyInvite} title="Invite Friend" accent>
                <Share2 size={17} />
              </NavBtn>
            </div>

            {/* Mobile — notification bell only outside MiniPay */}
            {!isMiniPay && (
              <div className="sm:hidden">
                <NotificationBell />
              </div>
            )}

            {/* Wallet button — address pill in MiniPay, Privy button otherwise */}
            {isMiniPay ? (
              address ? (
                <button
                  onClick={() => { setIsMiniPayModalOpen(true); playSound("click"); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-full font-bold text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shadow-sm"
                >
                  <div className="w-3 h-3 rounded-full bg-linear-to-r from-indigo-500 to-purple-500 shadow-sm shrink-0" />
                  <span className="font-mono">
                    {address.slice(0, 4)}…{address.slice(-3)}
                  </span>
                </button>
              ) : null
            ) : (
              <PrivyConnectButton
                onOpenAccount={() => {
                  setIsAccountModalOpen(true);
                  playSound("click");
                }}
              />
            )}

            {/* Hamburger — mobile only, hidden in MiniPay */}
            {!isMiniPay && (
              <button
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                className="sm:hidden p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                aria-label="Menu"
              >
                {isMobileMenuOpen
                  ? <X key="close" size={18} />
                  : <Menu key="open" size={18} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="sm:hidden border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#0a0a0b] px-4 py-3 flex flex-col gap-1"
            >
              {/* Nav links */}
              {address && (
                <MobileMenuItem
                  icon={<History size={17} />}
                  label="Focus History"
                  href="/app/history"
                  onClick={closeMenu}
                />
              )}
              <MobileMenuItem
                icon={<Trophy size={17} />}
                label="Leaderboard"
                href="/app/leaderboard"
                onClick={closeMenu}
              />
              {onOpenOnboarding && (
                <MobileMenuItem
                  icon={<HelpCircle size={17} />}
                  label="How to Play"
                  onClick={() => { onOpenOnboarding(); playSound("click"); closeMenu(); }}
                  accent
                />
              )}
              {onOpenProfile && (
                <MobileMenuItem
                  icon={<User size={17} />}
                  label="Edit Profile"
                  onClick={() => { onOpenProfile(); playSound("click"); closeMenu(); }}
                />
              )}
              <MobileMenuItem
                icon={<Share2 size={17} />}
                label="Invite a Friend"
                onClick={() => { copyInvite(); closeMenu(); }}
              />

              {/* Divider + toggles */}
              <div className="flex items-center gap-2 pt-2 mt-1 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mr-auto">
                  Preferences
                </span>
                <ThemeToggle />
                <SoundMenu />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
      <MiniPayAccountModal
        isOpen={isMiniPayModalOpen}
        onClose={() => setIsMiniPayModalOpen(false)}
      />
    </>
  );
}

/* ── small helper components ── */

function NavIconBtn({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={title}
      className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
    >
      {children}
    </Link>
  );
}

function NavBtn({
  onClick,
  title,
  accent,
  children,
}: {
  onClick: () => void;
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-xl transition-colors ${
        accent
          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

function MobileMenuItem({
  icon,
  label,
  href,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  const cls = `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors w-full text-left ${
    accent
      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
  }`;

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cls}>
        {icon}
        {label}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {icon}
      {label}
    </button>
  );
}
