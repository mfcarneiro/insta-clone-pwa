self.addEventListener('install', event => {
	console.log('Installing Service Worker...', event);
});

self.addEventListener('activate', event => {
	console.log('Activating Service Worker...', event);
});

// Non-Lifecycle events

self.addEventListener('fetch', event => {
	console.log('[Service Worker] Feching something...', event);
	// Overwrite what you want to respond
	event.respondWith(fetch(event.request));
});
