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
  title: "FocusPet",
  description: "Focus to grow your pet. Earn G$.",
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://focus-pet-frame.vercel.app/api/og", // Placeholder
    "fc:frame:button:1": "Start Focusing",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://focus-pet-frame.vercel.app",
  },
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
