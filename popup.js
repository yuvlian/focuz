document.addEventListener('DOMContentLoaded', async () => {
    const elements = {
        globalToggle: document.getElementById('globalToggle'),
        tabToggle: document.getElementById('tabToggle'),
        advMenuBtn: document.getElementById('advMenuBtn'),
        advPanel: document.getElementById('advPanel'),
        blockFocus: document.getElementById('blockFocus'),
        blockVisibility: document.getElementById('blockVisibility'),
        blockMouse: document.getElementById('blockMouse'),
        spoofRaf: document.getElementById('spoofRaf'),
        fpsLimit: document.getElementById('fpsLimit')
    };

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab) return;
    const currentTabId = activeTab.id;

    elements.advMenuBtn.addEventListener('click', () => {
        const isHidden = elements.advPanel.style.display !== 'block';
        elements.advPanel.style.display = isHidden ? 'block' : 'none';
        elements.advMenuBtn.innerText = isHidden ? '▼ Advanced Settings' : '▶ Advanced Settings';
    });

    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (res) => {
        if (!res) return;
        elements.globalToggle.checked = res.globalEnabled;
        elements.tabToggle.checked = res.disabledTabIds.includes(currentTabId);

        elements.blockFocus.checked = res.config.blockFocus ?? true;
        elements.blockVisibility.checked = res.config.blockVisibility ?? true;
        elements.blockMouse.checked = res.config.blockMouse ?? true;
        elements.spoofRaf.checked = res.config.spoofRaf ?? true;
        elements.fpsLimit.value = res.config.fpsLimit ?? 60;
    });

    const saveConfig = () => {
        chrome.runtime.sendMessage({
            type: 'SET_CONFIG',
            config: {
                blockFocus: elements.blockFocus.checked,
                blockVisibility: elements.blockVisibility.checked,
                blockMouse: elements.blockMouse.checked,
                spoofRaf: elements.spoofRaf.checked,
                fpsLimit: parseInt(elements.fpsLimit.value, 10) || 60
            }
        });
    };

    elements.globalToggle.addEventListener('change', () => {
        chrome.runtime.sendMessage({ type: 'SET_GLOBAL', enabled: elements.globalToggle.checked });
    });

    elements.tabToggle.addEventListener('change', () => {
        chrome.runtime.sendMessage({ type: 'TOGGLE_TAB', tabId: currentTabId, disabled: elements.tabToggle.checked });
    });

    ['blockFocus', 'blockVisibility', 'blockMouse', 'spoofRaf'].forEach(id => {
        elements[id].addEventListener('change', saveConfig);
    });

    elements.fpsLimit.addEventListener('input', saveConfig);
});
