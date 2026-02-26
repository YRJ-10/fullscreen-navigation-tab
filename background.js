let isActive = false;
let isPinned = false; // Status PUSH sekarang global

chrome.action.onClicked.addListener((tab) => {
  isActive = !isActive;
  if (isActive) {
    chrome.windows.update(tab.windowId, { state: "fullscreen" });
  } else {
    chrome.windows.update(tab.windowId, { state: "normal" });
    isPinned = false; // Reset saat OFF
  }
});

chrome.windows.onBoundsChanged.addListener((window) => {
  chrome.windows.get(window.id, (win) => {
    if (win.state !== "fullscreen") {
      isActive = false;
      isPinned = false;
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_STATE") {
    // Mengirim status isActive DAN isPinned ke content.js
    sendResponse({ isActive: isActive, isPinned: isPinned });
  }
  if (request.type === "TOGGLE_PIN") {
    isPinned = request.value; // Simpan perubahan PUSH dari tab
    sendResponse({ isPinned: isPinned });
  }
  if (request.type === "GET_TABS") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => sendResponse({ tabs }));
    return true;
  }
  if (request.type === "SWITCH_TAB") {
    chrome.tabs.update(request.tabId, { active: true });
  }
  if (request.type === "EXIT_FULLSCREEN") {
    isActive = false;
    isPinned = false;
    chrome.windows.update(sender.tab.windowId, { state: "normal" });
  }
  if (request.type === "CLOSE_TAB") {
     chrome.tabs.remove(request.tabId);
  }
});