"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Twitter, Share2, Copy, Check, MessageSquare } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  url: string;
}

export function ShareModal({ isOpen, onClose, text, url }: ShareModalProps) {
  const [copied, setCopied] = React.useState(false);

  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const farcasterUrl = `https://warpcast.com/~/compose?text=${encodedText}&embeds[]=${encodedUrl}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white dark:bg-neutral-950 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border border-neutral-100 dark:border-neutral-900 p-8 flex flex-col items-center"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6">
              <Share2 className="text-indigo-500 w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black mb-2 tracking-tight">
              Share Achievement
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium mb-8 text-center px-4">
              Let the world know about your focus progress!
            </p>

            <div className="grid grid-cols-1 gap-3 w-full">
              {/* Twitter */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full p-4 bg-black text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all active:scale-95 group"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg group-hover:scale-110 transition-transform">
                  <span className="font-bold">𝕏</span>
                </div>
                <span>Share on Twitter / X</span>
              </a>

              {/* Farcaster */}
              <a
                href={farcasterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full p-4 bg-[#472a91] text-white rounded-2xl font-bold hover:bg-[#3b2278] transition-all active:scale-95 group"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg group-hover:scale-110 transition-transform">
                  <MessageSquare size={18} fill="currentColor" />
                </div>
                <span>Share on Farcaster</span>
              </a>

              {/* Copy Link */}
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-3 w-full p-4 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all active:scale-95 group border border-neutral-200 dark:border-neutral-800"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-white dark:bg-neutral-800 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
                  {copied ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <Copy size={18} className="text-indigo-500" />
                  )}
                </div>
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
