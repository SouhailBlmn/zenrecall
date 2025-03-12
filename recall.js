
// Initialize database
let dbInitialized = false;

async function initDB() {
    if (!dbInitialized) {
        await tabsDB.init();
        dbInitialized = true;
    }
}

// Add this at the top of recall.js
browser.runtime.onStartup.addListener(async () => {
    await initDB();
});

// Initialize storage for opened tabs and windows
browser.runtime.onInstalled.addListener(async (details) => {
    await initDB();
    
    // Only set empty tabs if it's a new installation
    if (details.reason === 'install') {
        await tabsDB.setTabs({});
    }
});

// Store tabs every 5 minutes instead of every hour
setInterval(async () => {
    try {
        await initDB();
        const tabs = await browser.tabs.query({});
        const openedTabs = {};
        
        tabs.forEach((tab) => {
            const windowId = tab.windowId.toString(); // Convert to string for consistency
            if (!openedTabs[windowId]) {
                openedTabs[windowId] = [];
            }
            openedTabs[windowId].push({
                id: tab.id,
                url: tab.url || "about:blank",
                title: tab.title || "Untitled",
                openedAt: new Date().toISOString(),
            });
        });
        
        await tabsDB.setTabs(openedTabs);
    } catch (error) {
        console.error('Error in interval:', error);
    }
}, 300000); // 5 minutes

// Listen for when a tab is created (opened)
browser.tabs.onCreated.addListener(async (tab) => {
    try {
        await initDB();
        const openedTabs = await tabsDB.getTabs();
        const windowId = tab.windowId.toString();

        if (!openedTabs[windowId]) {
            openedTabs[windowId] = [];
        }

        openedTabs[windowId].push({
            id: tab.id,
            url: tab.url || "about:blank",
            title: tab.title || "Untitled",
            openedAt: new Date().toISOString(),
        });

        await tabsDB.setTabs(openedTabs);
    } catch (error) {
        console.error('Error in onCreated:', error);
    }
});

// Listen for when a tab is updated
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.title) {
        try {
            await initDB();
            const openedTabs = await tabsDB.getTabs();
            const windowId = tab.windowId.toString();

            if (openedTabs[windowId]) {
                const tabIndex = openedTabs[windowId].findIndex((t) => t.id === tabId);
                if (tabIndex !== -1) {
                    openedTabs[windowId][tabIndex] = {
                        ...openedTabs[windowId][tabIndex],
                        url: tab.url || "about:blank",
                        title: tab.title || "Untitled",
                    };
                }
                await tabsDB.setTabs(openedTabs);
            }
        } catch (error) {
            console.error('Error in onUpdated:', error);
        }
    }
});

// Listen for when a tab is removed
browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
    try {
        await initDB();
        const openedTabs = await tabsDB.getTabs();
        const windowId = removeInfo.windowId.toString();

        if (openedTabs[windowId]) {
            openedTabs[windowId] = openedTabs[windowId].filter((tab) => tab.id !== tabId);

            if (openedTabs[windowId].length === 0) {
                delete openedTabs[windowId];
            }
            await tabsDB.setTabs(openedTabs);
        }
    } catch (error) {
        console.error('Error in onRemoved:', error);
    }
});

// Listen for when a window is closed
browser.windows.onRemoved.addListener(async (windowId) => {
    try {
        await initDB();
        const openedTabs = await tabsDB.getTabs();
        const windowIdStr = windowId.toString();
        
        if (openedTabs[windowIdStr]) {
            delete openedTabs[windowIdStr];
            await tabsDB.setTabs(openedTabs);
        }
    } catch (error) {
        console.error('Error in window onRemoved:', error);
    }
});
