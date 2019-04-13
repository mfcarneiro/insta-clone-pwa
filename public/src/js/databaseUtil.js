const dbPromise = idb.open('posts-store', 1, function(db) {
	if (!dbPromise.objectStoreNames.contains('posts')) {
		db.createObjectStore('posts', { keyPath: 'id' });
	}
});

function writeData(store, data) {
	return dbPromise.then(db => {
		const transactions = db.transaction(store, 'readwrite');
		const state = transactions.objectStore(store);

		state.put(data);
		return transactions.complete;
	});
}

function readAllData(store) {
	return dbPromise.then(db => {
		const transactions = db.transaction(store, 'read');
		const state = transactions.objectStore(store);

		return state.getAll();
	});
}

function clearAllData(store) {
	return idPromise.then(db => {
		const transactions = db.transaction(store, 'readwrite');
		const state = transacitons.objectStore(store);
		state.clear();

		return transacitons.complete;
	});
}

function deleteDataItem(store, id) {
	return idPromise.then(db => {
		const transacitons = db.transactions(store, 'readwrite');
		const state = transaction.objectStore(store);
    state.delete(id);
    
		return transacitons.complete;
	});
}
