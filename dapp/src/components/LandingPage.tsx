"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, type Easing } from "framer-motion";
import { useState } from "react";
import { PrivyConnectButton } from "./PrivyConnectButton";
import { AccountModal } from "./AccountModal";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const C = {
  bg:         "#FAF7F2",   // warm cream
  surface:    "#FFFFFF",
  border:     "#EDE7DC",
  border2:    "#E0D9CE",
  text1:      "#1C1A16",   // warm black
  text2:      "#8A8478",   // warm gray
  text3:      "#C4BDB3",   // light gray
  orange:     "#E05C28",   // primary CTA, energy
  orangeLight:"#FEF0E8",
  green:      "#2E7A4F",   // GoodDollar / UBI
  greenLight: "#EBF5EE",
} as const;

const EASE: Easing = [0.22, 1, 0.36, 1] as unknown as Easing;
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: EASE },
});

const FONT_DISPLAY = "var(--font-syne), var(--font-geist-sans)";

// ─── Data ─────────────────────────────────────────────────────────────────────
const STAGES = [
  { emoji: "🥚", image: "/assets/pets/cyber_dino/egg_sunny.png",   name: "Egg",   xp: "0",        hours: "0h",    unlock: "Where it starts"         },
  { emoji: "🐣", image: "/assets/pets/cyber_dino/baby_sunny.png",  name: "Baby",  xp: "3,600",    hours: "1h",    unlock: "Unlocks Pet Dates"        },
  { emoji: "🦖", image: "/assets/pets/cyber_dino/adult_sunny.png", name: "Teen",  xp: "111,600",  hours: "30h",   unlock: "Unlocks G$ Staking"       },
  { emoji: "🐉", image: null,                                       name: "Adult", xp: "360,000",  hours: "100h",  unlock: "Mintable as NFT"          },
  { emoji: "👑", image: null,                                       name: "Elder", xp: "900,000",  hours: "250h",  unlock: "Revenue share"            },
];

const FEATURES = [
  { icon: "⏱️", title: "Anti-cheat timer",    desc: "Leave the tab and the session cancels. Every second you stay earns 1 XP — no faking it." },
  { icon: "🔥", title: "Streak multipliers",  desc: "Focus every day for a +5% XP bonus per day, stacking up to 20%. Miss a day and it resets." },
  { icon: "💚", title: "Fund real humans",    desc: "10% of every shop purchase goes directly into GoodDollar's UBI pool. Automatically." },
  { icon: "⚡", title: "Supercharge mode",    desc: "Stream G$ via Superfluid for up to 1.7× XP and auto-restored pet health every session." },
  { icon: "🏆", title: "Global leaderboard",  desc: "Compete worldwide. KYC-verified wallets earn a badge. Elder-tier pets earn protocol revenue." },
  { icon: "🛡️", title: "Pet shop",            desc: "Spend G$ on food, shields, energy drinks, and cosmetics. Your pet lives on-chain forever." },
];

const TICKER = [
  "🐉  847 pets evolved",
  "⏱️  31,000+ hours focused",
  "💚  G$ 94,200 donated to UBI",
  "🔥  12,400 sessions completed",
  "🏆  2,100 trainers competing",
  "⚡  340 superchargers active",
  "🌍  Live on Celo mainnet",
];

// ─── Component ────────────────────────────────────────────────────────────────
export function LandingPage() {
  const { isConnected, address } = useAccount();
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <div style={{ background: C.bg, color: C.text1, fontFamily: "var(--font-geist-sans)", overflowX: "hidden", minHeight: "100vh" }}>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        height: 60, background: "rgba(250,247,242,0.92)", backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", padding: "0 32px",
      }}>
        <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/focus-pet-logo.jpeg" alt="FocusPet" style={{ width: 28, height: 28, borderRadius: "50%" }} />
            <span style={{ fontWeight: 800, fontSize: 15, fontFamily: FONT_DISPLAY, letterSpacing: "-0.02em" }}>FocusPet</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: C.greenLight, color: C.green, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }} style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: C.green }} />
              LIVE
            </span>
          </div>
          <nav className="hidden md:flex" style={{ display: "flex", gap: 28 }}>
            {[["How it works", "#how-it-works"], ["Evolution", "#evolution"]].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: 13, fontWeight: 500, color: C.text2, textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text1)}
                onMouseLeave={e => (e.currentTarget.style.color = C.text2)}>{l}</a>
            ))}
          </nav>
          <PrivyConnectButton onOpenAccount={() => setAccountOpen(true)} />
        </div>
      </header>


      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: 32, paddingRight: 32 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 64, flexWrap: "wrap" }}>

          {/* Left */}
          <div style={{ flex: "1 1 440px", minWidth: 0 }}>
            <motion.div {...up(0)} style={{ marginBottom: 20 }}>
              <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 20, background: C.orangeLight, color: C.orange }}>
                Focus game on Celo
              </span>
            </motion.div>

            <motion.h1 {...up(0.08)} style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(48px, 6.5vw, 80px)", lineHeight: 1.0, letterSpacing: "-0.04em", color: C.text1, marginBottom: 24 }}>
              Finally, a reason<br />to put your<br />phone down.
            </motion.h1>

            <motion.p {...up(0.16)} style={{ fontSize: 17, lineHeight: 1.75, color: C.text2, maxWidth: 420, marginBottom: 36 }}>
              FocusPet is a productivity game where 25-minute sessions earn XP, grow your pet, and fund{" "}
              <span style={{ color: C.green, fontWeight: 600 }}>real human welfare</span> through GoodDollar — automatically.
            </motion.p>

            <motion.div {...up(0.22)} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 28 }}>
              {isConnected ? (
                <>
                  <Link href="/app">
                    <button style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 26px", borderRadius: 10, fontWeight: 700, fontSize: 15, background: C.orange, color: "#fff", border: "none", cursor: "pointer", letterSpacing: "-0.01em" }}>
                      Open app <ArrowRight size={16} />
                    </button>
                  </Link>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${address}`); toast.success("Copied!"); }}
                    style={{ padding: "13px 22px", borderRadius: 10, fontWeight: 600, fontSize: 14, background: "transparent", color: C.text2, border: `1px solid ${C.border2}`, cursor: "pointer" }}
                  >Copy invite link</button>
                </>
              ) : (
                <PrivyConnectButton onOpenAccount={() => setAccountOpen(true)} />
              )}
            </motion.div>

            <motion.p {...up(0.28)} style={{ fontSize: 12, color: C.text3, fontWeight: 500 }}>
              Free to start · Gas covered on first session · No seed phrase needed
            </motion.p>
          </div>

          {/* Right — pet card preview */}
          <div style={{ flex: "1 1 300px", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
            >
              {/* Outer card (slight tilt) */}
              <div className="pet-float" style={{
                background: C.surface, borderRadius: 24, padding: 28, width: 272,
                boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.1)",
                border: `1px solid ${C.border}`,
              }}>
                {/* Top badges */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: C.orangeLight, color: C.orange }}>⚡ Supercharged</span>
                  <span style={{ fontSize: 13, color: C.text2, fontWeight: 600 }}>🔥 12</span>
                </div>

                {/* Pet */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                  <img src="/assets/pets/cyber_dino/baby_sunny.png" alt="Baby pet" style={{ width: 120, height: 120, objectFit: "contain" }} />
                </div>

                {/* Name + level */}
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", color: C.text1, marginBottom: 2 }}>Lil Chomper</p>
                  <p style={{ fontSize: 12, color: C.text2 }}>Baby · Level 4</p>
                </div>

                {/* XP bar */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, marginBottom: 5 }}>
                    <span style={{ color: C.text2 }}>XP</span>
                    <span style={{ color: C.text1 }}>3,240 / 3,600</span>
                  </div>
                  <div style={{ height: 7, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "90%" }}
                      transition={{ duration: 1.2, delay: 0.8, ease: EASE }}
                      style={{ height: "100%", background: C.orange, borderRadius: 4 }}
                    />
                  </div>
                </div>

                {/* Health bar */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, marginBottom: 5 }}>
                    <span style={{ color: C.text2 }}>Health</span>
                    <span style={{ color: C.text1 }}>87 / 100</span>
                  </div>
                  <div style={{ height: 7, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "87%" }}
                      transition={{ duration: 1.2, delay: 1.0, ease: EASE }}
                      style={{ height: "100%", background: C.green, borderRadius: 4 }}
                    />
                  </div>
                </div>

                {/* Focus button */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "12px", borderRadius: 12, background: C.bg, border: `1px solid ${C.border}`,
                  cursor: "default",
                }}>
                  <span style={{ fontSize: 13 }}>▶</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: C.text1, fontVariantNumeric: "tabular-nums" }}>Start Focus · 25:00</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>


      {/* ── TICKER ───────────────────────────────────────────────────────────── */}
      <div style={{ overflow: "hidden", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.surface, padding: "13px 0" }}>
        <div className="ticker-track" style={{ display: "flex", gap: 52, whiteSpace: "nowrap", width: "max-content" }}>
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 600, color: C.text2, letterSpacing: "0.04em" }}>
              {item}
              <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: C.border2, margin: "0 26px", verticalAlign: "middle" }} />
            </span>
          ))}
        </div>
      </div>


      {/* ── THE LOOP ─────────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: "96px 32px", background: C.surface }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div {...up()} style={{ marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: 10 }}>The game loop</p>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(32px, 4.5vw, 52px)", letterSpacing: "-0.04em", lineHeight: 1.05, color: C.text1 }}>
              Three things happen<br />every session.
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {[
              {
                num: "01", emoji: "🎯", title: "You focus.",
                body: "Start a 25-minute timer. Stay in the tab — the moment you leave, it cancels. No cheating the system.",
                note: "1 XP earned per second",
                color: C.orange, light: C.orangeLight,
              },
              {
                num: "02", emoji: "⬆️", title: "You earn.",
                body: "Complete the session and your pet gets fed. You earn XP, G$ tokens, and build your daily streak.",
                note: "G$ tokens + XP + streak",
                color: "#7C5CBF", light: "#F3EEFF",
              },
              {
                num: "03", emoji: "🌍", title: "Humans get paid.",
                body: "10% of every shop purchase you make flows directly into GoodDollar's UBI pool. Real people, real money.",
                note: "G$ 94,000+ donated so far",
                color: C.green, light: C.greenLight,
              },
            ].map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -5, boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.12, ease: EASE }}
                style={{ padding: "32px 28px", borderRadius: 16, border: `1px solid ${C.border}`, background: C.bg, position: "relative", overflow: "hidden", cursor: "default" }}
              >
                {/* Top line accent */}
                <div style={{ position: "absolute", top: 0, left: 24, right: 24, height: 2, background: item.color, borderRadius: "0 0 2px 2px", opacity: 0.7 }} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.text3, letterSpacing: "0.08em" }}>{item.num}</span>
                  <span style={{ fontSize: 28 }}>{item.emoji}</span>
                </div>

                <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26, letterSpacing: "-0.03em", color: C.text1, marginBottom: 12 }}>{item.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: C.text2, marginBottom: 20 }}>{item.body}</p>

                <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: item.light, color: item.color }}>
                  {item.note}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ── EVOLUTION ────────────────────────────────────────────────────────── */}
      <section id="evolution" style={{ padding: "96px 32px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div {...up()} style={{ marginBottom: 56, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: 10 }}>Evolution path</p>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(32px, 4.5vw, 52px)", letterSpacing: "-0.04em", lineHeight: 1.05, color: C.text1 }}>
                Five stages.<br />Zero shortcuts.
              </h2>
            </div>
            <p style={{ fontSize: 14, color: C.text2, maxWidth: 300, lineHeight: 1.65 }}>
              Every XP is earned in real time. 1 second of focus = 1 XP. You can't buy your way to Elder.
            </p>
          </motion.div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {STAGES.map((s, i) => (
              <motion.div key={i} {...up(i * 0.08)}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25 }}
                style={{
                  flex: "1 1 160px", maxWidth: 210,
                  padding: "24px 20px", borderRadius: 16,
                  background: C.surface, border: `1px solid ${C.border}`,
                  display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                  cursor: "default", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                {/* Stage number */}
                <span style={{ fontSize: 10, fontWeight: 700, color: C.text3, letterSpacing: "0.08em", marginBottom: 16 }}>STAGE {i + 1}</span>

                {/* Pet */}
                <div style={{ width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  {s.image
                    ? <img src={s.image} alt={s.name} style={{ width: 68, height: 68, objectFit: "contain" }} />
                    : <span style={{ fontSize: 52 }}>{s.emoji}</span>
                  }
                </div>

                <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", color: C.text1, marginBottom: 4 }}>{s.name}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 2, fontVariantNumeric: "tabular-nums" }}>{s.xp} XP</p>
                <p style={{ fontSize: 11, color: C.text3, marginBottom: 16 }}>{s.hours} focused</p>

                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: C.bg, color: C.text2, border: `1px solid ${C.border2}` }}>
                  {s.unlock}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "96px 32px", background: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div {...up()} style={{ marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: 10 }}>How it's built</p>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(32px, 4.5vw, 52px)", letterSpacing: "-0.04em", lineHeight: 1.05, color: C.text1 }}>
              Six systems.<br />One addiction.
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, boxShadow: "0 6px 24px rgba(0,0,0,0.07)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
                style={{ padding: "28px 24px", borderRadius: 14, background: C.bg, border: `1px solid ${C.border}`, cursor: "default" }}
              >
                <span style={{ fontSize: 28, display: "block", marginBottom: 16 }}>{f.icon}</span>
                <h3 style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: C.text1, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.7, color: C.text2 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ── STATS ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "96px 32px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div {...up()} style={{ marginBottom: 56 }}>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(32px, 4.5vw, 52px)", letterSpacing: "-0.04em", lineHeight: 1.05, color: C.text1 }}>
              The numbers<br />don't lie.
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
            {[
              { value: "2,100+",  label: "active trainers",    sub: "on Celo mainnet"      },
              { value: "31,000+", label: "hours focused",      sub: "and counting"          },
              { value: "G$ 94K+", label: "donated to UBI",     sub: "to real humans"        },
              { value: "847",     label: "pets evolved",       sub: "from egg to elder"     },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: EASE }}
              >
                <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(24px, 2.8vw, 36px)", letterSpacing: "-0.04em", lineHeight: 1, color: C.text1, marginBottom: 6 }}>{s.value}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text2 }}>{s.label}</p>
                <p style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ── LEADERBOARD PREVIEW ──────────────────────────────────────────────── */}
      <section style={{ padding: "96px 32px", background: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 64, flexWrap: "wrap", alignItems: "flex-start" }}>

          <motion.div {...up()} style={{ flex: "1 1 280px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: 10 }}>Leaderboard</p>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.04em", lineHeight: 1.05, color: C.text1, marginBottom: 16 }}>
              Top trainers<br />right now.
            </h2>
            <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, marginBottom: 24 }}>
              Elder-tier pets earn a share of protocol revenue. KYC-verified trainers earn a badge. Rankings are live.
            </p>
            <Link href="/leaderboard">
              <button style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14, background: "transparent", color: C.text2, border: `1px solid ${C.border2}`, cursor: "pointer" }}>
                Full leaderboard <ChevronRight size={14} />
              </button>
            </Link>
          </motion.div>

          <div style={{ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { rank: 1, pet: "🐉", name: "0x1a2...f4e", xp: "412,000", streak: 42, verified: true,  streaming: true  },
              { rank: 2, pet: "🐉", name: "0x9b3...a1c", xp: "387,500", streak: 31, verified: true,  streaming: false },
              { rank: 3, pet: "🦖", name: "0x4c7...d8b", xp: "298,000", streak: 18, verified: false, streaming: true  },
              { rank: 4, pet: "🦖", name: "0x8d1...9a2", xp: "241,000", streak: 9,  verified: false, streaming: false },
            ].map((u, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                whileHover={{ x: 4 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: EASE }}
                style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 18px", borderRadius: 12,
                background: i === 0 ? C.orangeLight : C.bg,
                border: `1px solid ${i === 0 ? "#F4C9B3" : C.border}`,
              }}>
                <span style={{ fontWeight: 800, fontSize: 12, width: 18, color: i === 0 ? C.orange : C.text3 }}>#{u.rank}</span>
                <span style={{ fontSize: 20 }}>{u.pet}</span>
                <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, color: C.text2, flex: 1 }}>{u.name}</span>
                <span style={{ fontSize: 12, color: C.text2 }}>🔥{u.streak}</span>
                {u.verified  && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: C.greenLight, color: C.green, fontWeight: 700 }}>✓ KYC</span>}
                {u.streaming && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: C.orangeLight, color: C.orange, fontWeight: 700 }}>⚡ Stream</span>}
                <span style={{ fontWeight: 700, fontSize: 13, color: C.text1, fontVariantNumeric: "tabular-nums" }}>{u.xp} XP</span>
              </motion.div>
            ))}
          </div>

        </div>
      </section>


      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "96px 32px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <motion.div {...up()}>
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
              style={{ fontSize: 72, marginBottom: 28, display: "inline-block", lineHeight: 1 }}
            >
              🥚
            </motion.div>

            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(36px, 5vw, 60px)", letterSpacing: "-0.04em", lineHeight: 1.05, color: C.text1, marginBottom: 18 }}>
              Your egg is bored.<br />Go focus.
            </h2>

            <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.7, marginBottom: 36 }}>
              Every legend started with one 25-minute session. Your pet is in there, waiting.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
              {isConnected ? (
                <Link href="/app">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 32px", borderRadius: 12, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16, background: C.orange, color: "#fff", border: "none", cursor: "pointer", letterSpacing: "-0.01em" }}
                  >
                    Start focusing now <ArrowRight size={17} />
                  </motion.button>
                </Link>
              ) : (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <PrivyConnectButton onOpenAccount={() => setAccountOpen(true)} />
                </motion.div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <img src="/celoicon.webp" alt="Celo" style={{ width: 14, height: 14, borderRadius: "50%", opacity: 0.45 }} />
              <span style={{ fontSize: 12, color: C.text3, fontWeight: 500 }}>
                Joining 2,100+ trainers on Celo mainnet
              </span>
            </div>
          </motion.div>
        </div>
      </section>


      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "28px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/focus-pet-logo.jpeg" alt="" style={{ width: 20, height: 20, borderRadius: "50%", opacity: 0.6 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text2, fontFamily: FONT_DISPLAY }}>FocusPet</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[["Leaderboard", "/leaderboard"], ["Celo", "https://celo.org"], ["GoodDollar", "https://gooddollar.org"]].map(([l, h]) => (
              <a key={l} href={h} target={h.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                style={{ fontSize: 12, color: C.text2, textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text1)}
                onMouseLeave={e => (e.currentTarget.style.color = C.text2)}>{l}</a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: C.text3 }}>Built on Celo · Powered by GoodDollar</p>
        </div>
      </footer>

      <AccountModal isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  );
}
