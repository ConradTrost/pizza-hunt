
// create variable to hold db connection
let db;
// establish connection to indexedDB db called 'pizza_hunt' version 1
const request = indexedDB.open('pizza_hunt', 1);

request.onupgradeneeded = function(event) {
    // save a reference to the db
    const db = event.target.result;
    // create obkect store called 'new_pizza'
    db.createObjectStore('new_pizza', { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;

    // check if online
    if (navigator.online) {
        uploadPizza();
    }
};

request.onerror = function(event) {
    // log err
    console.log(event.target.errorCode);
}

// if offline
function saveRecord(record) {
    // open transaction w/ db w/ read/write permissions
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    // access object store
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    // add record to store
    pizzaObjectStore.add(record);
};

// upload to mongoDB
function uploadPizza() {
    const transaction = db.transaction(['new_pizza'], 'readwrite');
    const pizzaObjectStore = transaction.objectStore('new_pizza');
    const getAll = pizzaObjectStore.getAll();

    getAll.onsuccess = function() {
        if(getAll.result.length > 0) {
            fetch('/api/pizzas', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open another transaction
                const transaction = db.transaction(['new_pizza'], 'readwrite');
                const pizzaObjectStore = transaction.objectStore('new_pizza');
                // clear store
                pizzaObjectStore.clear();

                alert('All saved pizzas have been submitted...');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
};

window.addEventListener('online', uploadPizza);