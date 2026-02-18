"use client";

import React, { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareModal } from "./ShareModal";

interface SocialShareProps {
  text: string;
  url?: string;
  className?: string;
}

export function SocialShare({
  text,
  url = "https://focus-pet-theta.vercel.app", // Updated to correct domain
  className = "",
}: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all active:scale-90 ${className}`}
        title="Share Achievement"
      >
        <Share2 size={16} />
      </button>

      <ShareModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        text={text}
        url={url}
      />
    </>
  );
}
