// Self-unregistering service worker to clean up previously registered PWA service workers
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => {
      return self.clients.matchAll({ type: 'window' });
    })
  );
});
