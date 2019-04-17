const functions = require('firebase-functions');
const firebaseAdmin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const webPush = require('web-push');

const serviceAccount = require('./pwagram-fb-key.json');

firebaseAdmin.initializeApp({
	credential: firebaseAdmin.credential.cert(serviceAccount),
	databaseURL: 'https://pwa-gram-84973.firebaseio.com/',
});

exports.storePostData = functions.https.onRequest((request, response) => {
	cors(request, response, () => {
		firebaseAdmin
			.database()
			.ref('posts')
			.push({
				id: request.body.id,
				title: request.body.title,
				location: request.body.location,
				image: request.body.image,
			})
			.then(() => {
				webPush.setVapidDetails(
					'mailto: nerubiannn0dev@gmail.com',
					'BBlIyfGlxVRTExToVWg61vRTaBvk-sV0c1lFyLcaR7IcA6Qv1oPuHA_tQRZxXoTKApT-mQul8_gJLseebQDez08',
					'JXe0p-pKcwssRTMFDgsLA9wkGyFGZf5trY0iCnFuvZ8'
				);
				return firebaseAdmin
					.database()
					.ref('subscriptions')
					.once('value');
			})
			.then(subscriptions => {
				subscriptions.forEach(sub => {
					const pushConfig = {
						endpoint: sub.val().endpoint,
						keys: {
							auth: sub.val().keys.auth,
							p256dh: sub.val().keys.p256dh,
						},
					};

					webPush.sendNotification(
						pushConfig,
						JSON.stringify({ title: 'New post!', content: 'New post added!', openUrl: '/help' })
					);
				});

				response
					.status(201)
					.json({ message: 'Data stored', id: request.body.id });
			});
	});
});
