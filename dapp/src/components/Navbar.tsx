"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { HelpCircle, User, Share2, Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { SoundMenu } from "./SoundMenu";
import { StreakFlame } from "./StreakFlame";
import { PrivyConnectButton } from "./PrivyConnectButton";
import { useFocusPet } from "@/hooks/useFocusPet";
import { useAudio } from "@/hooks/useAudio";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { AccountModal } from "./AccountModal";

interface NavbarProps {
  onOpenOnboarding?: () => void;
  onOpenProfile?: () => void;
}

export function Navbar({ onOpenOnboarding, onOpenProfile }: NavbarProps) {
  const { address } = useAccount();
  const { streak } = useFocusPet();
  const { playSound } = useAudio();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  return (
    <>
      <header className="p-3 sm:p-4 px-3 sm:px-6 md:px-12 lg:px-20 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900 w-full max-w-[1400px] mx-auto relative z-50">
        <div className="flex items-center gap-2 shrink-0">
          <img
            src="/focus-pet-logo.jpeg"
            className="rounded-full h-8 w-8 sm:h-10 sm:w-10 shadow-sm"
            alt="FocusPet Logo"
          />
          <h1 className="font-bold text-base sm:text-lg tracking-tight hidden sm:block">
            FocusPet
          </h1>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 text-sm font-medium">
          <StreakFlame count={streak} />

          <div className="hidden sm:flex items-center gap-2">
            {onOpenOnboarding && (
              <button
                onClick={() => {
                  onOpenOnboarding();
                  playSound("click");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all font-bold text-xs group"
                title="How to Play"
              >
                <HelpCircle size={16} />
                <span>How to Play</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
              </button>
            )}
            <ThemeToggle />
            <SoundMenu />
            {onOpenProfile && (
              <button
                onClick={() => {
                  onOpenProfile();
                  playSound("click");
                }}
                className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                title="Edit Profile"
              >
                <User size={18} />
              </button>
            )}
            <button
              onClick={() => {
                if (address) {
                  const link = `${window.location.origin}/?ref=${address}`;
                  navigator.clipboard.writeText(link);
                  toast.success("Invite link copied!");
                  playSound("click");
                } else {
                  toast.error("Please connect your wallet first.");
                }
              }}
              className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex shrink-0 items-center justify-center h-[36px] w-[36px]"
              title="Copy Invite Link"
            >
              <Share2 size={18} />
            </button>
          </div>

          <PrivyConnectButton 
            onOpenAccount={() => {
              setIsAccountModalOpen(true);
              playSound("click");
            }} 
          />

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-[60px] right-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-2 flex flex-col gap-2 sm:hidden backdrop-blur-md z-50"
            >
              {onOpenOnboarding && (
                <button
                  onClick={() => {
                    onOpenOnboarding();
                    playSound("click");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-sm w-full text-left"
                >
                  <HelpCircle size={18} />
                  <span>How to Play</span>
                </button>
              )}
              {onOpenProfile && (
                <button
                  onClick={() => {
                    onOpenProfile();
                    playSound("click");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold text-sm w-full text-left transition-colors"
                >
                  <User size={18} />
                  <span>Edit Profile</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (address) {
                    const link = `${window.location.origin}/?ref=${address}`;
                    navigator.clipboard.writeText(link);
                    toast.success("Invite link copied!");
                    playSound("click");
                    setIsMobileMenuOpen(false);
                  } else {
                    toast.error("Please connect your wallet first.");
                  }
                }}
                className="flex items-center gap-3 px-4 py-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-bold text-sm w-full text-left transition-colors"
              >
                <Share2 size={18} />
                <span>Invite Friend</span>
              </button>
              <div className="flex items-center justify-between gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-2 mt-1 px-2">
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
    </>
  );
}
