// The app used to live here and installed a service worker at this address. This replacement
// removes itself so visitors' browsers stop running the old one.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.registration.unregister().then(() => self.clients.matchAll()).then(cs => cs.forEach(c => c.navigate(c.url)))));
