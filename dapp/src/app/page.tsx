"use client";
import { LandingPage } from "@/components/LandingPage";
import { useAccount } from "wagmi";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  // useEffect(() => {
  //   if (isConnected) {
  //     router.push("/app");
  //   }
  // }, [isConnected, router]);

  return <LandingPage />;
}
