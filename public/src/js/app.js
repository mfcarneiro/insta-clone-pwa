let deferredPrompt;
let enableNotificationButtons = document.querySelectorAll(
	'.enable-notifications'
);
const VAPID_PUBLIC_KEY =
	'BBlIyfGlxVRTExToVWg61vRTaBvk-sV0c1lFyLcaR7IcA6Qv1oPuHA_tQRZxXoTKApT-mQul8_gJLseebQDez08';

if (!window.Promise) {
	window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
	navigator.serviceWorker
		.register('/service-worker.js')
		.then(function() {
			console.log('Service worker registered!');
		})
		.catch(function(err) {
			console.log(err);
		});
}

window.addEventListener('beforeinstallprompt', function(event) {
	console.log('beforeinstallprompt fired');
	event.preventDefault();
	deferredPrompt = event;

	return false;
});

function displayConfirmNotification() {
	if ('serviceWorker' in navigator) {
		let notificationOptions = {
			body:
				'Now you will receive all the notifications about your posts and followers!',
			icon: '/src/images/icons/app-icon-96x96.png',
			image: '/src/images/sf-boat.jpg',
			dir: 'ltr', // Set the direction of the text - left to right
			lang: 'en-US', // using the format of BCP 47
			vibrate: [100, 50, 200], // set up the vibration of notification, array of intervals
			// The badge property only works on Android, because will show in the statusbar
			// Is not needed to create a personalized icon (black and white) because android automatically mask it
			// The recommended icon for this badge property is 96x96
			badge: '/src/images/icons/app-icon-96x96.png',
			// Ensure that the current notification will not display twice with the same tag
			// Can be used to stack the notification, to not spam the user, showing all notifications at the same time
			tag: 'confirm-notification',
			// Make sure that will renotify the user with the same tag, will vibrate and notify the user
			// if false, will not vibrate after the first time that was notified
			renotify: true,
			// Use an array to set up actions and interact with notifications
			actions: [
				{
					action: 'confirm',
					title: 'Mark as read',
					icon: '/src/images/icons/app-icon-96x96.png',
				},
				{
					action: 'cancel',
					title: 'Dismiss',
					icon: '/src/images/icons/app-icon-96x96.png',
				},
			],
		};

		navigator.serviceWorker.ready.then(function(register) {
			register.showNotification(
				'Successfully subscribed!',
				notificationOptions
			);
		});
	}
}

function configurePushSubscription() {
	// *NOTE: Always check for availability before using it
	if (!('serviceWorker' in navigator)) {
		return;
	}

	let registerServiceWorker;

	navigator.serviceWorker.ready
		.then(function(register) {
			registerServiceWorker = register;
			return register.pushManager.getSubscription();
		})
		.then(function(subscription) {
			if (subscription === null) {
				let convertedVapidPublicKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
				//! If passes only with subscribe(), anyone that knows your endpoint address, will can push
				//! and send any messages, and will look like the official service
				return registerServiceWorker.pushManager.subscribe({
					// *Set that only the user will see
					userVisibleOnly: true,
					applicationServerKey: convertedVapidPublicKey,
				});
			} else {
				// Already have one
			}
		})
		.then(function(newSubscription) {
			//* Pass this new subscription to the server
			return fetch('https://pwa-gram-84973.firebaseio.com/subscriptions.json', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify(newSubscription),
			});
		})
		.then(function(subscriptionResponse) {
			if (subscriptionResponse.ok) {
				displayConfirmNotification();
			}
		});
}

function askNotificationPermission() {
	Notification.requestPermission(function(result) {
		console.log('User choice', result);

		if (result !== 'granted') {
			console.log('The notifications are not allowed!');
		} else {
			configurePushSubscription();
			// displayConfirmNotification();
		}
	});
}

if ('Notification' in window && 'serviceWorker' in navigator) {
	for (let button of enableNotificationButtons) {
		button.style.display = 'inline-block';
		button.addEventListener('click', askNotificationPermission);
	}
}
