const DB_NAME = 'zenRecallDB';
const STORE_NAME = 'tabs';
const DB_VERSION = 1;

class TabsDB {
    constructor() {
        this.db = null;
    }

    async init() {
        if (this.db) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                
                // Add error handler for database
                this.db.onerror = (event) => {
                    console.error('Database error:', event.target.error);
                };

                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Only create store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME);
                    // Create initial data
                    store.put({}, 'currentTabs');
                }
            };
        });
    }

    async setTabs(openedTabs) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);

            store.put(openedTabs, 'currentTabs');
        });
    }

    async getTabs() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get('currentTabs');

            transaction.oncomplete = () => resolve(request.result || {});
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async clearTabs() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);

            store.put({}, 'currentTabs'); // Instead of clear, set to empty object
        });
    }
}

const tabsDB = new TabsDB();