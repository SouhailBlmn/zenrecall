
// Function to display the current list of stored tabs
async function displayTabs() {
	try {
		await tabsDB.init();
		const tabList = document.getElementById("tab-list");
		tabList.innerHTML = ""; // Clear the list

		const openedTabs = await tabsDB.getTabs();
		if (Object.keys(openedTabs).length === 0) {
			tabList.innerHTML = "<li>No tabs stored yet.</li>";
		} else {
			Object.entries(openedTabs).forEach(([windowId, tabs]) => {
				const windowHeader = document.createElement("h2");
				windowHeader.textContent = `Window ${windowId}`;
				windowHeader.className = "text-lg font-semibold mt-4 mb-2";
				tabList.appendChild(windowHeader);

				tabs.forEach((tab) => {
					const listItem = document.createElement("div");
					listItem.className = "tab-item flex justify-between items-center p-2 hover:bg-gray-100 rounded";
					listItem.innerHTML = `
						<span class="truncate flex-1">${tab.title}</span>
						<span class="delete-icon cursor-pointer ml-2" data-id="${tab.id}" data-window-id="${windowId}">🗑️</span>
					`;
					tabList.appendChild(listItem);
				});
			});
		}
	} catch (error) {
		console.error('Error displaying tabs:', error);
	}
}

// Function to clear all stored tabs
async function clearAllTabs() {
	try {
		await tabsDB.init();
		await tabsDB.clearTabs();
		await displayTabs();
	} catch (error) {
		console.error('Error clearing tabs:', error);
	}
}

// Function to delete a specific tab
async function deleteTab(tabId, windowId) {
	try {
		await tabsDB.init();
		const openedTabs = await tabsDB.getTabs();
		
		if (openedTabs[windowId]) {
			openedTabs[windowId] = openedTabs[windowId].filter((tab) => tab.id !== parseInt(tabId, 10));

			if (openedTabs[windowId].length === 0) {
				delete openedTabs[windowId];
			}
			await tabsDB.setTabs(openedTabs);
			await displayTabs();
		}
	} catch (error) {
		console.error('Error deleting tab:', error);
	}
}

// Function to restore all stored tabs and windows
async function restoreTabs() {
	try {
		await tabsDB.init();
		const openedTabs = await tabsDB.getTabs();
		console.log('Stored tabs to restore:', openedTabs); // Debug log

		// Convert to array of promises
		const windowPromises = Object.entries(openedTabs).map(async ([windowId, tabs]) => {
			console.log(`Restoring window ${windowId} with tabs:`, tabs); // Debug log
			
			const urls = tabs
				.map(tab => tab.url)
				.filter(url => url && url !== "about:blank");
			
			console.log(`Filtered URLs for window ${windowId}:`, urls); // Debug log

			if (urls.length > 0) {
				return browser.windows.create({ url: urls });
			}
		});

		// Wait for all windows to be created
		await Promise.all(windowPromises);
		console.log('All windows restored'); // Debug log

	} catch (error) {
		console.error('Error restoring tabs:', error);
	}
}

async function storeCurrentOpenedTabs() {
	try {
		await tabsDB.init();
		const tabs = await browser.tabs.query({});
		const openedTabs = {};

		tabs.forEach((tab) => {
			const windowId = tab.windowId.toString();
			if (!openedTabs[windowId]) {
				openedTabs[windowId] = [];
			}
			if (tab.url !== "about:blank") {
				openedTabs[windowId].push({
					id: tab.id,
					url: tab.url,
					title: tab.title || "Untitled",
					openedAt: new Date().toISOString(),
				});
			}
		});

		await tabsDB.setTabs(openedTabs);
		await displayTabs();
	} catch (error) {
		console.error('Error storing tabs:', error);
	}
}

// Add event listeners
document.getElementById("store-tabs").addEventListener("click", storeCurrentOpenedTabs);
document.getElementById("clear-tabs").addEventListener("click", clearAllTabs);
document.getElementById("open-tabs").addEventListener("click", restoreTabs);

document.getElementById("tab-list").addEventListener("click", (event) => {
	if (event.target.classList.contains("delete-icon")) {
		const tabId = event.target.getAttribute("data-id");
		const windowId = event.target.getAttribute("data-window-id");
		deleteTab(tabId, windowId);
	}
});

document.addEventListener("DOMContentLoaded", displayTabs);
