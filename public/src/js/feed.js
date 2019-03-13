const shareImageButton = document.querySelector('#share-image-button');
const createPostArea = document.querySelector('#create-post');
const closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');

openCreatePostModal = () => {
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

closeCreatePostModal = () => {
	createPostArea.style.display = 'none';
};

shareImageButton.addEventListener('click', openCreatePostModal);
closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);
