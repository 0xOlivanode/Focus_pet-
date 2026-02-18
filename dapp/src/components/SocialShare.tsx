"use client";

import { Share2 } from "lucide-react";

interface SocialShareProps {
  text: string;
  url?: string;
  className?: string;
}

export function SocialShare({
  text,
  url = "https://focus-pet.vercel.app", // Fallback URL
  className = "",
}: SocialShareProps) {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const farcasterUrl = `https://warpcast.com/~/compose?text=${encodedText}&embeds[]=${encodedUrl}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-neutral-500 mr-2">Share:</span>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white hover:bg-neutral-800 transition-colors"
        title="Share on Twitter / X"
      >
        <span className="text-sm font-bold">𝕏</span>
      </a>
      <a
        href={farcasterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        title="Share on Farcaster"
      >
        <Share2 size={16} />
      </a>
    </div>
  );
}
