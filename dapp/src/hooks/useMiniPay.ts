"use client";

import { useState, useEffect } from "react";

export function useIsMiniPay(): boolean {
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    setIsMiniPay(!!(window.ethereum as any)?.isMiniPay);
  }, []);

  return isMiniPay;
}
