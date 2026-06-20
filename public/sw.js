// droply service worker — minimal, enables PWA install + share target
const CACHE = 'droply-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Pass-through fetch — let Next.js handle all requests normally
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});
