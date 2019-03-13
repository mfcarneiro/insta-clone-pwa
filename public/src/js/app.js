let deferredPrompt;

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/sw.js').then(() => {
		console.log('Service Worker registered');
	});
}

window.addEventListener('beforeinstallprompt', event => {
	console.log('beforeinstallprompt fired!');
	event.preventDefault();
	deferredPrompt = event;

	return false;
});
