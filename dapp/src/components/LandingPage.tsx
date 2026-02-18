"use client";

import React from "react";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Sparkles, Brain, Zap, Heart, ArrowRight } from "lucide-react";
import Link from "next/link";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-indigo-500/30 overflow-hidden relative font-sans">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-1000" />
      </div>

      {/* Navbar directly integrated as simple header */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-3xl">
            <img
              src="/focus-pet-logo.jpeg"
              className="rounded-full h-10 w-10"
              alt=""
            />
          </span>
          <span className="font-bold text-xl tracking-tight">FocusPet</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://gooddollar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Powered by GoodDollar
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-20 px-4 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative inline-block mb-4"
        >
          <span className="absolute -top-6 -right-8 text-2xl animate-bounce delay-700">
            ✨
          </span>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm font-medium text-indigo-300 mb-6 mx-auto w-fit">
            <Sparkles size={14} />
            <span>Regenerative Attention Economy</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-linear-to-b from-white to-white/60 bg-clip-text text-transparent"
        >
          Reclaim Your
          <br />
          <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Focus
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed"
        >
          Gamify your productivity with a soulbound companion that grows as you
          work. Earn real rewards for your attention.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex gap-x-2 items-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-black rounded-xl p-1">
                <ConnectButton
                  label="Start Your Journey"
                  showBalance={false}
                  accountStatus="address"
                />
              </div>
            </div>

            <Link
              href="/app"
              className="flex items-center gap-2  py-2 px-6 rounded-sm text-neutral-400 hover:text-white transition-colors text-sm font-medium group"
            >
              Go to App{" "}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          <p className="text-xs text-neutral-500 mt-8">
            Built on Celo • Powered by G$
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full text-left">
          <FeatureCard
            icon={<Brain className="text-indigo-400" />}
            title="Focus-to-Earn"
            description="Turn your attention span into a tangible asset. Every minute of deep work strengthens your companion."
            delay={0.5}
          />
          <FeatureCard
            icon={<Heart className="text-pink-400" />}
            title="Soulbound Growth"
            description="Your pet is tied to your identity. It reflects your consistency and cannot be bought or sold."
            delay={0.6}
          />
          <FeatureCard
            icon={<Zap className="text-yellow-400" />}
            title="Positive Sum"
            description="Feed your pet with G$ to support a global UBI ecosystem. Personal growth meets social impact."
            delay={0.7}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-8 text-neutral-600 text-sm mt-20 border-t border-neutral-900">
        <p>© 2024 FocusPet. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay }}
      className="p-6 rounded-3xl bg-neutral-900/50 border border-white/5 backdrop-blur-sm hover:bg-neutral-800/50 transition-colors"
    >
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-2xl">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-neutral-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}
