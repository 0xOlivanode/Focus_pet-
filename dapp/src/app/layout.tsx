import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Mono, Anton, Outfit } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const outfit = Outfit({
  variable: "--font-outfit",
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
    "fc:frame:button:1:target": "https://app.focus-pet.xyz",
    "fc:frame:button:2": "🏆 Leaderboard",
    "fc:frame:button:2:action": "link",
    "fc:frame:button:2:target": "https://app.focus-pet.xyz/leaderboard",
  },
};

import { Providers } from "./providers";
import { Suspense } from "react";
import { ReferralTracker } from "@/components/ReferralTracker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta
          name="talentapp:project_verification"
          content="858dc14ac0b79bd7e4c08daf20d423ad06a7b12bf81ec6d1c71d98f4187f74f27684f57b35ba49e566b83f0123302c20e02b1fc3ecd0291277535a34cc8bf4d8"
        ></meta>
      </head>
      <body
        className={`${dmSans.variable} ${dmMono.variable} ${anton.variable} ${outfit.variable} antialiased overflow-x-hidden`}
      >
        <Suspense fallback={null}>
          <ReferralTracker />
        </Suspense>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
