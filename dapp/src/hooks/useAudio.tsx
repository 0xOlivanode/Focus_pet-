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
  ambientTrack: string | null;
  setAmbientTrack: (track: "rain" | "lofi" | null) => void;
  vibrate: (pattern?: number | number[]) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const [isMuted, setIsMuted] = useState(false);
  const pathname = usePathname();

  // Load mute state from local storage
  useEffect(() => {
    const stored = localStorage.getItem("focus-pet-muted");
    if (stored) {
      setIsMuted(JSON.parse(stored));
    }
  }, []);

  const audioCache = useRef<Record<SoundType, HTMLAudioElement | null>>({
    click: null,
    hover: null,
    success: null,
    hatch: null,
    pop: null,
    buy: null,
  });

  useEffect(() => {
    const loadAudio = (type: SoundType, src: string) => {
      const audio = new Audio(src);
      audio.volume = 0.5;
      audioCache.current[type] = audio;
    };

    loadAudio("click", "/sounds/click.wav");
    loadAudio("hover", "/sounds/hover.wav");
    loadAudio("success", "/sounds/success.wav");
    loadAudio("hatch", "/sounds/success.wav");
    loadAudio("pop", "/sounds/pop.wav");
    loadAudio("buy", "/sounds/buy.wav");
  }, []);

  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("focus-pet-music-muted");
    if (stored) {
      setIsMusicMuted(JSON.parse(stored));
    }

    const music = new Audio("/sounds/background.mp3");
    music.loop = true;
    music.volume = 0.1;
    music.currentTime = 3;
    musicRef.current = music;

    return () => {
      music.pause();
      musicRef.current = null;
    };
  }, []);

  useEffect(() => {
    const music = musicRef.current;
    if (!music) return;
    const shouldPlay = !isMusicMuted && pathname?.startsWith("/app");
    if (!shouldPlay) {
      music.pause();
    } else {
      music.play().catch((e) => console.log("Autoplay waiting", e));
    }
  }, [isMusicMuted, pathname]);

  const [ambientTrack, setAmbientTrackState] = useState<string | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("focus-pet-ambient");
    if (stored) {
      setAmbientTrackState(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.pause();
      ambientRef.current = null;
    }

    if (ambientTrack) {
      localStorage.setItem("focus-pet-ambient", JSON.stringify(ambientTrack));
      const audio = new Audio(`/sounds/${ambientTrack}.mp3`);
      audio.loop = true;
      audio.volume = 0.2;
      ambientRef.current = audio;

      if (!isMuted && pathname?.startsWith("/app")) {
        audio.play().catch((e) => console.log("Ambient autoplay waiting", e));
      }
    } else {
      localStorage.removeItem("focus-pet-ambient");
    }

    return () => {
      ambientRef.current?.pause();
    };
  }, [ambientTrack, isMuted, pathname]);

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

  const setAmbientTrack = useCallback((track: "rain" | "lofi" | null) => {
    setAmbientTrackState(track);
  }, []);

  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if (
      typeof window !== "undefined" &&
      window.navigator &&
      window.navigator.vibrate
    ) {
      window.navigator.vibrate(pattern);
    }
  }, []);

  const playSound = useCallback(
    (type: SoundType) => {
      if (isMuted) return;

      const audio = audioCache.current[type];
      if (audio) {
        const sound = audio.cloneNode() as HTMLAudioElement;
        sound.volume = 0.4;
        if (type === "hover") sound.volume = 0.2;
        if (type === "click") {
          sound.volume = 0.3;
          vibrate(5);
        }
        if (type === "success") {
          vibrate([10, 50, 10]);
        }
        sound.play().catch((e) => console.warn("Audio play failed", e));
      }
    },
    [isMuted, vibrate],
  );

  return (
    <AudioContext.Provider
      value={{
        isMuted,
        isMusicMuted,
        toggleMute,
        toggleMusic,
        playSound,
        ambientTrack,
        setAmbientTrack,
        vibrate,
      }}
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
