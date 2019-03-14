const CACHE_STATIC_NAME = 'static-v4';
const CHANGE_DYNAMIC_NAME = 'dynamic-v2';

self.addEventListener('install', event => {
	console.log('Installing Service Worker...', event);
	event.waitUntil(
		caches.open(CACHE_STATIC_NAME).then(cache => {
			console.log('[Service Worker] - Pre-caching App Shell');
			// It's all about requests, not file paths!!
			// cache.add('/');
			// cache.add('/index.html');
			// cache.add('/src/js/app.js');
			cache.addAll([
				'/',
				'/index.html',
				'/src/js/app.js',
				'/src/js/feed.js',
				'/src/js/material.min.js',
				'/src/css/app.css',
				'/src/css/feed.css',
				'/src/images/main-image.jpg',
				'https://fonts.googleapis.com/css?family=Roboto:400,700',
				'https://fonts.googleapis.com/icon?family=Material+Icons',
				'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
			]);
		}),
	);
});

self.addEventListener('activate', event => {
	console.log('Activating Service Worker...', event);
	event.waitUntil(
		caches.keys().then(keyList => {
			return Promise.all(
				keyList.map(key => {
					if (key !== CACHE_STATIC_NAME && key !== CHANGE_DYNAMIC_NAME) {
						console.log('[Service Worker] - Removing odl cache');
						caches.delete(key);
					}
				}),
			);
		}),
	);
	return self.clients.claim();
});

// Non-Lifecycle events
self.addEventListener('fetch', event => {
	// Overwrite what you want to respond
	// request are our keys
	event.respondWith(
		caches.match(event.request).then(response => {
			if (response) {
				return response;
			} else {
				return fetch(event.request)
					.then(dynamicResponse => {
						caches.open(CHANGE_DYNAMIC_NAME).then(cache => {
							cache.put(event.request.url, dynamicResponse.clone());
							return dynamicResponse;
						});
					})
					.catch(err => {
						console.log(err);
					});
			}
		}),
	);
});
