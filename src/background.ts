// Amplify Gen2 doesn't strictly require background script for simple API calls anymore,
// as hooks can call APIs directly from the side panel context.
// However, a background script is useful for:
// 1. Responding to extension icon clicks (opening side panel).
// 2. Handling events when the side panel isn't open (less relevant here).
// 3. Potentially orchestrating more complex background tasks (future).

console.log("Background service worker started.");

// --- Listener for Extension Icon Click ---
// This opens the side panel when the extension icon is clicked.
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    console.log("Extension icon clicked, attempting to open side panel.");
    chrome.sidePanel.open({ windowId: tab.windowId });
  } else {
     console.error("Cannot open side panel, tab ID is missing.");
  }
});


// --- Optional: Message Listener (if UI sends messages to background) ---
// Example: Listen for a message from the side panel/popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  if (message.action === "getTabData") {
    // Example: Get current tab info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        sendResponse({ url: tabs[0].url, title: tabs[0].title });
      } else {
        sendResponse({ error: "No active tab found." });
      }
    });
    return true; // Indicates asynchronous response
  }

  // Add other message handlers if needed

  // Default response if message is not handled
  // sendResponse({ status: "Message not handled by background script." });
  // return false; // No async response needed
});

// --- Optional: Keep service worker alive (use carefully) ---
// If doing long-running background tasks or needing persistent listeners,
// you might need strategies like connecting to a port. For this app's
// current scope (API calls driven by UI), it's likely not necessary.
// let lifelinePort: chrome.runtime.Port | null = null;
// function keepAlive() {
//   if (lifelinePort) lifelinePort.disconnect(); // Disconnect previous if exists
//   lifelinePort = chrome.runtime.connect({ name: "keepAlive" });
//   lifelinePort.onDisconnect.addListener(keepAlive); // Reconnect on disconnect
//   // Optional: Post message to keep it active if needed by specific Chromium versions/bugs
//   // setTimeout(() => { if (lifelinePort) lifelinePort.postMessage({cmd: 'ping'}); }, 25000);
// }
// keepAlive(); // Start the keep-alive mechanism