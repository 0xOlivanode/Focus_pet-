"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

async function subscribe(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription | null> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return null;

  // Convert VAPID key from base64url to Uint8Array
  const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
  const base64 = (publicKey + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawKey = window.atob(base64);
  const applicationServerKey = Uint8Array.from(rawKey, (c) => c.charCodeAt(0));

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
}

export function NotificationBell() {
  const { address } = useAccount();
  const [permission, setPermission] = useState<PermissionState>("default");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PermissionState);
  }, []);

  // Auto-prompt once when the user is connected and hasn't been asked yet
  useEffect(() => {
    if (!address) return;
    if (permission !== "default") return;
    if (localStorage.getItem("notification-prompted")) return;

    const t = setTimeout(() => {
      localStorage.setItem("notification-prompted", "1");
      handleClick();
    }, 4000);

    return () => clearTimeout(t);
  }, [address, permission]);

  if (permission === "unsupported") return null;

  const handleClick = async () => {
    if (!address) {
      toast.error("Sign in first.");
      return;
    }

    if (permission === "denied") {
      toast.error(
        "Notifications blocked. Enable them in your browser settings.",
        { duration: 4000 },
      );
      return;
    }

    if (permission === "granted") {
      // Unsubscribe
      setIsLoading(true);
      try {
        const reg = await registerServiceWorker();
        const existing = await reg?.pushManager.getSubscription();
        await existing?.unsubscribe();
        await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
        setPermission("default");
        toast.success("Notifications disabled.");
      } catch {
        toast.error("Failed to disable notifications.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Request permission and subscribe
    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();

      if (result !== "granted") {
        setPermission(result as PermissionState);
        toast.error(
          result === "denied"
            ? "Notifications blocked. Enable them in your browser settings."
            : "Permission not granted.",
          { duration: 4000 },
        );
        return;
      }

      const reg = await registerServiceWorker();
      if (!reg) throw new Error("Service worker unavailable");

      const pushSub = await subscribe(reg);
      if (!pushSub) throw new Error("Failed to create push subscription");

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, subscription: pushSub.toJSON() }),
      });

      if (!res.ok) throw new Error("Server failed to save subscription");

      // Only flip the icon once the full flow has succeeded
      setPermission("granted");
      toast.success("Streak alerts enabled! We'll remind you before your streak breaks. 🔥", {
        duration: 4000,
      });
    } catch (err) {
      console.error("Notification subscribe error:", err);
      toast.error("Failed to enable notifications. Please try again.");
      // Don't change permission state — leave icon as-is so user can retry
    } finally {
      setIsLoading(false);
    }
  };

  const icon =
    permission === "granted" ? (
      <BellRing size={18} className="text-indigo-500" />
    ) : permission === "denied" ? (
      <BellOff size={18} />
    ) : (
      <Bell size={18} />
    );

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      title={
        permission === "granted"
          ? "Streak alerts on — click to disable"
          : "Enable streak reminders"
      }
      className={`p-2 rounded-full transition-colors disabled:opacity-50 ${
        permission === "granted"
          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
      }`}
    >
      {isLoading ? (
        <span className="w-[18px] h-[18px] border-2 border-current border-t-transparent rounded-full animate-spin block" />
      ) : (
        icon
      )}
    </button>
  );
}
