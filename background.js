const DEFAULT_CONFIG = {
  blockFocus: true,
  blockVisibility: true,
  blockMouse: true,
  spoofRaf: true,
  fpsLimit: 60
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ globalEnabled: true, disabledTabs: [], config: DEFAULT_CONFIG });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_STATE') {
    chrome.storage.local.get(['globalEnabled', 'disabledTabs', 'config'], data => {
      sendResponse({
        globalEnabled: data.globalEnabled ?? true,
        disabledTabIds: data.disabledTabs || [],
        config: data.config || DEFAULT_CONFIG
      });
    });
    return true;
  }

  if (msg.type === 'INJECT_MAIN_WORLD' && sender.tab) {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      files: ['iAmFocused.js'],
      world: 'MAIN'
    });
    return false;
  }

  if (msg.type === 'SET_GLOBAL') {
    chrome.storage.local.set({ globalEnabled: msg.enabled }, () => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'SET_CONFIG') {
    chrome.storage.local.set({ config: msg.config }, () => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'GET_TAB_ID') {
    if (sender.tab) {
      sendResponse({ tabId: sender.tab.id });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        sendResponse({ tabId: tabs[0] ? tabs[0].id : null });
      });
    }
    return true;
  }

  if (msg.type === 'TOGGLE_TAB') {
    const tabId = msg.tabId;
    chrome.storage.local.get('disabledTabs', data => {
      let list = data.disabledTabs || [];
      if (msg.disabled) {
        if (!list.includes(tabId)) list.push(tabId);
      } else {
        list = list.filter(id => id !== tabId);
      }
      chrome.storage.local.set({ disabledTabs: list }, () => sendResponse({ ok: true }));
    });
    return true;
  }
});
