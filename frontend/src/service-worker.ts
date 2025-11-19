/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = 'edwin-tracker-v1';
const STATIC_ASSETS = [
	'/',
	'/login',
	'/edwin.jpg',
	'/manifest.json'
];

// Install event - cache static assets
sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(STATIC_ASSETS);
		})
	);
	sw.skipWaiting();
});

// Activate event - clean up old caches
sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames
					.filter((name) => name !== CACHE_NAME)
					.map((name) => caches.delete(name))
			);
		})
	);
	sw.clients.claim();
});

// Fetch event - network first, fall back to cache
sw.addEventListener('fetch', (event) => {
	const { request } = event;

	// Skip non-GET requests
	if (request.method !== 'GET') {
		return;
	}

	// Network first strategy for API calls
	if (request.url.includes('/api/')) {
		event.respondWith(
			fetch(request)
				.catch(() => {
					return new Response(
						JSON.stringify({ error: 'Offline' }),
						{
							status: 503,
							headers: { 'Content-Type': 'application/json' }
						}
					);
				})
		);
		return;
	}

	// Cache first for static assets
	event.respondWith(
		caches.match(request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}

			return fetch(request).then((response) => {
				// Don't cache non-successful responses
				if (!response || response.status !== 200 || response.type === 'error') {
					return response;
				}

				// Clone the response
				const responseToCache = response.clone();

				caches.open(CACHE_NAME).then((cache) => {
					cache.put(request, responseToCache);
				});

				return response;
			});
		})
	);
});

// Background sync for offline entries
sw.addEventListener('sync', (event) => {
	if (event.tag === 'sync-entries') {
		event.waitUntil(
			// This will be triggered when connection is restored
			sw.clients.matchAll().then((clients) => {
				clients.forEach((client) => {
					client.postMessage({ type: 'SYNC_ENTRIES' });
				});
			})
		);
	}
});

export {};
