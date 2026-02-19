"use client";

import React from "react";
import { useAudio } from "@/hooks/useAudio";

export function SoundTester() {
  const { playSound, isMuted, toggleMute } = useAudio();

  const sounds = ["click", "hover", "success", "hatch", "pop", "buy"] as const;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white rounded-lg shadow-xl z-50 flex flex-col gap-2">
      <h3 className="font-bold text-sm">Sound Tester</h3>
      <button
        onClick={toggleMute}
        className={`text-xs px-2 py-1 rounded ${
          isMuted ? "bg-red-500" : "bg-green-600"
        }`}
      >
        {isMuted ? "Unmute" : "Mute Sound"}
      </button>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {sounds.map((sound) => (
          <button
            key={sound}
            onClick={() => playSound(sound)}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition-colors"
          >
            Play {sound}
          </button>
        ))}
      </div>
    </div>
  );
}
