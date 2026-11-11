// ============================================================================
// AI Response Audio Scape — Background Service Worker / Non-Persistent Script (MV3)
// Universal 8-Browser Support: Chrome, Brave, Comet, Opera, Firefox, Edge,
//                              Apple Safari (macOS/iOS), & Samsung Internet
// 100% Local Execution | Zero External Network Calls | Strict CSP
// Built by Ojus Wankhede using AI
// Contact: ojuswankhede@gmail.com
// ============================================================================

'use strict';

const browserAPI = (typeof browser !== 'undefined' && browser.runtime)
  ? browser
  : (typeof chrome !== 'undefined' && chrome.runtime ? chrome : null);

const DEFAULT_PREFERENCES = {
  enabled: true,
  selectedSound: 'rain_loop.mp3',
  volume: 0.65,
  customAudioName: null,
  customAudioDataUrl: null
};

/**
 * Universal Promise + Callback wrapper for storage.local.get
 * Supports both W3C Promise-only APIs (Safari WebKit / Firefox Gecko) and Chromium callbacks
 */
function safeStorageGet(keys, callback) {
  if (!browserAPI || !browserAPI.storage || !browserAPI.storage.local) {
    callback({});
    return;
  }
  try {
    let settled = false;
    const done = (data) => {
      if (!settled) {
        settled = true;
        callback(data || {});
      }
    };
    const maybePromise = browserAPI.storage.local.get(keys, done);
    if (maybePromise && typeof maybePromise.then === 'function') {
      maybePromise.then(done).catch(() => done({}));
    }
  } catch (_) {
    callback({});
  }
}

/**
 * Universal Promise + Callback wrapper for storage.local.set
 */
function safeStorageSet(items, callback) {
  if (!browserAPI || !browserAPI.storage || !browserAPI.storage.local) {
    if (callback) callback();
    return;
  }
  try {
    let settled = false;
    const done = () => {
      if (!settled) {
        settled = true;
        if (callback) callback();
      }
    };
    const maybePromise = browserAPI.storage.local.set(items, done);
    if (maybePromise && typeof maybePromise.then === 'function') {
      maybePromise.then(done).catch(done);
    }
  } catch (_) {
    if (callback) callback();
  }
}

/**
 * Universal Promise + Callback wrapper for tabs.query
 */
function safeTabsQuery(queryInfo, callback) {
  if (!browserAPI || !browserAPI.tabs || !browserAPI.tabs.query) {
    callback([]);
    return;
  }
  try {
    let settled = false;
    const done = (tabs) => {
      if (!settled) {
        settled = true;
        callback(Array.isArray(tabs) ? tabs : []);
      }
    };
    const maybePromise = browserAPI.tabs.query(queryInfo, done);
    if (maybePromise && typeof maybePromise.then === 'function') {
      maybePromise.then(done).catch(() => done([]));
    }
  } catch (_) {
    callback([]);
  }
}

/**
 * Universal wrapper for tabs.create
 */
function safeTabsCreate(createProperties) {
  if (!browserAPI || !browserAPI.tabs || !browserAPI.tabs.create) return;
  try {
    const maybePromise = browserAPI.tabs.create(createProperties);
    if (maybePromise && typeof maybePromise.catch === 'function') {
      maybePromise.catch(() => {});
    }
  } catch (_) {}
}

// Mandatory Onboarding Trigger on First Install
if (browserAPI && browserAPI.runtime && browserAPI.runtime.onInstalled) {
  browserAPI.runtime.onInstalled.addListener((details) => {
    safeStorageGet(Object.keys(DEFAULT_PREFERENCES), (stored) => {
      const initialConfig = {};
      for (const [key, defaultValue] of Object.entries(DEFAULT_PREFERENCES)) {
        if (stored[key] === undefined) {
          initialConfig[key] = defaultValue;
        }
      }
      if (Object.keys(initialConfig).length > 0) {
        safeStorageSet(initialConfig);
      }
    });

    if (details && details.reason === 'install') {
      safeTabsCreate({
        url: browserAPI.runtime.getURL('setup.html'),
        active: true
      });
    }
  });
}

// Message Coordinator for Popup & Content Script Synchronization
if (browserAPI && browserAPI.runtime && browserAPI.runtime.onMessage) {
  browserAPI.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !message.type) {
      return false;
    }

    if (message.type === 'GET_AUDIO_STATE') {
      safeStorageGet(Object.keys(DEFAULT_PREFERENCES), (data) => {
        sendResponse({
          enabled: data.enabled !== undefined ? data.enabled : DEFAULT_PREFERENCES.enabled,
          selectedSound: data.selectedSound || DEFAULT_PREFERENCES.selectedSound,
          volume: typeof data.volume === 'number' ? data.volume : DEFAULT_PREFERENCES.volume,
          customAudioName: data.customAudioName || null,
          customAudioDataUrl: data.customAudioDataUrl || null
        });
      });
      return true; // Keep message channel open for async response
    }

    if (message.type === 'OPEN_SETUP_GUIDE') {
      safeTabsCreate({
        url: browserAPI.runtime.getURL('setup.html'),
        active: true
      });
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === 'BROADCAST_PREFS_UPDATED') {
      safeTabsQuery({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab && tab.id && browserAPI.tabs.sendMessage) {
            try {
              const p = browserAPI.tabs.sendMessage(tab.id, {
                type: 'PREFS_UPDATED',
                payload: message.payload
              });
              if (p && typeof p.catch === 'function') {
                p.catch(() => {});
              }
            } catch (_) {}
          }
        });
      });
      sendResponse({ ok: true });
      return false;
    }

    return false;
  });
}
