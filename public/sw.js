const CHANGE_STATIC_CACHE = 'static-v3';
const CHANGE_DYNAMIC_NAME = 'dynamic-v2';
const STATIC_FILES = [
  '/',
  '/fallback-page.html',
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
];

self.addEventListener('install', event => {
  console.log('Installing Service Worker...', event);
  event.waitUntil(
    caches.open(CHANGE_STATIC_CACHE).then(cache => {
      console.log('[Service Worker] - Pre-caching App Shell');
      // It's all about requests, not file paths!!                                    
      cache.addAll(STATIC_FILES);
    }),
  );
});

self.addEventListener('activate', event => {
  console.log('Activating Service Worker...', event);
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CHANGE_STATIC_CACHE && key !== CHANGE_DYNAMIC_NAME) {
            console.log('[Service Worker] - Removing old cache');
            caches.delete(key);
          }
        }),
      );
    }),
  );
  return self.clients.claim();
});

const isInArray = (string, array) => {
  let cachePath;

  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    console.log('matched ', string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string;
  }
  return array.indexOf(cachePath) > -1;

};

// Non-Lifecycle events

// NOTE: Cache, then Network
self.addEventListener('fetch', event => {
  // Overwrite what you want to respond
  // request are our keys
  const url = 'https://httpin.org/get';

  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      caches.open(CHANGE_DYNAMIC_NAME).then(cache => {
        return fetch(event.request)
          .then(response => {
            cache.put(event.request, response.clone());
            return response;
          });
      }),
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(caches.match(event.request));
  } else {
    // Network fallback strategy
    event.respondWith(
      caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(dynamicResponse => {
              return caches.open(CHANGE_DYNAMIC_NAME).then(cache => {
                cache.put(event.request.url, dynamicResponse.clone());
                return dynamicResponse;
              });
            })
            .catch(() => {
              return caches.open(CHANGE_STATIC_CACHE).then(cache => {
                // The old way were needed to add all the HTML pages, not dynamic 
                //if (event.request.url.indexOf('/help')) {
                // it can be returned any type of file, a dummy text, dummy foto and so on..  
                if (event.request.headers.get('accept').includes('text/html')) {
                  return cache.match('/fallback-page.html');
                }
              });
            });
        }
      }),
    );
  }
});

// NOTE: Network with cache Fallback Strategy
// !!!: Only use this approach when it's not needed
// to be present fast for the user.
// e.g: Running on the background

/* self.addEventListener("fetch", event => {
		fetch(event.request).catch(() => {
    	event.respondWith(caches.match(event.request));
   	});
 	});
*/

// !!!: Can be used in a few usage cases
// self.addEventListener('fetch', event => {
// 	fetch(event.request)
// 		.catch(() => {
// 			event.respondWith(caches.match(event.request));
// 		})
// 		.then(response => {
// 			return caches.open(CHANGE_DYNAMIC_NAME).then(cache => {
// 				cache.put(event.request.url, response.clone());
// 				return response;
// 			});
// 		});
// });
// ---

/* NOTE: Network-only strategy
// self.addEventListener('fetch', event => {
// 	event.respondWith(fetch(event.request));
// });
--- */

/* NOTE: Cache only - offline method
// Do not use this strategy, not recommended in most cases 
// (instead of install event files)

// self.addEventListener('fetch', event => {
// 	event.respondWith(caches.match(event.request));
// });
--- */

// NOTE: Fallback method with offline page
/* 
self.addEventListener("fetch", event => {
  // Overwrite what you want to respond
  // request are our keys
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      } else {
        return fetch(event.request)
          .then(dynamicResponse => {
            return caches.open(CHANGE_DYNAMIC_NAME).then(cache => {
              cache.put(event.request.url, dynamicResponse.clone());
              return dynamicResponse;
            });
          })
          .catch(() => {
            return caches.open(CHANGE_STATIC_CACHE).then(cache => {
              return cache.match("/fallback-page.html");
            });
          });
      }
    })
  );
});
*/
