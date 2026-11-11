// ============================================================================
// AI Response Audio Scape — Popup UI Controller (popup.js)
// Universal 8-Browser Support: Chrome, Brave, Comet, Opera, Firefox, Edge,
//                              Apple Safari (macOS/iOS), & Samsung Internet
// Built by Ojus Wankhede using AI
// Contact: ojuswankhede@gmail.com
// ============================================================================

'use strict';

function initPopup() {
  const browserAPI = (typeof browser !== 'undefined' && browser.runtime)
    ? browser
    : (typeof chrome !== 'undefined' && chrome.runtime ? chrome : null);

  if (!browserAPI) return;

  /**
   * Universal Promise + Callback storage.local.get helper
   */
  function safeStorageGet(keys, callback) {
    if (!browserAPI.storage || !browserAPI.storage.local) {
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
   * Universal Promise + Callback storage.local.set helper
   */
  function safeStorageSet(items, callback) {
    if (!browserAPI.storage || !browserAPI.storage.local) {
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

  const enableToggle = document.getElementById('enableToggle');
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const soundButtons = Array.from(document.querySelectorAll('.sound-option'));
  const customFileLabel = document.getElementById('customFileLabel');
  const uploadTriggerBtn = document.getElementById('uploadTriggerBtn');
  const mp3FileInput = document.getElementById('mp3FileInput');
  const uploadFeedback = document.getElementById('uploadFeedback');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeLabel = document.getElementById('volumeLabel');
  const previewBtn = document.getElementById('previewBtn');
  const openGuideBtn = document.getElementById('openGuideBtn');

  let previewAudio = null;
  let previewAudioCtx = null;
  let previewGainNode = null;
  let previewSourceAttached = false;
  let isPreviewPlaying = false;

  let currentSettings = {
    enabled: true,
    selectedSound: 'rain_loop.mp3',
    volume: 0.65,
    customAudioName: null,
    customAudioDataUrl: null
  };

  function updateStatusBadge(enabled) {
    if (!statusBadge || !statusText) return;
    if (enabled) {
      statusBadge.classList.remove('paused');
      statusText.textContent = 'Active';
    } else {
      statusBadge.classList.add('paused');
      statusText.textContent = 'Paused';
    }
  }

  function highlightSelectedSound(selectedSound) {
    soundButtons.forEach((btn) => {
      if (btn.getAttribute('data-sound') === selectedSound) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function showFeedback(message, isError = false) {
    if (!uploadFeedback) return;
    uploadFeedback.textContent = message;
    if (isError) {
      uploadFeedback.classList.add('error');
    } else {
      uploadFeedback.classList.remove('error');
    }
  }

  function applyPreviewVolume(vol) {
    const clamped = Math.max(0, Math.min(1, Number(vol) || 0));
    if (previewAudio) {
      try {
        previewAudio.volume = clamped;
      } catch (_) {}
    }
    if (previewGainNode && previewAudioCtx) {
      try {
        previewGainNode.gain.setValueAtTime(clamped, previewAudioCtx.currentTime || 0);
      } catch (_) {
        previewGainNode.gain.value = clamped;
      }
    }
  }

  function stopPreview() {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }
    isPreviewPlaying = false;
    if (previewBtn) previewBtn.textContent = 'Preview Loop';
  }

  function resolvePreviewUrl() {
    if (currentSettings.selectedSound === 'custom') {
      return currentSettings.customAudioDataUrl || null;
    }
    return browserAPI.runtime.getURL(currentSettings.selectedSound);
  }

  function togglePreview() {
    if (isPreviewPlaying) {
      stopPreview();
      return;
    }
    const src = resolvePreviewUrl();
    if (!src) {
      showFeedback('Please upload a custom MP3 file first.', true);
      return;
    }
    if (!previewAudio) {
      previewAudio = new Audio();
      previewAudio.loop = true;
      previewAudio.playsInline = true;
      previewAudio.setAttribute('playsinline', '');
      previewAudio.setAttribute('webkit-playsinline', '');
    }
    if (!previewSourceAttached) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          previewAudioCtx = new AudioContextClass();
          previewGainNode = previewAudioCtx.createGain();
          previewGainNode.gain.value = currentSettings.volume;
          previewGainNode.connect(previewAudioCtx.destination);
          const source = previewAudioCtx.createMediaElementSource(previewAudio);
          source.connect(previewGainNode);
          previewSourceAttached = true;
        }
      } catch (_) {}
    }
    if (previewAudioCtx && previewAudioCtx.state === 'suspended') {
      previewAudioCtx.resume().catch(() => {});
    }
    previewAudio.src = src;
    applyPreviewVolume(currentSettings.volume);
    previewAudio.play().then(() => {
      isPreviewPlaying = true;
      if (previewBtn) previewBtn.textContent = 'Stop Preview';
    }).catch(() => {
      showFeedback('Unable to play preview audio.', true);
    });
  }

  function persistAndBroadcast(partialUpdate) {
    currentSettings = { ...currentSettings, ...partialUpdate };
    safeStorageSet(partialUpdate, () => {
      try {
        const p = browserAPI.runtime.sendMessage({
          type: 'BROADCAST_PREFS_UPDATED',
          payload: {
            enabled: currentSettings.enabled,
            selectedSound: currentSettings.selectedSound,
            volume: currentSettings.volume
          }
        });
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      } catch (_) {}
    });
  }

  // Load saved state from browser storage
  safeStorageGet(
    ['enabled', 'selectedSound', 'volume', 'customAudioName', 'customAudioDataUrl'],
    (stored) => {
      currentSettings.enabled = stored.enabled !== undefined ? Boolean(stored.enabled) : true;
      currentSettings.selectedSound = stored.selectedSound || 'rain_loop.mp3';
      currentSettings.volume = typeof stored.volume === 'number' ? stored.volume : 0.65;
      currentSettings.customAudioName = stored.customAudioName || null;
      currentSettings.customAudioDataUrl = stored.customAudioDataUrl || null;

      if (enableToggle) enableToggle.checked = currentSettings.enabled;
      updateStatusBadge(currentSettings.enabled);
      highlightSelectedSound(currentSettings.selectedSound);

      const pct = Math.round(currentSettings.volume * 100);
      if (volumeSlider) volumeSlider.value = String(pct);
      if (volumeLabel) volumeLabel.textContent = `${pct}%`;

      if (currentSettings.customAudioName && customFileLabel) {
        customFileLabel.textContent = `Saved: ${currentSettings.customAudioName}`;
      }
    }
  );

  // Master toggle listener
  if (enableToggle) {
    enableToggle.addEventListener('change', () => {
      const enabled = enableToggle.checked;
      updateStatusBadge(enabled);
      if (!enabled) stopPreview();
      persistAndBroadcast({ enabled });
    });
  }

  // Sound selection listener
  soundButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const chosen = btn.getAttribute('data-sound');
      if (chosen === 'custom' && !currentSettings.customAudioDataUrl) {
        showFeedback('Upload a custom MP3 below to activate Custom mode.', true);
        if (mp3FileInput) mp3FileInput.click();
        return;
      }
      showFeedback('');
      highlightSelectedSound(chosen);
      persistAndBroadcast({ selectedSound: chosen });
      if (isPreviewPlaying) {
        stopPreview();
        togglePreview();
      }
    });
  });

  // Custom MP3 upload handler
  if (uploadTriggerBtn && mp3FileInput) {
    uploadTriggerBtn.addEventListener('click', () => {
      mp3FileInput.click();
    });

    mp3FileInput.addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const maxBytes = 8 * 1024 * 1024; // 8 MB safe limit (with unlimitedStorage permission)
      if (file.size > maxBytes) {
        showFeedback('File exceeds 8 MB limit. Choose a shorter loop.', true);
        return;
      }

      showFeedback('Saving custom audio locally...');
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:audio')) {
          showFeedback('Invalid audio format. Please select a valid MP3/WAV.', true);
          return;
        }

        const updatePayload = {
          customAudioName: file.name,
          customAudioDataUrl: dataUrl,
          selectedSound: 'custom'
        };

        safeStorageSet(updatePayload, () => {
          if (browserAPI.runtime && browserAPI.runtime.lastError) {
            showFeedback('Storage error: ' + browserAPI.runtime.lastError.message, true);
            return;
          }
          currentSettings = { ...currentSettings, ...updatePayload };
          if (customFileLabel) customFileLabel.textContent = `Saved: ${file.name}`;
          highlightSelectedSound('custom');
          showFeedback('Custom MP3 saved 100% locally & activated!');
          try {
            const p = browserAPI.runtime.sendMessage({
              type: 'BROADCAST_PREFS_UPDATED',
              payload: {
                enabled: currentSettings.enabled,
                selectedSound: 'custom',
                volume: currentSettings.volume
              }
            });
            if (p && typeof p.catch === 'function') {
              p.catch(() => {});
            }
          } catch (_) {}
        });
      };
      reader.onerror = () => {
        showFeedback('Failed to read file from disk.', true);
      };
      reader.readAsDataURL(file);
    });
  }

  // Volume slider listener
  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      const pct = Number(volumeSlider.value);
      const vol = Math.max(0, Math.min(1, pct / 100));
      if (volumeLabel) volumeLabel.textContent = `${pct}%`;
      currentSettings.volume = vol;
      applyPreviewVolume(vol);
      safeStorageSet({ volume: vol });
    });

    volumeSlider.addEventListener('change', () => {
      const pct = Number(volumeSlider.value);
      const vol = Math.max(0, Math.min(1, pct / 100));
      persistAndBroadcast({ volume: vol });
    });
  }

  // Preview button
  if (previewBtn) {
    previewBtn.addEventListener('click', togglePreview);
  }

  // Open Setup & Privacy Guide directly in a new tab
  if (openGuideBtn) {
    openGuideBtn.addEventListener('click', () => {
      try {
        const p = browserAPI.tabs.create({ url: browserAPI.runtime.getURL('setup.html') });
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      } catch (_) {}
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}
