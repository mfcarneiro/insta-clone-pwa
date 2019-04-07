const shareImageButton = document.querySelector('#share-image-button');
const createPostArea = document.querySelector('#create-post');
const sharedMomentsArea = document.querySelector('#shared-moments');
const closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');

const openCreatePostModal = () => {
	createPostArea.style.display = 'block';

	if (deferredPrompt) {
		deferredPrompt.prompt();

		deferredPrompt.userChoice.then(choiceResult => {
			console.log(choiceResult.outcome);

			if (choiceResult.outcome === 'dismissed') {
				console.log('User cancelled installation');
			} else {
				console.log('User added to home screen');
			}
		});

		deferredPrompt = null;
	}
};

const closeCreatePostModal = () => {
	createPostArea.style.display = 'none';
};
// saves cache on demand otherwise
// function onSaveButtonClicked() {
//  console.log('clicked');
//    if ('caches' in window) {
//      caches.open('user-requested')
//        .then(cache => {
//        caches.addAll(['https://httpbin.org/get', '/src/images/sf-boat.jpg']);
//      });
//  }
// };

shareImageButton.addEventListener('click', openCreatePostModal);
closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

const clearCard = () => {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
};
const createCard = () => {
	const cardWrapper = document.createElement('div');
	cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';

	const cardTitle = document.createElement('div');
	cardTitle.className = 'mdl-card__title text-center';
	cardTitle.style.backgroundImage = 'url("/src/images/sf-boat.jpg")';
	cardTitle.style.backgroundSize = 'cover';
	cardTitle.style.height = '180px';

	cardWrapper.appendChild(cardTitle);

	const cardTitleTextElement = document.createElement('h2');
	cardTitleTextElement.style.color = 'white';
	cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = 'San Francisco Trip';

	cardTitle.appendChild(cardTitleTextElement);

	const cardSupportingText = document.createElement('div');
	cardSupportingText.className = 'mdl-card__supporting-text';
	cardSupportingText.textContent = 'In San Francisco';
  cardSupportingText.style.textAlign = 'center';

// const cardSaveButton = document.createElement('button');
// cardSaveButton.textContent = 'Save';
// cardSaveButton.addEventListener('click', onSaveButtonClicked);
// cardSupportingText.appendChild(cardSaveButton);

	cardWrapper.appendChild(cardSupportingText);
	componentHandler.upgradeElement(cardWrapper);
	sharedMomentsArea.appendChild(cardWrapper);
};

const url = 'https://httpbin.org/get';
const networkDataReceive = false;

fetch('https://httpbin.org/get', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    message: 'A message'
  })
})
	.then(res => {
		return res.json();
	})
	.then(data => {
    clearCard();
		createCard();
  });

if ('caches' in window) {
  caches.match(url)
    .then(response => {
      if (response) {
        return response.json();
      }
    })
    .then(data => {
      if (!networkDataReceive) {
        clearCard();
        createCard(); 
      }
    })
};

