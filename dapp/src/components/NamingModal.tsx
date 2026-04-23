"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PenLine, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNameAvailability } from "@/hooks/useNameAvailability";

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
  const {
    isUsernameAvailable,
    isPetNameAvailable,
    isCheckingUsername,
    isCheckingPetName,
    checkUsername,
    checkPetName,
  } = useNameAvailability(initialUsername, initialPetName);

  useEffect(() => {
    if (isOpen) {
      setUsername(initialUsername);
      setPetName(initialPetName);
      if (initialUsername) checkUsername(initialUsername);
      if (initialPetName) checkPetName(initialPetName);
    }
  }, [isOpen, initialUsername, initialPetName]);

  const hasChanged = username !== initialUsername || petName !== initialPetName;
  const isUserValid = username.length >= 3 && isUsernameAvailable(username);
  const isPetValid = petName.length >= 2 && isPetNameAvailable(petName);
  const isValid =
    hasChanged &&
    isUserValid &&
    isPetValid &&
    !isCheckingUsername &&
    !isCheckingPetName;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[300] bg-black flex flex-col"
        >
          {/* Close button — top right of screen */}
          {!isPending && (
            <button
              onClick={onClose}
              className="absolute top-6 right-6 sm:top-8 sm:right-8 p-2 text-neutral-400 hover:text-white transition-colors z-10"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          )}

          {/* Content */}
          <div className="flex-1 flex flex-col items-center px-5 py-[180px]">
            {/* Page title */}
            <motion.h1
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.25 }}
              className="text-white text-2xl sm:text-[40px]/15 font-medium mb-8 text-center"
            >
              Edit your profile
            </motion.h1>

            {/* Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.25 }}
              className="w-full max-w-[680px] bg-[#0F0F0F] rounded-2xl p-8 sm:p-10"
            >
              <h2 className="text-white text-lg sm:text-2xl font-semibold mb-2 sm:mb-4">
                A Legend is Born!
              </h2>
              <p className="text-[#A9A9A9] text-sm sm:text-base mb-8 lg:mb-15 leading-relaxed">
                Every epic journey needs a hero and a companion. What shall we
                call you both?
              </p>

              <div className="space-y-5">
                {/* Username row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                  <label className="text-white text-sm sm:text-xl font-medium sm:w-44 sm:shrink-0">
                    Your hero name
                  </label>
                  <div className="flex-1 relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm select-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        const v = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, "");
                        setUsername(v);
                        checkUsername(v);
                      }}
                      placeholder={initialUsername || "heroname"}
                      className="w-full bg-[#2a2a2a] text-white placeholder-neutral-500 rounded-xl py-3 pl-8 pr-10 text-sm outline-none focus:ring-1 focus:ring-neutral-600 transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingUsername ? (
                        <Loader2
                          size={15}
                          className="text-neutral-500 animate-spin"
                        />
                      ) : username.length > 0 &&
                        !isUsernameAvailable(username) ? (
                        <AlertCircle size={15} className="text-red-400" />
                      ) : username.length >= 3 ? (
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      ) : (
                        <PenLine size={15} className="text-neutral-500" />
                      )}
                    </div>
                  </div>
                </div>
                {username.length > 0 && !isUsernameAvailable(username) && (
                  <p className="text-xs text-red-400 sm:ml-52">
                    This hero name is already taken!
                  </p>
                )}

                {/* Pet name row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                  <label className="text-white text-sm sm:text-xl font-medium sm:w-44 sm:shrink-0">
                    Pet Name
                  </label>
                  <div className="flex-1 relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm select-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={petName}
                      onChange={(e) => {
                        setPetName(e.target.value);
                        checkPetName(e.target.value);
                      }}
                      placeholder={initialPetName || "petname"}
                      className="w-full bg-[#2a2a2a] text-white placeholder-neutral-500 rounded-xl py-3 pl-8 pr-10 text-sm outline-none focus:ring-1 focus:ring-neutral-600 transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingPetName ? (
                        <Loader2
                          size={15}
                          className="text-neutral-500 animate-spin"
                        />
                      ) : petName.length > 0 && !isPetNameAvailable(petName) ? (
                        <AlertCircle size={15} className="text-red-400" />
                      ) : petName.length >= 2 ? (
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      ) : (
                        <PenLine size={15} className="text-neutral-500" />
                      )}
                    </div>
                  </div>
                </div>
                {petName.length > 0 && !isPetNameAvailable(petName) && (
                  <p className="text-xs text-red-400 sm:ml-52">
                    Another companion already claimed this name!
                  </p>
                )}
              </div>
            </motion.div>

            {/* Save button */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.25 }}
              onClick={() => onSave(username, petName)}
              disabled={!isValid || isPending}
              className="mt-8 px-10 py-3.5 rounded-full bg-white hover:bg-neutral-100 text-black font-semibold text-sm transition-all disabled:opacity-40! disabled:cursor-not-allowed! flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving
                </>
              ) : (
                "Save Changes"
              )}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
