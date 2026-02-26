(function() {
  const BAR_ID = 'fullscreen-nav-bar';
  let localIsActive = false;
  let localIsPinned = false;

  function init() {
    chrome.runtime.sendMessage({ type: "GET_STATE" }, (res) => {
      if (res) {
        localIsActive = res.isActive;
        localIsPinned = res.isPinned;
        renderCycle();
      }
    });
  }

  function renderCycle() {
    let bar = document.getElementById(BAR_ID);
    if (!localIsActive) { if (bar) bar.remove(); return; }

    if (!bar) {
      bar = document.createElement('div');
      bar.id = BAR_ID;
      // Posisi Fixed
      bar.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; z-index: 2147483647;
        display: flex; align-items: center; overflow: hidden;
        transition: height 0.1s ease-in-out; pointer-events: auto;
        font-family: sans-serif; background: rgba(20, 20, 20, 0.4); height: 10px;
      `;
      
      const styleSheet = document.createElement("style");
      styleSheet.innerText = `
        #${BAR_ID}:hover { height: 45px !important; background: rgba(30, 30, 30, 0.85) !important; }
        .is-pinned { height: 45px !important; background: rgba(30, 30, 30, 0.85) !important; }
        .tab-scroll-container::-webkit-scrollbar { height: 6px; }
        .tab-scroll-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        .close-tab-btn { margin-left: 8px; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #888; transition: 0.2s; }
        .close-tab-btn:hover { background: #ff4757; color: white; }
      `;
      document.head.appendChild(styleSheet);
      document.body.appendChild(bar);
    }

    if (localIsPinned) bar.classList.add('is-pinned');
    else bar.classList.remove('is-pinned');

    updateTabList(bar);
  }

  function updateTabList(bar) {
    chrome.runtime.sendMessage({ type: "GET_TABS" }, (res) => {
      if (!res?.tabs) return;
      const activeTab = res.tabs.find(t => t.active);
      const key = `${res.tabs.length}-${localIsPinned}-${activeTab?.id}-${activeTab?.title}`;
      
      if (bar.getAttribute('data-key') === key) return;
      bar.setAttribute('data-key', key);
      bar.innerHTML = '';
      
      const ctrls = document.createElement('div');
      ctrls.style.cssText = "display:flex; padding:0 10px; flex-shrink:0; align-items:center; gap: 5px;";

      // Styling
      ctrls.appendChild(createBtn("Close", "rgba(198, 39, 44, 0.6)", () => chrome.runtime.sendMessage({ type: "EXIT_FULLSCREEN" })));
      ctrls.appendChild(createBtn(localIsPinned ? "Show: ON" : "Show: OFF", localIsPinned ? "rgba(43, 184, 155, 0.6)": "#555", () => {
        localIsPinned = !localIsPinned;
        chrome.runtime.sendMessage({ type: "TOGGLE_PIN", value: localIsPinned }, () => {
          bar.removeAttribute('data-key');
          renderCycle(); 
        });
      }));

      ctrls.appendChild(createBtn("←", "rgba(255,255,255,0.1)", () => window.history.back()));
      ctrls.appendChild(createBtn("→", "rgba(255,255,255,0.1)", () => window.history.forward()));
      ctrls.appendChild(createBtn("+", "rgba(30, 144, 255, 0.3)", () => window.open('https://www.google.com', '_blank')));
      bar.appendChild(ctrls);

      const list = document.createElement('div');
      list.className = 'tab-scroll-container';
      list.style.cssText = "display:flex; overflow-x:auto; height:100%; align-items:center; flex-grow:1; scroll-behavior: auto; gap: 5px;";
      
      let activeElement = null;
      res.tabs.forEach(tab => {
        const item = document.createElement('div');
        item.style.cssText = `
          color: ${tab.active ? '#fff' : 'rgba(255,255,255,0.5)'}; padding: 0 12px;
          font-size: 11px; cursor: pointer; border-radius: 15px;
          white-space: nowrap; height: 26px; display: flex;
          align-items: center; background: ${tab.active ? 'rgba(255,255,255,0.15)' : 'transparent'};
          transition: 0.2s;
        `;
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = (tab.title || "Tab").substring(0, 15);
        item.appendChild(titleSpan);

        const closeBtn = document.createElement('div');
        closeBtn.className = 'close-tab-btn';
        closeBtn.textContent = '✕';
        closeBtn.onmousedown = (e) => {
          e.preventDefault(); e.stopPropagation();
          chrome.runtime.sendMessage({ type: "CLOSE_TAB", tabId: tab.id });
        };
        item.appendChild(closeBtn);

        if (tab.active) activeElement = item;
        item.onmousedown = (e) => {
          if (e.target.className === 'close-tab-btn') return;
          e.preventDefault();
          bar.removeAttribute('data-key');
          chrome.runtime.sendMessage({ type: "SWITCH_TAB", tabId: tab.id });
        };
        list.appendChild(item);
      });
      
      bar.appendChild(list);
      if (activeElement) activeElement.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    });
  }

  function createBtn(txt, bg, clk) {
    const b = document.createElement('button');
    b.textContent = txt;
    b.style.cssText = `background:${bg}; color:white; border:none; padding: 4px 10px; cursor:pointer; font-size: 10px; border-radius: 12px; font-weight: bold; flex-shrink:0; transition: 0.2s;`;
    b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); clk(); };
    return b;
  }

  setInterval(init, 1000);
  init();
})();