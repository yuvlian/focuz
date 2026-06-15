(async () => {
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, async (response) => {
    if (!response || !response.globalEnabled) return;
    chrome.runtime.sendMessage({ type: 'GET_TAB_ID' }, async (tabInfo) => {
      if (response.disabledTabIds.includes(tabInfo?.tabId)) return;
      document.documentElement.dataset.focuzConfig = JSON.stringify(response.config);
      chrome.runtime.sendMessage({ type: 'INJECT_MAIN_WORLD' });
    });
  });
})();
