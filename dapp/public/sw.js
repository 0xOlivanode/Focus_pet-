// FocusPet Service Worker

// Activate immediately on install/update
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

// ── Server push notifications ──────────────────────────────────────────────

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(data.title ?? "FocusPet", {
      body: data.body ?? "Something needs your attention.",
      icon: "/focus-pet.png",
      badge: "/focus-pet.png",
      tag: data.tag ?? "focuspet",
      renotify: true,
      data: { url: data.url ?? "/app" },
      vibrate: [200, 100, 200],
    }),
  );
});

// ── Local scheduled notifications (focus timer) ────────────────────────────

let focusReminderTimer = null;

self.addEventListener("message", (event) => {
  const { type, endTime } = event.data ?? {};

  if (type === "SCHEDULE_FOCUS_REMINDER") {
    // Clear any existing scheduled reminder first
    if (focusReminderTimer !== null) {
      clearTimeout(focusReminderTimer);
      focusReminderTimer = null;
    }

    // Fire 60 seconds before the session ends
    const delay = endTime - 60_000 - Date.now();

    // Only schedule if there's actually a minute left
    if (delay <= 0) return;

    focusReminderTimer = setTimeout(() => {
      self.registration.showNotification("⏱ 1 minute left!", {
        body: "Your focus session is almost done — come back to record your session and earn XP.",
        icon: "/focus-pet.png",
        badge: "/focus-pet.png",
        tag: "focus-reminder",
        renotify: true,
        data: { url: "/app" },
        vibrate: [100, 50, 100],
      });
      focusReminderTimer = null;
    }, delay);
  }

  if (type === "CANCEL_FOCUS_REMINDER") {
    if (focusReminderTimer !== null) {
      clearTimeout(focusReminderTimer);
      focusReminderTimer = null;
    }
  }
});

// ── Notification click ─────────────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/app";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const existing = windowClients.find(
          (c) => c.url.includes(self.location.origin) && "focus" in c,
        );
        if (existing) return existing.focus();
        return clients.openWindow(url);
      }),
  );
});
