import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://focus-pet-theta.vercel.app"),
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
    url: "https://focus-pet-theta.vercel.app",
    siteName: "FocusPet",
  },
  twitter: {
    card: "summary_large_image",
    title: "FocusPet | Your Gamified Deep Work Companion",
    description:
      "Hatch dinosaurs, earn G$, and climb the leaderboard by staying focused.",
    images: ["https://focus-pet-theta.vercel.app/api/og"],
    creator: "@FocusPet",
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://focus-pet-theta.vercel.app/api/og",
    "fc:frame:button:1": "Start Focusing",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://focus-pet-theta.vercel.app",
  },
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
