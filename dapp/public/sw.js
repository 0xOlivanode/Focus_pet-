// FocusPet Service Worker — handles background push notifications

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};

  event.waitUntil(
    self.registration.showNotification(data.title ?? "FocusPet", {
      body: data.body ?? "Something needs your attention.",
      icon: "/focus-pet.png",
      badge: "/focus-pet.png",
      tag: data.tag ?? "focuspet",       // Replaces older notification with same tag
      renotify: true,
      data: { url: data.url ?? "/app" },
      vibrate: [200, 100, 200],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/app";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If the app is already open, focus it
        const existing = windowClients.find(
          (c) => c.url.includes(self.location.origin) && "focus" in c,
        );
        if (existing) return existing.focus();
        return clients.openWindow(url);
      }),
  );
});
