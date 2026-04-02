"use client";
import { LandingPage } from "@/components/LandingPage";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // MiniPay users never need the marketing page
    if ((window.ethereum as any)?.isMiniPay) {
      router.replace("/app");
    }
  }, []);

  return <LandingPage />;
}
