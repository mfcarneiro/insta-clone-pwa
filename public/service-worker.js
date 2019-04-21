importScripts('workbox-sw.prod.v2.0.0.js');
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const workboxSW = new self.WorkboxSW();

workboxSW.router.registerRoute(
	// prettier-ignore
	new RegExp(/.*(?:googleapis|gstatic)\.com.*$/),
	// * Same that was done with the older Service worker
	// * but know gather all the strategies within this function
	// ! Cache then network with dynamic caching strategy
	workboxSW.strategies.staleWhileRevalidate({
		cacheName: 'google-fonts',
		cacheExpiration: {
			maxEntries: 3,
			maxAgeSeconds: 60 * 60 * 24 * 30,
		},
	})
);

workboxSW.router.registerRoute(
	'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
	workboxSW.strategies.staleWhileRevalidate({
		cacheName: 'material-css',
	})
);

workboxSW.router.registerRoute(
	//prettier-ignore
	/.*(?:firebasestorage\.googleapis)\.com.*$/,
	workboxSW.strategies.staleWhileRevalidate({
		cacheName: 'post-images',
	})
);

workboxSW.router.registerRoute(
	'https://pwa-gram-84973.firebaseio.com/posts.json',
	function(args) {
		return fetch(args.event.request).then(function(res) {
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
		});
	}
);

workboxSW.router.registerRoute(
	function(routeData) {
		return routeData.event.request.headers.get('accept').includes('text/html');
	},
	function(args) {
		return caches.match(args.event.request).then(function(response) {
			if (response) {
				return response;
			} else {
				return fetch(args.event.request)
					.then(function(res) {
						return caches.open('dynamic').then(function(cache) {
							cache.put(args.event.request.url, res.clone());
							return res;
						});
					})
					.catch(function(err) {
						return caches.match('/offline.html').then(function(response) {
							return response;
						});
					});
			}
		});
	}
);

workboxSW.precache([
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "fbd7a81d120a11baf23824a0ba77b706"
  },
  {
    "url": "manifest.json",
    "revision": "d11c7965f5cfba711c8e74afa6c703d7"
  },
  {
    "url": "offline.html",
    "revision": "85876839ad50539b1dd52ceb67eb4a02"
  },
  {
    "url": "src/css/app.css",
    "revision": "3e67807e43f32ee385c7b59136082688"
  },
  {
    "url": "src/css/feed.css",
    "revision": "5348ea28d098539721893a7a671c1dda"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  },
  {
    "url": "src/js/app.min.js",
    "revision": "6101723f0e21eea8c7ed821d9ea6c6da"
  },
  {
    "url": "src/js/feed.min.js",
    "revision": "e83659995413994ca2a1cf62f758eaaa"
  },
  {
    "url": "src/js/fetch.min.js",
    "revision": "32590119a06bf9ade8026dd12baa695e"
  },
  {
    "url": "src/js/idb.min.js",
    "revision": "ea82c8cec7e6574ed535bee7878216e0"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.min.js",
    "revision": "7be19d2e97926f498f2668e055e26b22"
  },
  {
    "url": "src/js/utility.min.js",
    "revision": "78081250fc7588de426409f3144a284b"
  }
]);

self.addEventListener('sync', function(event) {
	console.log('[Service Worker] Background syncing', event);
	if (event.tag === 'sync-new-posts') {
		console.log('[Service Worker] Syncing new Posts');
		event.waitUntil(
			readAllData('sync-posts').then(function(data) {
				for (let dt of data) {
					let postData = new FormData();

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
	const action = event.action;

	console.log(notification);

	if (action === 'confirm') {
		console.log('Confirm was chosen');
		notification.close();
	} else {
		console.log(action);
		event.waitUntil(
			clients.matchAll().then(function(reachedClients) {
				let client = reachedClients.find(function(findClient) {
					return findClient.visibilityState === 'visible';
				});

				if (client !== undefined) {
					client.navigate(notification.data.url);
					client.focus();
				} else {
					clients.openWindow(notification.data.url);
				}

				notification.close();
			})
		);
	}
});

self.addEventListener('notificationclose', function(event) {
	console.log('Notification was closed', event);
});

self.addEventListener('push', function(event) {
	console.log('Push Notification received', event);

	const data = {
		title: 'New!',
		content: 'Something new happened!',
		openUrl: '/',
	};

	if (event.data) {
		data = JSON.parse(event.data.text());
	}

	const notificationOptions = {
		body: data.content,
		icon: '/src/images/icons/app-icon-96x96.png',
		badge: '/src/images/icons/app-icon-96x96.png',
		data: {
			url: data.openUrl,
		},
	};

	event.waitUntil(
		self.registration.showNotification(data.title, notificationOptions)
	);
});
