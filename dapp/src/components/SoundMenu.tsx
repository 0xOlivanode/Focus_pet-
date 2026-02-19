"use client";

import { useAudio } from "@/hooks/useAudio";
import { Volume2, VolumeX, Music, Music2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

export function SoundMenu() {
  const { isMuted, isMusicMuted, toggleMute, toggleMusic } = useAudio();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full backdrop-blur-md transition-colors border border-neutral-200 dark:border-white/5 ${
          isOpen
            ? "bg-neutral-100 dark:bg-white/30 text-neutral-900 dark:text-white"
            : "bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white"
        }`}
        title="Sound Settings"
      >
        <Music2 size={18} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 min-w-[200px] bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-2 shadow-xl z-50 flex flex-col gap-1"
          >
            {/* Music Toggle */}
            <button
              onClick={toggleMusic}
              className="flex items-center justify-between w-full px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg ${!isMusicMuted ? "bg-indigo-500/20 text-indigo-500 dark:text-indigo-400" : "bg-neutral-500/20 text-neutral-500 dark:text-neutral-400"}`}
                >
                  <Music size={14} />
                </div>
                <span className="text-sm font-bold text-neutral-700 dark:text-white/80 group-hover:text-black dark:group-hover:text-white">
                  Music
                </span>
              </div>
              <div
                className={`w-8 h-4 rounded-full relative transition-colors ${!isMusicMuted ? "bg-indigo-500" : "bg-neutral-300 dark:bg-neutral-600"}`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${!isMusicMuted ? "translate-x-4" : "translate-x-0"}`}
                />
              </div>
            </button>

            {/* SFX Toggle */}
            <button
              onClick={toggleMute}
              className="flex items-center justify-between w-full px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg ${!isMuted ? "bg-indigo-500/20 text-indigo-500 dark:text-indigo-400" : "bg-neutral-500/20 text-neutral-500 dark:text-neutral-400"}`}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </div>
                <span className="text-sm font-bold text-neutral-700 dark:text-white/80 group-hover:text-black dark:group-hover:text-white">
                  Sounds
                </span>
              </div>
              <div
                className={`w-8 h-4 rounded-full relative transition-colors ${!isMuted ? "bg-indigo-500" : "bg-neutral-300 dark:bg-neutral-600"}`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${!isMuted ? "translate-x-4" : "translate-x-0"}`}
                />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
