let db;
const request = indexedDB.open('budget-tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result
    db.createObjectStore('new_amount', {
        autoIncrement: true
    })
}

request.onsuccess = function(event) {
    db = event.target.result
    if(navigator.onLine) {
        uploadBudget()
    }
}

request.onerror = function(event) {
    console.log(event.target.errorCode)
}

// Add transactions to budget
function saveRecord(budget) {
    const transaction = db.transaction(['new_amount'], 'readwrite')

    const amountObjectStore = transaction.objectStore('new_amount')

    amountObjectStore.add(budget)
}

// If there are items to cache, post to API
function uploadBudget() {
    const transaction = db.transaction(['new_amount'], 'readwrite')

    const amountObjectStore = transaction.objectStore('new_amount')

    const getAll = amountObjectStore.getAll()

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse)
                }

                const transaction = db.transaction(["new_budget"], 'readwrite');

                amountObjectStore.clear()
            })
        }
    }
}

// Wait for app to come back online
window.addEventListener('online', uploadBudget)