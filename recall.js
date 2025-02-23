
// Initialize storage for opened tabs and windows
browser.runtime.onInstalled.addListener(() => {
	browser.storage.local.set({ openedTabs: {} });
});

// Clear openedTabs every hour
setInterval(() => {
	browser.tabs.query({}).then((tabs) => {
		const openedTabs = {};
		tabs.forEach((tab) => {
			const windowId = tab.windowId;
			if (!openedTabs[windowId]) {
				openedTabs[windowId] = [];
			}
			openedTabs[windowId].push({
				id: tab.id,
				url: tab.url || "New Tab",
				title: tab.title || "Untitled",
				openedAt: new Date().toISOString(),
			});
		});
		browser.storage.local.set({ openedTabs });
	});
}, 3600000);

// Listen for when a tab is created (opened)
browser.tabs.onCreated.addListener((tab) => {
	browser.storage.local.get("openedTabs").then((data) => {
		const openedTabs = data.openedTabs || {};
		const windowId = tab.windowId;

		if (!openedTabs[windowId]) {
			openedTabs[windowId] = [];
		}

		openedTabs[windowId].push({
			id: tab.id,
			url: tab.url || "New Tab",
			title: tab.title || "Untitled",
			openedAt: new Date().toISOString(),
		});

		browser.storage.local.set({ openedTabs });
	});
});

// Listen for when a tab is updated (URL or title changes)
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.url || changeInfo.title) {
		browser.storage.local.get("openedTabs").then((data) => {
			const openedTabs = data.openedTabs || {};
			const windowId = tab.windowId;

			if (openedTabs[windowId]) {
				const tabIndex = openedTabs[windowId].findIndex((t) => t.id === tabId);
				if (tabIndex !== -1) {
					openedTabs[windowId][tabIndex] = {
						...openedTabs[windowId][tabIndex],
						url: tab.url || "New Tab",
						title: tab.title || "Untitled",
					};
				}
			}

			browser.storage.local.set({ openedTabs });
		});
	}
});

// Listen for when a tab is removed (closed)
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
	browser.storage.local.get("openedTabs").then((data) => {
		const openedTabs = data.openedTabs || {};
		const windowId = removeInfo.windowId;

		if (openedTabs[windowId]) {
			openedTabs[windowId] = openedTabs[windowId].filter((tab) => tab.id !== tabId);

			if (openedTabs[windowId].length === 0) {
				delete openedTabs[windowId];
			}
		}

		browser.storage.local.set({ openedTabs });
	});
});

// Optional: Add a listener to log the current state of opened tabs for debugging
browser.storage.onChanged.addListener((changes) => {
	if (changes.openedTabs) {
		console.log("Updated openedTabs:", changes.openedTabs.newValue);
	}
});


// Listen for when a window is closed
browser.windows.onRemoved.addListener((windowId) => {
	browser.storage.local.get("openedTabs").then((data) => {
		const openedTabs = data.openedTabs || {};
		if (openedTabs[windowId]) {
			delete openedTabs[windowId]; // Remove the entire window entry
			browser.storage.local.set({ openedTabs });
		}
	});
});
