"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, type Easing } from "framer-motion";
import { X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useNameAvailability } from "@/hooks/useNameAvailability";

const C = {
  cream: "#FAF7F2",
  creamDark: "#F0EBE3",
  border: "#E8E0D5",
  text: "#1C1A16",
  muted: "#7A7067",
  subtle: "#B0A89E",
  orange: "#E05C28",
  orangeLight: "#FFF0EA",
  green: "#2E7A4F",
  red: "#DC2626",
  redLight: "#FEF2F2",
};

const FD = "var(--font-syne), var(--font-geist-sans)";
const EASE: Easing = [0.22, 1, 0.36, 1] as unknown as Easing;

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
  const [username, setUsername] = useState(initialUsername || "");
  const [petName, setPetName] = useState(initialPetName || "");
  const { isUsernameAvailable, isPetNameAvailable, isLoadingAvailability } =
    useNameAvailability(initialUsername, initialPetName);

  useEffect(() => {
    if (isOpen) {
      setUsername(initialUsername);
      setPetName(initialPetName);
    }
  }, [isOpen, initialUsername, initialPetName]);

  const isUserValid = username.length >= 3 && isUsernameAvailable(username);
  const isPetValid = petName.length >= 2 && isPetNameAvailable(petName);
  const isValid = isUserValid && isPetValid && !isLoadingAvailability;

  const userTaken = username.length > 0 && !isUsernameAvailable(username);
  const petTaken = petName.length > 0 && !isPetNameAvailable(petName);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isPending ? onClose : undefined}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(28,26,22,0.45)",
              backdropFilter: "blur(8px)",
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.4, ease: EASE }}
            style={{
              position: "relative",
              background: C.cream,
              borderRadius: 28,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 24px 64px rgba(28,26,22,0.18)",
              border: `1px solid ${C.border}`,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 0",
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: FD,
                    fontSize: 22,
                    fontWeight: 800,
                    color: C.text,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.2,
                  }}
                >
                  Pick your names
                </h2>
              </div>
              {!isPending && (
                <button
                  onClick={onClose}
                  style={{
                    background: C.creamDark,
                    border: "none",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: C.muted,
                    flexShrink: 0,
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Body */}
            <div
              style={{
                padding: "20px 24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: C.muted,
                  lineHeight: 1.6,
                  marginTop: -4,
                }}
              >
                Every journey needs a hero and a companion.
              </p>

              {/* Username field */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                    color: C.muted,
                    marginBottom: 8,
                  }}
                >
                  Your name
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontWeight: 700,
                      fontSize: 15,
                      color: C.subtle,
                      pointerEvents: "none",
                    }}
                  >
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                      )
                    }
                    placeholder="master_focuser"
                    style={{
                      width: "100%",
                      padding: "13px 44px 13px 30px",
                      borderRadius: 12,
                      border: `1.5px solid ${
                        userTaken ? C.red : isUserValid ? C.green : C.border
                      }`,
                      background: userTaken ? C.redLight : "#fff",
                      fontSize: 15,
                      fontWeight: 600,
                      color: C.text,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.15s",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    {isLoadingAvailability ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: "linear",
                        }}
                        style={{
                          width: 16,
                          height: 16,
                          border: `2px solid ${C.border}`,
                          borderTopColor: C.orange,
                          borderRadius: "50%",
                        }}
                      />
                    ) : userTaken ? (
                      <AlertCircle size={16} color={C.red} />
                    ) : isUserValid ? (
                      <CheckCircle2 size={16} color={C.green} />
                    ) : null}
                  </div>
                </div>
                {userTaken && (
                  <p
                    style={{
                      fontSize: 12,
                      color: C.red,
                      marginTop: 6,
                      fontWeight: 500,
                    }}
                  >
                    That name is taken. Try another.
                  </p>
                )}
              </div>

              {/* Pet name field */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                    color: C.muted,
                    marginBottom: 8,
                  }}
                >
                  Your pet's name
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="Apollo, Luna, Pixel…"
                    style={{
                      width: "100%",
                      padding: "13px 44px 13px 14px",
                      borderRadius: 12,
                      border: `1.5px solid ${
                        petTaken ? C.red : isPetValid ? C.green : C.border
                      }`,
                      background: petTaken ? C.redLight : "#fff",
                      fontSize: 15,
                      fontWeight: 600,
                      color: C.text,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.15s",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    {isLoadingAvailability ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: "linear",
                        }}
                        style={{
                          width: 16,
                          height: 16,
                          border: `2px solid ${C.border}`,
                          borderTopColor: C.orange,
                          borderRadius: "50%",
                        }}
                      />
                    ) : petTaken ? (
                      <AlertCircle size={16} color={C.red} />
                    ) : isPetValid ? (
                      <CheckCircle2 size={16} color={C.green} />
                    ) : null}
                  </div>
                </div>
                {petTaken && (
                  <p
                    style={{
                      fontSize: 12,
                      color: C.red,
                      marginTop: 6,
                      fontWeight: 500,
                    }}
                  >
                    That name is taken. Try another.
                  </p>
                )}
              </div>

              {/* Save button */}
              <motion.button
                onClick={() => onSave(username, petName)}
                disabled={!isValid || isPending}
                whileHover={isValid && !isPending ? { scale: 1.02 } : {}}
                whileTap={isValid && !isPending ? { scale: 0.97 } : {}}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  borderRadius: 14,
                  border: "none",
                  background: isValid && !isPending ? C.orange : C.border,
                  color: isValid && !isPending ? "#fff" : C.subtle,
                  fontFamily: FD,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: isValid && !isPending ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow:
                    isValid && !isPending
                      ? "0 4px 16px rgba(224,92,40,0.3)"
                      : "none",
                  transition: "background 0.2s, box-shadow 0.2s",
                  marginTop: 4,
                }}
              >
                {isPending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                    style={{
                      width: 18,
                      height: 18,
                      border: "2.5px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  "Save & continue →"
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
