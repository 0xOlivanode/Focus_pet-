"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";

type SoundType = "click" | "hover" | "success" | "hatch" | "pop" | "buy";

interface AudioContextType {
  isMuted: boolean; // SFX mute
  isMusicMuted: boolean; // Music mute
  toggleMute: () => void; // Toggle SFX
  toggleMusic: () => void; // Toggle Music
  playSound: (type: SoundType) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const [isMuted, setIsMuted] = useState(false);
  /*
   * Preload audio files
   */

  // Load mute state from local storage
  useEffect(() => {
    const stored = localStorage.getItem("focus-pet-muted");
    if (stored) {
      setIsMuted(JSON.parse(stored));
    }
  }, []);

  /*
   * Preload audio files
   */
  const audioCache = useRef<Record<SoundType, HTMLAudioElement | null>>({
    click: null,
    hover: null,
    success: null,
    hatch: null,
    pop: null,
    buy: null,
  });

  useEffect(() => {
    // Initialize audio objects
    const loadAudio = (type: SoundType, src: string) => {
      const audio = new Audio(src);
      audio.volume = 0.5; // Set partial volume
      audioCache.current[type] = audio;
    };

    loadAudio("click", "/sounds/click.wav");
    loadAudio("hover", "/sounds/hover.wav");
    loadAudio("success", "/sounds/success.wav");
    loadAudio("hatch", "/sounds/success.wav"); // Using success sound for hatch
    loadAudio("pop", "/sounds/pop.wav");
    loadAudio("buy", "/sounds/buy.wav");
  }, []);

  /*
   * Background Music Logic
   */
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const pathname = usePathname();

  // Load music mute state
  useEffect(() => {
    const stored = localStorage.getItem("focus-pet-music-muted");
    if (stored) {
      setIsMusicMuted(JSON.parse(stored));
    }

    // Initialize music
    const music = new Audio("/sounds/background.mp3");
    music.loop = true;
    music.volume = 0.1; // Low background volume
    music.currentTime = 3; // Start from 3s as requested
    musicRef.current = music;

    return () => {
      music.pause();
      musicRef.current = null;
    };
  }, []);

  // Handle music playback based on mute state and route
  useEffect(() => {
    const music = musicRef.current;
    if (!music) return;

    // Only play if not muted AND in the /app route
    const shouldPlay = !isMusicMuted && pathname?.startsWith("/app");

    if (!shouldPlay) {
      music.pause();
    } else {
      // Try to play, but might be blocked by browser policy until interaction
      music.play().catch((e) => {
        console.log("Autoplay waiting for interaction", e);
      });
    }
  }, [isMusicMuted, pathname]);

  // Unlock audio on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      const shouldPlay = !isMusicMuted && pathname?.startsWith("/app");
      if (musicRef.current && shouldPlay && musicRef.current.paused) {
        musicRef.current
          .play()
          .catch((e) => console.error("Music play failed", e));
      }
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [isMusicMuted, pathname]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newState = !prev;
      localStorage.setItem("focus-pet-muted", JSON.stringify(newState));
      return newState;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    setIsMusicMuted((prev) => {
      const newState = !prev;
      localStorage.setItem("focus-pet-music-muted", JSON.stringify(newState));
      return newState;
    });
  }, []);

  const playSound = useCallback(
    (type: SoundType) => {
      if (isMuted) return;

      const audio = audioCache.current[type];
      if (audio) {
        // Clone for overlapping sounds of same type
        const sound = audio.cloneNode() as HTMLAudioElement;
        sound.volume = 0.4;

        // Adjust volume per type if needed
        if (type === "hover") sound.volume = 0.2;
        if (type === "click") sound.volume = 0.3;

        sound.play().catch((e) => console.warn("Audio play failed", e));
      }
    },
    [isMuted],
  );

  return (
    <AudioContext.Provider
      value={{ isMuted, isMusicMuted, toggleMute, toggleMusic, playSound }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
