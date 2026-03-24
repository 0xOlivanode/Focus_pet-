import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#6366f1",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://focus-pet.xyz"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FocusPet",
  },
  title: "FocusPet | Your Gamified Deep Work Companion",
  description:
    "Transform your focus into a pet! Hatch dinosaurs, earn G$, and climb the leaderboard by staying away from distractions.",
  openGraph: {
    title: "FocusPet | Your Gamified Deep Work Companion",
    description:
      "Hatch dinosaurs, earn G$, and climb the leaderboard by staying focused.",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "FocusPet - Gamified Deep Work",
      },
    ],
    type: "website",
    url: "https://focus-pet.xyz",
    siteName: "FocusPet",
  },
  twitter: {
    card: "summary_large_image",
    title: "FocusPet | Your Gamified Deep Work Companion",
    description:
      "Hatch dinosaurs, earn G$, and climb the leaderboard by staying focused.",
    images: ["https://focus-pet.xyz/api/og"],
    creator: "@FocusPet",
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://focus-pet.xyz/api/og",
    "fc:frame:image:aspect_ratio": "1.91:1",
    "fc:frame:button:1": "🥚 Start Focusing",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://focus-pet.xyz/app",
    "fc:frame:button:2": "🏆 Leaderboard",
    "fc:frame:button:2:action": "link",
    "fc:frame:button:2:target": "https://focus-pet.xyz/leaderboard",
  },
};

import { Providers } from "./providers";
import { Suspense } from "react";
import { ReferralTracker } from "@/components/ReferralTracker";
import { SplashScreenDismiss } from "@/components/SplashScreen";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          #fp-splash {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: #0a0a0b;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            transition: opacity 0.35s ease;
          }
          #fp-splash img {
            width: 80px;
            height: 80px;
            border-radius: 20px;
            animation: fp-pulse 2s ease-in-out infinite;
          }
          #fp-splash span {
            font-size: 22px;
            font-weight: 900;
            letter-spacing: -0.03em;
            color: #fff;
          }
          #fp-splash p {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #6366f1;
          }
          @keyframes fp-pulse {
            0%, 100% { transform: scale(1);   opacity: 1;    }
            50%       { transform: scale(1.08); opacity: 0.85; }
          }
        `}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        {/* Splash — painted before any JS, dismissed on first React mount */}
        <div id="fp-splash">
          <img src="/focus-pet.png" alt="FocusPet" />
          <span>FocusPet</span>
          <p>Stay Focused</p>
        </div>

        <SplashScreenDismiss />
        <Suspense fallback={null}>
          <ReferralTracker />
        </Suspense>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
