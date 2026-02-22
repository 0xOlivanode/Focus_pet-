"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type WeatherType = "sunny" | "clear" | "cloudy" | "rainy" | "stormy";

interface WeatherLayerProps {
  weather: WeatherType;
}

export function WeatherLayer({ weather }: WeatherLayerProps) {
  // Generate random positions for rain/clouds once to avoid re-renders
  const rainDrops = useMemo(
    () => Array.from({ length: 40 }).map((_, i) => i),
    [],
  );
  const clouds = useMemo(() => Array.from({ length: 8 }).map((_, i) => i), []);
  const [strikePulse, setStrikePulse] = React.useState(0);

  // Re-randomize lightning paths on every pulse
  React.useEffect(() => {
    if (weather === "stormy") {
      const interval = setInterval(() => {
        setStrikePulse((p) => p + 1);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [weather]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-4xl md:rounded-[3rem]">
      <AnimatePresence mode="wait">
        {/* BACKGROUND GRADIENTS */}
        <motion.div
          key={weather}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className={`absolute inset-0 transition-colors duration-2000 ${
            weather === "sunny"
              ? "bg-linear-to-b from-amber-400/15 via-transparent to-transparent dark:from-amber-600/10"
              : weather === "rainy" || weather === "stormy"
                ? "bg-linear-to-b from-indigo-500/10 via-transparent to-transparent dark:from-slate-900/40"
                : "bg-transparent"
          }`}
        />

        {/* SUNNY / CLEAR EFFECTS */}
        {(weather === "sunny" || weather === "clear") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 overflow-hidden"
          >
            {/* Main Sun Position (Top Right) */}
            <div className="absolute -top-20 -right-20 w-80 h-80">
              {/* Core Glow */}
              <div
                className={`absolute inset-0 rounded-full blur-[100px] ${
                  weather === "sunny"
                    ? "bg-amber-400/20 dark:bg-orange-500/10"
                    : "bg-yellow-200/10"
                }`}
              />

              {weather === "sunny" && (
                <>
                  {/* Rotating God Rays / Sunbeams */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 80,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 flex items-center justify-center opacity-40 dark:opacity-20 translate-[-10%_-10%]"
                  >
                    {[
                      0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
                    ].map((angle) => (
                      <motion.div
                        key={angle}
                        animate={{
                          opacity: [0.1, 0.3, 0.1],
                          width: ["1px", "2px", "1px"],
                        }}
                        transition={{
                          duration: 4 + Math.random() * 4,
                          repeat: Infinity,
                          delay: Math.random() * 10,
                        }}
                        className="absolute h-[1000px] bg-linear-to-b from-amber-200/40 via-transparent to-transparent blur-xs origin-top"
                        style={{
                          transform: `rotate(${angle}deg)`,
                          left: "50%",
                          top: "50%",
                        }}
                      />
                    ))}
                  </motion.div>

                  {/* Secondary Pulsing Bloom */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute inset-0 bg-amber-200 rounded-full blur-[120px] mix-blend-screen"
                  />
                </>
              )}
            </div>

            {/* Lens Flare (Floating optics) */}
            {weather === "sunny" && (
              <div className="absolute inset-0 pointer-events-none opacity-40">
                <motion.div
                  animate={{
                    x: [0, 5, 0],
                    y: [0, -5, 0],
                  }}
                  transition={{ duration: 10, repeat: Infinity }}
                  className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full border border-amber-200/20 blur-[1px] mix-blend-overlay"
                />
                <motion.div
                  animate={{
                    x: [0, -10, 0],
                    y: [0, 10, 0],
                  }}
                  transition={{ duration: 15, repeat: Infinity }}
                  className="absolute bottom-1/4 right-1/4 w-8 h-8 rounded-full bg-amber-100/10 blur-[2px] mix-blend-soft-light"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* CLOUDS */}
        {(weather === "cloudy" ||
          weather === "rainy" ||
          weather === "stormy") && (
          <div className="absolute inset-0">
            {clouds.map((i) => (
              <motion.div
                key={`cloud-group-${i}`}
                initial={{
                  x: "-30%",
                  y: `${10 + ((i * 15) % 40)}%`,
                  opacity: 0,
                }}
                animate={{
                  x: ["0%", "130%"],
                  y: [
                    `${10 + ((i * 15) % 40)}%`,
                    `${15 + ((i * 15) % 40)}%`,
                    `${10 + ((i * 15) % 40)}%`,
                  ],
                  opacity:
                    weather === "cloudy" ? [0, 0.4, 0.4, 0] : [0, 0.6, 0.6, 0],
                }}
                transition={{
                  duration: 35 + i * 10,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 4,
                }}
                className="absolute w-64 h-24"
              >
                {/* Main Cloud Body (Multi-layered puffiness) */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 10 + i,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative w-full h-full"
                >
                  {/* Central Puff */}
                  <div
                    className={`absolute inset-0 rounded-full blur-3xl ${
                      weather === "cloudy"
                        ? "bg-white/50 dark:bg-slate-300/20"
                        : "bg-slate-400/40 dark:bg-slate-700/30"
                    }`}
                  />
                  {/* Left Puff */}
                  <div
                    className={`absolute -left-10 top-2 w-32 h-20 rounded-full blur-2xl ${
                      weather === "cloudy"
                        ? "bg-white/40 dark:bg-slate-200/10"
                        : "bg-slate-500/30"
                    }`}
                  />
                  {/* Right Puff */}
                  <div
                    className={`absolute -right-8 bottom-0 w-36 h-24 rounded-full blur-2xl ${
                      weather === "cloudy"
                        ? "bg-amber-50/20 dark:bg-white/5"
                        : "bg-slate-600/20"
                    }`}
                  />
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}

        {/* RAIN / STORM */}
        {(weather === "rainy" || weather === "stormy") && (
          <div className="absolute inset-0">
            {/* High-density Rain Drops */}
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={`rain-container-${i}`}
                className="absolute w-px h-full"
                style={{ left: `${Math.random() * 100}%` }}
              >
                <motion.div
                  initial={{ y: -100, opacity: 0 }}
                  animate={{
                    y: ["0vh", "40vh"],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: weather === "stormy" ? 0.4 : 0.6,
                    repeat: Infinity,
                    ease: "linear",
                    delay: Math.random() * 2,
                  }}
                  className="w-px h-10 bg-linear-to-b from-transparent via-indigo-300/40 to-white/20 blur-[0.2px]"
                />

                {/* Splashes on the 'ground' */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1.5, 0],
                    opacity: [0, 0.4, 0],
                  }}
                  transition={{
                    duration: 0.3,
                    repeat: Infinity,
                    repeatDelay:
                      (weather === "stormy" ? 0.4 : 0.6) + Math.random(),
                    delay: Math.random() * 2,
                  }}
                  className="absolute bottom-[20%] left-[-2px] w-1.5 h-0.5 bg-white/30 rounded-full blur-[1px]"
                />
              </div>
            ))}
          </div>
        )}

        {/* LIGHTNING (Stormy Only) */}
        {weather === "stormy" && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Global Flash */}
            <motion.div
              animate={{
                opacity: [0, 0, 0.4, 0, 0.6, 0, 0, 0, 0.3, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                times: [0, 0.4, 0.42, 0.44, 0.46, 0.5, 0.8, 0.82, 0.84, 1],
              }}
              className="absolute inset-0 bg-white/30 mix-blend-overlay"
            />

            {/* Branching Lightning Strikes */}
            {[0, 1].map((i) => {
              // Generate dynamic points based on strikePulse
              const startX = 10 + Math.random() * 80;
              const midX1 = startX + (Math.random() - 0.5) * 40;
              const midX2 = midX1 + (Math.random() - 0.5) * 40;
              const endX = midX2 + (Math.random() - 0.5) * 40;

              return (
                <motion.div
                  key={`strike-${i}-${strikePulse}`}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 0, 1, 0, 1, 0, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    delay: i * 2.5,
                    times: [0, 0.4, 0.42, 0.44, 0.46, 0.5, 1],
                  }}
                  className="absolute inset-0"
                >
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <motion.path
                      d={`M ${startX} 0 L ${midX1} 30 L ${midX2} 60 L ${endX} 100`}
                      fill="none"
                      stroke="white"
                      strokeWidth="0.8"
                      className="drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                      strokeLinecap="round"
                    />
                    {/* Branch */}
                    {Math.random() > 0.5 && (
                      <motion.path
                        d={`M ${midX1} 30 L ${midX1 + (Math.random() - 0.5) * 40} 50`}
                        fill="none"
                        stroke="rgba(255,255,255,0.7)"
                        strokeWidth="0.4"
                        className="drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
