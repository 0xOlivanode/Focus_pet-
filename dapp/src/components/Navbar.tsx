"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { HelpCircle, User, Share2, Menu, X } from "lucide-react";
import { SoundMenu } from "./SoundMenu";
import { StreakFlame } from "./StreakFlame";
import { PrivyConnectButton } from "./PrivyConnectButton";
import { useFocusPet } from "@/hooks/useFocusPet";
import { useAudio } from "@/hooks/useAudio";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { AccountModal } from "./AccountModal";

const C = {
  bg: "#FAF7F2",
  border: "#E8E0D5",
  surface: "#F0EBE3",
  text: "#1C1A16",
  muted: "#7A7067",
  orange: "#E05C28",
  orangeLight: "#FFF0EA",
};

const FD = "var(--font-syne), var(--font-geist-sans)";

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

  const iconBtn = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: C.surface,
    border: `1px solid ${C.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: C.muted,
    flexShrink: 0,
  } as React.CSSProperties;

  return (
    <>
      <header
        style={{
          background: C.bg,
          borderBottom: `1px solid ${C.border}`,
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 20px",
            height: 58,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <img
              src="/focus-pet-logo.jpeg"
              alt="FocusPet"
              style={{ width: 30, height: 30, borderRadius: "50%", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}
            />
            <span
              style={{
                fontFamily: FD,
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: "-0.02em",
                color: C.text,
              }}
            >
              FocusPet
            </span>
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StreakFlame count={streak} />

            {/* Desktop-only */}
            <div className="hidden sm:flex items-center" style={{ gap: 8 }}>
              {onOpenOnboarding && (
                <button
                  onClick={() => { onOpenOnboarding(); playSound("click"); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 99,
                    background: C.orangeLight,
                    border: `1px solid #F4C9B3`,
                    color: C.orange,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <HelpCircle size={13} />
                  <span>How to Play</span>
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    style={{ width: 5, height: 5, borderRadius: "50%", background: C.orange, display: "inline-block" }}
                  />
                </button>
              )}

              <SoundMenu />

              {onOpenProfile && (
                <button
                  onClick={() => { onOpenProfile(); playSound("click"); }}
                  style={iconBtn}
                  title="Edit Profile"
                >
                  <User size={15} />
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
                style={iconBtn}
                title="Copy Invite Link"
              >
                <Share2 size={15} />
              </button>
            </div>

            <PrivyConnectButton
              onOpenAccount={() => {
                setIsAccountModalOpen(true);
                playSound("click");
              }}
            />

            {/* Mobile menu toggle — wrapper handles visibility so button keeps display:flex */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={iconBtn}
              >
                {isMobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "absolute",
                top: 62,
                right: 16,
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                boxShadow: "0 8px 32px rgba(28,26,22,0.12)",
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                zIndex: 50,
                minWidth: 200,
              }}
            >
              {onOpenOnboarding && (
                <button
                  onClick={() => { onOpenOnboarding(); playSound("click"); setIsMobileMenuOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 12,
                    background: C.orangeLight, color: C.orange,
                    fontSize: 13, fontWeight: 700,
                    border: "none", cursor: "pointer", width: "100%", textAlign: "left",
                  }}
                >
                  <HelpCircle size={16} />
                  How to Play
                </button>
              )}

              {onOpenProfile && (
                <button
                  onClick={() => { onOpenProfile(); playSound("click"); setIsMobileMenuOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 12,
                    color: C.text, fontSize: 13, fontWeight: 600,
                    background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left",
                  }}
                >
                  <User size={16} />
                  Edit Profile
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
                  }
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 12,
                  color: C.text, fontSize: 13, fontWeight: 600,
                  background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left",
                }}
              >
                <Share2 size={16} />
                Invite Friend
              </button>

              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "flex-end",
                  padding: "6px 10px 2px",
                  borderTop: `1px solid ${C.border}`, marginTop: 2,
                }}
              >
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
