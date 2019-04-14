const functions = require('firebase-functions');
const firebaseAdmin = require('firebase-admin');
const cors = require('cors')({ origin: true });

const serviceAccount = require('./pwagram-fb-key.json');

firebaseAdmin.initializeApp({
	credential: firebaseAdmin.credential.cert(serviceAccount),
	databaseURL: process.env.fi
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
				response
					.status(201)
					.json({ message: 'Data stored', id: request.body.id });
			});
	});
});
