"use client";

import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import {
  X, Copy, ArrowUpRight, ArrowDownLeft, Loader2, ExternalLink, ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { parseEther, parseUnits } from "viem";
import { useSendTransaction, useWriteContract } from "wagmi";
import toast from "react-hot-toast";
import { GOOD_DOLLAR_ADDRESSES } from "@/config/contracts";
import { ERC20ABI } from "@/config/abi";
import { useFocusPet } from "@/hooks/useFocusPet";

// ─── Design tokens (shared across new UI) ────────────────────────────────────
const C = {
  bg:          "#FAF7F2",
  surface:     "#FFFFFF",
  border:      "#EDE7DC",
  border2:     "#E0D9CE",
  text1:       "#1C1A16",
  text2:       "#8A8478",
  text3:       "#C4BDB3",
  orange:      "#E05C28",
  orangeLight: "#FEF0E8",
  green:       "#2E7A4F",
  greenLight:  "#EBF5EE",
} as const;

const FD = "var(--font-syne), var(--font-geist-sans)";
const EASE = [0.22, 1, 0.36, 1];

type View = "overview" | "send" | "receive";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountModal({ isOpen, onClose }: AccountModalProps) {
  const { address } = useAccount();
  const { user, logout } = usePrivy();
  const [view, setView]               = useState<View>("overview");
  const [recipient, setRecipient]     = useState("");
  const [amount, setAmount]           = useState("");
  const [token, setToken]             = useState<"CELO" | "G$">("CELO");

  const { deleteUser, isProcessing }  = useFocusPet();
  const { data: celoBalance }         = useBalance({ address });
  const { data: gBalance }            = useBalance({ address, token: GOOD_DOLLAR_ADDRESSES.CELO_MAINNET });
  const { sendTransaction, isPending: celoPending } = useSendTransaction();
  const { writeContract,   isPending: gsPending   } = useWriteContract();

  const isSending = celoPending || gsPending;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleLogout = async () => { onClose(); await logout(); };

  const handleSend = () => {
    if (!recipient || !amount) { toast.error("Fill in all fields."); return; }
    const opts = {
      onSuccess: () => { toast.success("Sent!"); setView("overview"); setAmount(""); setRecipient(""); },
      onError: (e: Error) => toast.error(e.message),
    };
    if (token === "CELO") {
      sendTransaction({ to: recipient as `0x${string}`, value: parseEther(amount) }, opts);
    } else {
      writeContract({ address: GOOD_DOLLAR_ADDRESSES.CELO_MAINNET, abi: ERC20ABI, functionName: "transfer", args: [recipient as `0x${string}`, parseUnits(amount, 18)] }, opts);
    }
  };

  const viewTitle = view === "overview" ? "Your Account" : view === "send" ? "Send" : "Receive";

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "absolute", inset: 0, background: "rgba(28,26,22,0.45)", backdropFilter: "blur(8px)" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.3, ease: EASE as never }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 440,
              background: C.surface,
              borderRadius: 24,
              border: `1px solid ${C.border}`,
              boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 24px 64px rgba(0,0,0,0.12)",
              overflow: "hidden",
              fontFamily: "var(--font-geist-sans)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px 16px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {view !== "overview" && (
                  <button
                    onClick={() => setView("overview")}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, cursor: "pointer" }}
                  >
                    <ChevronLeft size={16} style={{ color: C.text2 }} />
                  </button>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img src="/focus-pet-logo.jpeg" alt="FocusPet" style={{ width: 26, height: 26, borderRadius: "50%" }} />
                  <span style={{ fontFamily: FD, fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", color: C.text1 }}>{viewTitle}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, cursor: "pointer" }}
              >
                <X size={14} style={{ color: C.text2 }} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 22px 24px", maxHeight: "80vh", overflowY: "auto" }}>
              <AnimatePresence mode="wait">

                {/* ── OVERVIEW ─────────────────────────────────────── */}
                {view === "overview" && (
                  <motion.div key="overview" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.22 }}>

                    {/* Identity */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                      <button
                        onClick={() => copy(address || "", "Address")}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, background: C.bg, border: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left", width: "100%" }}
                      >
                        <div>
                          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text3, marginBottom: 3 }}>Wallet</p>
                          <p style={{ fontSize: 13, fontFamily: "var(--font-geist-mono)", color: C.text1, fontWeight: 600 }}>
                            {address?.slice(0, 8)}…{address?.slice(-6)}
                          </p>
                        </div>
                        <Copy size={14} style={{ color: C.text3, flexShrink: 0 }} />
                      </button>

                      {user?.email && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, background: C.bg, border: `1px solid ${C.border}` }}>
                          <div>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text3, marginBottom: 3 }}>Email</p>
                            <p style={{ fontSize: 13, color: C.text1, fontWeight: 600 }}>{user.email.address}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Balances */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                      {[
                        { symbol: "CELO", icon: <img src="/celoicon.webp" alt="CELO" style={{ width: 18, height: 18, borderRadius: "50%" }} />, value: celoBalance?.formatted?.slice(0, 7) || "0.00" },
                        { symbol: "G$",   icon: <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "#fff" }}>G</div>, value: gBalance?.formatted?.slice(0, 8) || "0.00" },
                      ].map(b => (
                        <div key={b.symbol} style={{ padding: "14px 14px", borderRadius: 12, background: C.bg, border: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                            {b.icon}
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text3 }}>{b.symbol}</span>
                          </div>
                          <p style={{ fontFamily: FD, fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em", color: C.text1, lineHeight: 1 }}>{b.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                      <button
                        onClick={() => setView("send")}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px", borderRadius: 12, background: C.orange, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}
                      >
                        <ArrowUpRight size={16} /> Send
                      </button>
                      <button
                        onClick={() => setView("receive")}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px", borderRadius: 12, background: C.bg, color: C.text1, fontWeight: 700, fontSize: 14, border: `1px solid ${C.border2}`, cursor: "pointer" }}
                      >
                        <ArrowDownLeft size={16} /> Receive
                      </button>
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                      <button
                        onClick={handleLogout}
                        style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.text3, background: "transparent", border: "none", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.color = C.text2)}
                        onMouseLeave={e => (e.currentTarget.style.color = C.text3)}
                      >
                        Log out
                      </button>
                      <span style={{ fontSize: 10, color: C.text3, fontWeight: 500 }}>Protected by Privy</span>
                    </div>
                  </motion.div>
                )}

                {/* ── SEND ─────────────────────────────────────────── */}
                {view === "send" && (
                  <motion.div key="send" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}>
                    {/* Token toggle */}
                    <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 12, background: C.bg, border: `1px solid ${C.border}`, marginBottom: 18 }}>
                      {(["CELO", "G$"] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setToken(t)}
                          style={{
                            flex: 1, padding: "9px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                            background: token === t ? C.surface : "transparent",
                            color: token === t ? C.orange : C.text2,
                            border: token === t ? `1px solid ${C.border}` : "1px solid transparent",
                            cursor: "pointer", transition: "all 0.15s",
                            boxShadow: token === t ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                          }}
                        >{t}</button>
                      ))}
                    </div>

                    {/* Recipient */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text3, marginBottom: 7 }}>Recipient</label>
                      <input
                        type="text"
                        placeholder="0x… wallet address"
                        value={recipient}
                        onChange={e => setRecipient(e.target.value)}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, fontFamily: "var(--font-geist-mono)", color: C.text1, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>

                    {/* Amount */}
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C.text3 }}>Amount</label>
                        <button
                          onClick={() => setAmount(token === "CELO" ? celoBalance?.formatted || "" : gBalance?.formatted || "")}
                          style={{ fontSize: 11, fontWeight: 700, color: C.orange, background: "transparent", border: "none", cursor: "pointer" }}
                        >
                          Max: {token === "CELO" ? celoBalance?.formatted?.slice(0, 7) : gBalance?.formatted?.slice(0, 8)}
                        </button>
                      </div>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        style={{ width: "100%", padding: "14px 14px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.bg, fontSize: 28, fontFamily: FD, fontWeight: 800, color: C.text1, outline: "none", letterSpacing: "-0.03em", boxSizing: "border-box" }}
                      />
                    </div>

                    <button
                      onClick={handleSend}
                      disabled={isSending}
                      style={{ width: "100%", padding: "14px", borderRadius: 12, background: isSending ? C.text3 : C.orange, color: "#fff", fontFamily: FD, fontWeight: 800, fontSize: 15, border: "none", cursor: isSending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      {isSending ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : `Send ${token}`}
                    </button>
                    <button
                      onClick={() => setView("overview")}
                      style={{ display: "block", width: "100%", marginTop: 12, fontSize: 12, fontWeight: 700, color: C.text3, background: "transparent", border: "none", cursor: "pointer", textAlign: "center" }}
                    >Cancel</button>
                  </motion.div>
                )}

                {/* ── RECEIVE ──────────────────────────────────────── */}
                {view === "receive" && (
                  <motion.div key="receive" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.22 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                      {/* Address display */}
                      <div style={{ width: "100%", padding: 20, borderRadius: 16, background: C.bg, border: `1px solid ${C.border}`, textAlign: "center" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: 12 }}>Your wallet address</p>
                        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, color: C.text1, lineHeight: 1.75, wordBreak: "break-all" }}>{address}</p>
                      </div>

                      {/* QR placeholder (readable indicator) */}
                      <div style={{ width: 100, height: 100, borderRadius: 16, background: C.bg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, padding: 12 }}>
                          {Array.from({ length: 25 }, (_, i) => (
                            <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: [0,1,4,5,6,10,12,14,18,19,20,23,24].includes(i) ? C.text1 : C.border }} />
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => copy(address || "", "Address")}
                        style={{ width: "100%", padding: "13px", borderRadius: 12, background: C.orange, color: "#fff", fontFamily: FD, fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                      >
                        <Copy size={15} /> Copy address
                      </button>

                      <button
                        onClick={() => setView("overview")}
                        style={{ fontSize: 12, fontWeight: 700, color: C.text3, background: "transparent", border: "none", cursor: "pointer" }}
                      >Back to wallet</button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
