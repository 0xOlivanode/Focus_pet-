"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowRight, Clock, Trophy, Heart } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";

export function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-900">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/focus-pet-logo.jpeg"
              alt="FocusPet Logo"
              className="w-8 h-8 rounded-full shadow-sm"
            />
            <h1 className="font-bold text-xl tracking-tight">FocusPet</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/app"
              className="text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hidden sm:block"
            >
              Launch App
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center relative"
        >
          {/* Floating Emojis Background */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -top-10 left-10 text-6xl opacity-20 pointer-events-none hidden md:block"
          >
            🦕
          </motion.div>
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{
              repeat: Infinity,
              duration: 5,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute top-20 right-10 text-6xl opacity-20 pointer-events-none hidden md:block"
          >
            🥚
          </motion.div>

          <motion.div variants={itemVariants} className="mb-6 inline-block">
            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Live on Celo Sepolia
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400"
          >
            Turn Your Focus <br /> Into A Pet.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            A gamified productivity companion that rewards your deep work
            sessions with **XP & GoodDollar (G$)**. Stay focused, hatch your
            pet, and climb the global leaderboard.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white dark:bg-black rounded-xl p-1">
                <ConnectButton
                  label="Start Your Journey"
                  showBalance={false}
                  accountStatus="address"
                />
              </div>
            </div>

            <Link
              href="/app"
              className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all active:scale-95"
            >
              Enter App
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto mt-32 grid md:grid-cols-3 gap-8"
        >
          <FeatureCard
            icon={<Clock className="text-indigo-500" size={32} />}
            title="Focus to Earn"
            description="Start a 25-minute timer. Complete it to feed your pet and earn XP."
          />
          <FeatureCard
            icon={<Heart className="text-red-500" size={32} />}
            title="Raise Your Pet"
            description="Your pet evolves from an Egg to a Dragon as you build consistent habits."
          />
          <FeatureCard
            icon={<Trophy className="text-yellow-500" size={32} />}
            title="Compete & Win"
            description="Climb the weekly leaderboard and earn GoodDollar (G$) rewards."
          />
        </motion.div>

        {/* How it Works / Steps */}
        <div className="mt-32 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">How it Works</h2>
          <div className="space-y-12">
            <Step
              num={1}
              title="Connect & Mint"
              desc="Connect your Celo wallet to receive your unique Soulbound Pet Egg."
            />
            <Step
              num={2}
              title="Start a Session"
              desc="Choose a focus task and start the timer. No distractions allowed!"
            />
            <Step
              num={3}
              title="Claim Rewards"
              desc="Sign your session to verify it, grow your pet, and earn tokens."
            />
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-neutral-500 border-t border-neutral-100 dark:border-neutral-900">
        <p>Built with ❤️ on Celo • Powered by GoodDollar</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 hover:border-indigo-500/30 transition-colors">
      <div className="mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Step({
  num,
  title,
  desc,
}: {
  num: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-4 md:gap-6">
      <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-lg">
        {num}
      </div>
      <div>
        <h3 className="font-bold text-xl mb-1">{title}</h3>
        <p className="text-neutral-600 dark:text-neutral-400">{desc}</p>
      </div>
    </div>
  );
}
