importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const CACHE_STATIC_NAME = 'static-v35';
const CACHE_DYNAMIC_NAME = 'dynamic-v4';
const STATIC_FILES = [
	'/',
	'/index.html',
	'/offline.html',
	'/src/js/app.js',
	'/src/js/utility.js',
	'/src/js/feed.js',
	'/src/js/idb.js',
	'/src/js/promise.js',
	'/src/js/fetch.js',
	'/src/js/material.min.js',
	'/src/css/app.css',
	'/src/css/feed.css',
	'/src/images/main-image.jpg',
	'https://fonts.googleapis.com/css?family=Roboto:400,700',
	'https://fonts.googleapis.com/icon?family=Material+Icons',
	'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
];

self.addEventListener('install', function(event) {
	console.log('[Service Worker] Installing Service Worker ...', event);
	event.waitUntil(
		caches.open(CACHE_STATIC_NAME).then(function(cache) {
			console.log('[Service Worker] Pre-caching App Shell');
			cache.addAll(STATIC_FILES);
		})
	);
});

self.addEventListener('activate', function(event) {
	console.log('[Service Worker] Activating Service Worker ....', event);
	event.waitUntil(
		caches.keys().then(function(keyList) {
			return Promise.all(
				keyList.map(function(key) {
					if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
						console.log('[Service Worker] Removing old cache.', key);
						return caches.delete(key);
					}
				})
			);
		})
	);
	return self.clients.claim();
});

function isInArray(string, array) {
	let cachePath;

	if (string.indexOf(self.origin) === 0) {
		// request targets domain where we serve the page from (i.e. NOT a CDN)
		console.log('matched ', string);
		cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
	} else {
		cachePath = string; // store the full request (for CDNs)
	}
	return array.indexOf(cachePath) > -1;
}

self.addEventListener('fetch', function(event) {
	calc;
	const url = 'https://pwa-gram-84973.firebaseio.com/posts';

	if (event.request.url.indexOf(url) > -1) {
		event.respondWith(
			fetch(event.request).then(function(res) {
				const clonedRes = res.clone();
				clearAllData('posts')
					.then(function() {
						return clonedRes.json();
					})
					.then(function(data) {
						for (let key in data) {
							writeData('posts', data[key]);
						}
					});
				return res;
			})
		);
	} else if (isInArray(event.request.url, STATIC_FILES)) {
		event.respondWith(caches.match(event.request));
	} else {
		event.respondWith(
			caches.match(event.request).then(function(response) {
				if (response) {
					return response;
				} else {
					return fetch(event.request)
						.then(function(res) {
							return caches.open(CACHE_DYNAMIC_NAME).then(function(cache) {
								cache.put(event.request.url, res.clone());
								return res;
							});
						})
						.catch(function(err) {
							return caches.open(CACHE_STATIC_NAME).then(function(cache) {
								if (event.request.headers.get('accept').includes('text/html')) {
									return cache.match('/offline.html');
								}
							});
						});
				}
			})
		);
	}
});

self.addEventListener('sync', function(event) {
	console.log('[Service Worker] Background syncing', event);

	if (event.tag === 'sync-new-posts') {
		console.log('[Service Worker] Syncing new Posts');

		event.waitUntil(
			readAllData('sync-posts').then(function(data) {
				for (let dt of data) {
					const postData = new FormData();
					postData.append('id', dt.id);
					postData.append('title', dt.title);
					postData.append('location', dt.location);
					postData.append('rawLocationLat', dt.rawLocation.lat);
					postData.append('rawLocationLng', dt.rawLocation.lng);
					postData.append('file', dt.picture, dt.id + '.png');

					fetch(
						'https://us-central1-pwa-gram-84973.cloudfunctions.net/storePostData',
						{
							method: 'POST',
							body: postData,
						}
					)
						.then(function(res) {
							console.log('Sent data', res);
							if (res.ok) {
								res.json().then(function(resData) {
									deleteItemFromData('sync-posts', resData.id);
								});
							}
						})
						.catch(function(err) {
							console.log('Error while sending data', err);
						});
				}
			})
		);
	}
});

self.addEventListener('notificationclick', function(event) {
	const notification = event.notification;
	const action = notification.action;

	// Same used on app.js, when registering on the notification
	if (action === 'confirm') {
		console.log('Confirm was chosen!');
	} else {
		event.waitUntil(
			clients.matchAll().then(function(reachedClients) {
				const client = reachedClients.find(function(findClient) {
					return findClient.visibilityState === 'visible';
				});

				if (client !== undefined) {
					findClient.navigate(notification.data.url);
					findClient.focus();
				} else {
					clients.openWindow(notification.data.url);
				}
				notification.close();
			})
		);
	}

	notification.close();
	event.waitUntil();
});

self.addEventListener('push', function(event) {
	let data = {
		title: 'New post!',
		content: 'Something new happened!',
		openUrl: '/',
	};

	if (event.data) {
		data = JSON.parse(event.data.text());
	}
	const notificationOptions = {
		body: data.content,
		icon: '/src/images/icons/app-icon-96x96x.png',
		badge: '/src/images/icons/app-icon-96x96x.png',
		// * Extra metadata that can be accessed by notification api and be used
		// * to redirect to the wanted url
		data: {
			url: data.openUrl,
		},
	};

	event.waitUntil(
		self.registration.showNotification(data.title, notificationOptions)
	);
});

// NOTE: Use case for analytics, get the data of user that why not interacted or used the notification
// self.addEventListener('notificationclose', event => {
// 	event.notification.close();
// 	event.waitUntil(

// 	);
// });

// !Cache strategies below
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then(function(response) {
//         if (response) {
//           return response;
//         } else {
//           return fetch(event.request)
//             .then(function(res) {
//               return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//             })
//             .catch(function(err) {
//               return caches.open(CACHE_STATIC_NAME)
//                 .then(function(cache) {
//                   return cache.match('/offline.html');
//                 });
//             });
//         }
//       })
//   );
// });

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(function(res) {
//         return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//       })
//       .catch(function(err) {
//         return caches.match(event.request);
//       })
//   );
// });

// Cache-only
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });

// Network-only
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     fetch(event.request)
//   );
// });
