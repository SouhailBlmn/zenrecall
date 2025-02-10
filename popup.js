
// Function to display the current list of stored tabs
function displayTabs() {
	const tabList = document.getElementById("tab-list");
	tabList.innerHTML = ""; // Clear the list

	// Get the stored tabs from browser storage
	browser.storage.local.get("openedTabs").then((data) => {
		const openedTabs = data.openedTabs || {};
		if (Object.keys(openedTabs).length === 0) {
			tabList.innerHTML = "<li>No tabs stored yet.</li>";
		} else {
			Object.entries(openedTabs).forEach(([windowId, tabs]) => {
				const windowHeader = document.createElement("h2");
				windowHeader.textContent = `Window ${windowId}`;
				tabList.appendChild(windowHeader);

				tabs.forEach((tab) => {
					const listItem = document.createElement("div");
					listItem.className = "tab-item";
					listItem.innerHTML = `
            <span>${tab.title} - ${tab.url}</span>
            <span class="delete-icon" data-id="${tab.id}" data-window-id="${windowId}">🗑️</span>
          `;
					tabList.appendChild(listItem);
				});
			});
		}
	});
}

// Function to clear all stored tabs
function clearAllTabs() {
	browser.storage.local.set({ openedTabs: {} }).then(() => {
		displayTabs(); // Refresh the displayed list
	});
}

// Function to delete a specific tab
function deleteTab(tabId, windowId) {
	browser.storage.local.get("openedTabs").then((data) => {
		const openedTabs = data.openedTabs || {};
		if (openedTabs[windowId]) {
			openedTabs[windowId] = openedTabs[windowId].filter((tab) => tab.id !== parseInt(tabId, 10));

			if (openedTabs[windowId].length === 0) {
				delete openedTabs[windowId];
			}
		}

		browser.storage.local.set({ openedTabs }).then(() => {
			displayTabs(); // Refresh the displayed list
		});
	});
}

// Function to restore all stored tabs and windows
function restoreTabs() {
	browser.storage.local.get("openedTabs").then((data) => {
		const openedTabs = data.openedTabs || {};
		Object.entries(openedTabs).forEach(([windowId, tabs]) => {
			browser.windows.create().then((newWindow) => {
				tabs.forEach((tab, index) => {
					if (index === 0) {
						// Update the first tab in the new window
						browser.tabs.update(newWindow.tabs[0].id, { url: tab.url });
					} else {
						// Create additional tabs
						browser.tabs.create({ url: tab.url, windowId: newWindow.id });
					}
				});
			});
		});
	});
}

// Add event listeners to the buttons
document.getElementById("clear-tabs").addEventListener("click", clearAllTabs);
document.getElementById("open-tabs").addEventListener("click", restoreTabs);

// Add event listener for delete icons
document.getElementById("tab-list").addEventListener("click", (event) => {
	if (event.target.classList.contains("delete-icon")) {
		const tabId = event.target.getAttribute("data-id");
		const windowId = event.target.getAttribute("data-window-id");
		deleteTab(tabId, windowId);
	}
});

// Display the current list of tabs when the popup is opened
document.addEventListener("DOMContentLoaded", displayTabs);
