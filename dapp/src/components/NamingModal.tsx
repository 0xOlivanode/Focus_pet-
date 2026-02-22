"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Sparkles, Loader2 } from "lucide-react";

interface NamingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (username: string, petName: string) => void;
  initialUsername?: string;
  initialPetName?: string;
  isPending?: boolean;
}

export function NamingModal({
  isOpen,
  onClose,
  onSave,
  initialUsername = "",
  initialPetName = "",
  isPending = false,
}: NamingModalProps) {
  const [username, setUsername] = useState(initialUsername);
  const [petName, setPetName] = useState(initialPetName);

  useEffect(() => {
    if (isOpen) {
      setUsername(initialUsername);
      setPetName(initialPetName);
    }
  }, [isOpen, initialUsername, initialPetName]);

  const isValid = username.length >= 3 && petName.length >= 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isPending ? onClose : undefined}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white dark:bg-neutral-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-neutral-100 dark:border-neutral-800 z-101"
          >
            {!isPending && (
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors z-10"
              >
                <X size={20} />
              </button>
            )}

            <div className="p-8 md:p-10">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                  <Sparkles size={32} />
                </div>
                <h2 className="text-2xl font-black tracking-tight mb-2">
                  A Legend is Born! 🥚✨
                </h2>
                <p className="text-neutral-400 text-sm font-medium leading-relaxed">
                  Every epic journey needs a hero and a companion. What shall we
                  call you both?
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 ml-1">
                    Your Hero Name
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-black group-focus-within:text-indigo-500 transition-colors">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, ""),
                        )
                      }
                      placeholder="master_focuser"
                      className="w-full bg-neutral-50 dark:bg-neutral-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 pl-9 pr-4 font-bold outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 ml-1">
                    Companion's Name
                  </label>
                  <input
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="e.g. Apollo, Luna, Pixel"
                    className="w-full bg-neutral-50 dark:bg-neutral-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 px-5 font-bold outline-none transition-all dark:text-white"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => onSave(username, petName)}
                    disabled={!isValid || isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 text-white disabled:text-neutral-400 px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group"
                  >
                    {isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Save & Adopt
                        <Sparkles
                          size={16}
                          className="group-hover:rotate-12 transition-transform"
                        />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
