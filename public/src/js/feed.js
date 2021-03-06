const shareImageButton = document.querySelector('#share-image-button');
const createPostArea = document.querySelector('#create-post');
const closeCreatePostModalButton = document.querySelector(
	'#close-create-post-modal-btn'
);
const sharedMomentsArea = document.querySelector('#shared-moments');
const form = document.querySelector('form');
const titleInput = document.querySelector('#title');
const locationInput = document.querySelector('#location');
const videoPlayer = document.querySelector('#player');
const canvasElement = document.querySelector('#canvas');
const captureButton = document.querySelector('#capture-btn');
const imagePicker = document.querySelector('#image-picker');
const imagePickArea = document.querySelector('#pick-image');
const locationBtn = document.querySelector('#location-btn');
const locationLoader = document.querySelector('#location-loader');
const manualLocationDiv = document.querySelector('#manual-location');
let picture;
let fetchLocation = {
	lat: 0,
	lng: 0,
};

function initializeMedia() {
	if (!('mediaDevices' in navigator)) {
		navigator.mediaDevices = {};
	}

	if (!('getUserMedia' in navigator.mediaDevices)) {
		navigator.mediaDevices.getUserMedia = function(constrains) {
			const getUserMedia =
				navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

			if (!getUserMedia) {
				return Promise.reject(
					new Error('The getUser method is not implemented')
				);
			}

			return new Promise(function(resolve, reject) {
				getUserMedia.call(navigator, constrains, resolve, reject);
			});
		};
	}

	navigator.mediaDevices
		.getUserMedia({ video: true })
		.then(function(stream) {
			videoPlayer.srcObject = stream;
			videoPlayer.style.display = 'block';
		})
		.catch(function(err) {
			imagePickArea.style.display = 'block';
		});
}

function initializeLocation() {
	if (!('geolocation' in navigator)) {
		locationBtn.style.display = 'none';
	}
}

locationBtn.addEventListener('click', function(event) {
	if (!('geolocation' in navigator)) {
		return;
	}
	let isLocationAlerted = false;

	locationBtn.style.display = 'none';
	locationLoader.style.display = 'block';

	navigator.geolocation.getCurrentPosition(
		function(position) {
			locationBtn.style.display = 'inline';
			locationLoader.style.display = 'none';

			fetchLocation = {
				lat: position.coords.latitude,
				lng: position.coords.longitude,
			};

			locationInput.value = 'in Blumenau';
			manualLocationDiv.classList.add('is-focused');
		},
		function(err) {
			locationBtn.style.display = 'inline';
			locationLoader.style.display = 'none';
			fetchLocation = { lat: 0, lng: 0 };

			if (!isLocationAlerted) {
				alert("Couldn't find your location, please enter manually");
				isLocationAlerted = true;
			}
		},
		{ timeout: 5000 }
	);
});

captureButton.addEventListener('click', function(event) {
	canvasElement.style.display = 'block';
	videoPlayer.style.display = 'none';
	captureButton.style.display = 'none';

	const context = canvasElement.getContext('2d');
	context.drawImage(
		videoPlayer,
		0,
		0,
		canvas.width,
		videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width)
	);

	closeVideoStream();

	picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener('change', function(event) {
	picture = event.target.files[0];
});

function openCreatePostModal() {
	setTimeout(function() {
		createPostArea.style.transform = 'translateY(0)';
	}, 1);

	initializeMedia();
	initializeLocation();

	if (deferredPrompt) {
		deferredPrompt.prompt();

		deferredPrompt.userChoice.then(function(choiceResult) {
			console.log(choiceResult.outcome);

			if (choiceResult.outcome === 'dismissed') {
				console.log('User cancelled installation');
			} else {
				console.log('User added to home screen');
			}
		});

		deferredPrompt = null;
	}

	// if ('serviceWorker' in navigator) {
	//   navigator.serviceWorker.getRegistrations()
	//     .then(function(registrations) {
	//       for (let i = 0; i < registrations.length; i++) {
	//         registrations[i].unregister();
	//       }
	//     })
	// }
}

function closeCreatePostModal() {
	imagePickArea.style.display = 'none';
	videoPlayer.style.display = 'none';
	canvasElement.style.display = 'none';
	locationBtn.style.display = 'inline';
	locationLoader.style.display = 'none';
	captureButton.style.display = 'inline';

	closeVideoStream();

	setTimeout(function() {
		createPostArea.style.transform = 'translateY(100vh)';
	}, 1);
}

shareImageButton.addEventListener('click', openCreatePostModal);
closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// Currently not in use, allows to save assets in cache on demand otherwise
function onSaveButtonClicked(event) {
	console.log('clicked');

	if ('caches' in window) {
		caches.open('user-requested').then(function(cache) {
			cache.add('https://httpbin.org/get');
			cache.add('/src/images/sf-boat.jpg');
		});
	}
}

function clearCards() {
	while (sharedMomentsArea.hasChildNodes()) {
		sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
	}
}

function createCard(data) {
	let cardWrapper = document.createElement('div');
	cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';

	let cardTitle = document.createElement('div');
	cardTitle.className = 'mdl-card__title';
	cardTitle.style.backgroundImage = 'url(' + data.image + ')';
	cardTitle.style.backgroundSize = 'cover';
	cardWrapper.appendChild(cardTitle);

	let cardTitleTextElement = document.createElement('h2');
	cardTitleTextElement.style.color = 'white';
	cardTitleTextElement.className = 'mdl-card__title-text';
	cardTitleTextElement.textContent = data.title;
	cardTitle.appendChild(cardTitleTextElement);

	let cardSupportingText = document.createElement('div');
	cardSupportingText.className = 'mdl-card__supporting-text';
	cardSupportingText.textContent = data.location;
	cardSupportingText.style.textAlign = 'center';

	// let cardSaveButton = document.createElement('button');
	// cardSaveButton.textContent = 'Save';
	// cardSaveButton.addEventListener('click', onSaveButtonClicked);
	// cardSupportingText.appendChild(cardSaveButton);

	cardWrapper.appendChild(cardSupportingText);
	componentHandler.upgradeElement(cardWrapper);
	sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
	clearCards();

	for (let i = 0; i < data.length; i++) {
		createCard(data[i]);
	}
}

const url = 'https://pwa-gram-84973.firebaseio.com/posts.json';
let networkDataReceived = false;

fetch(url)
	.then(function(res) {
		return res.json();
	})
	.then(function(data) {
		networkDataReceived = true;
		console.log('From web', data);
		const dataArray = [];

		for (let key in data) {
			dataArray.push(data[key]);
		}
		updateUI(dataArray);
	});

if ('indexedDB' in window) {
	readAllData('posts').then(function(data) {
		if (!networkDataReceived) {
			console.log('From cache', data);
			updateUI(data);
		}
	});
}

function sendData() {
	const postData = new FormData();
	const postDataId = new Date().toISOString();

	postData.append('id', postDataId);
	postData.append('title', titleInput.value);
	postData.append('location', locationInput.value);
	postData.append('rawLocationLat', fetchLocation.lat);
	postData.append('rawLocationLng', fetchLocation.lng);
	postData.append('file', picture, postDataId + '.png');

	fetch('https://us-central1-pwa-gram-84973.cloudfunctions.net/storePostData', {
		method: 'POST',
		body: postData,
	}).then(function(res) {
		console.log('Sent data', res);
		updateUI();
	});
}

form.addEventListener('submit', event => {
	event.preventDefault();

	if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
		alert('Please enter valid data!');
		return;
	}

	closeCreatePostModal();

	if ('serviceWorker' in navigator && 'SyncManager' in window) {
		navigator.serviceWorker.ready.then(function(sw) {
			const post = {
				id: new Date().toISOString(),
				title: titleInput.value,
				location: locationInput.value,
				picture: picture,
				rawLocation: fetchLocation,
			};
			writeData('sync-posts', post)
				.then(function() {
					return sw.sync.register('sync-new-posts');
				})
				.then(function() {
					const snackbarContainer = document.querySelector(
						'#confirmation-toast'
					);
					const data = { message: 'Your Post was saved for syncing!' };
					snackbarContainer.MaterialSnackbar.showSnackbar(data);
				})
				.catch(function(err) {
					console.log(err);
				});
		});
	} else {
		sendData();
	}
});

function closeVideoStream() {
	const videoPlayerSource = videoPlayer.srcObject;

	if (videoPlayerSource) {
		videoPlayerSource.getVideoTracks().forEach(function(track) {
			track.stop();
		});
	}
}
