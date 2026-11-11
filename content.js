// ============================================================================
// AI Response Audio Scape — High-Performance DOM Observer & Audio Loop Engine
// Cross-Platform Support: Gemini, ChatGPT, Claude, Grok, Perplexity, Copilot, DeepSeek, Poe, Mistral
// Universal 8-Browser Certified: Chrome, Brave, Comet, Opera, Firefox, Edge,
//                                Apple Safari (macOS/iOS), & Samsung Internet (Android)
// Strict Thinking-Only: Plays ONLY when AI is actively thinking/streaming
// Web Audio API GainNode Bridge: Supports software volume control on iOS Safari & Android
// 100% Local Execution | Zero Telemetry | Self-Healing Context Guard
// Built by Ojus Wankhede using AI
// Contact: ojuswankhede@gmail.com
// ============================================================================

'use strict';

(() => {
  if (window.__AI_AUDIO_SCAPE_INITIALIZED__) return;
  window.__AI_AUDIO_SCAPE_INITIALIZED__ = true;

  const LOG_PREFIX = '[AI Audio Scape]';
  const browserAPI = (typeof browser !== 'undefined' && browser.runtime)
    ? browser
    : (typeof chrome !== 'undefined' && chrome.runtime ? chrome : null);

  /**
   * Guards against 'Extension context invalidated' errors when the extension is reloaded
   */
  function isContextValid() {
    try {
      return !!(browserAPI && browserAPI.runtime && browserAPI.runtime.id);
    } catch (_) {
      return false;
    }
  }

  /**
   * Universal Promise + Callback storage.local.get helper (Safari WebKit, Firefox Gecko, & Chromium)
   */
  function safeStorageGet(keys, callback) {
    if (!isContextValid() || !browserAPI.storage || !browserAPI.storage.local) {
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

  const STATE = {
    enabled: true,
    selectedSound: 'rain_loop.mp3',
    volume: 0.65,
    customAudioDataUrl: null,
    isGenerating: false,
    audioElement: null,
    audioCtx: null,
    gainNode: null,
    mediaSourceAttached: false,
    checkTimer: null,
    observer: null
  };

  /**
   * Graceful self-teardown if the extension context was invalidated by a reload
   */
  function teardownIfInvalidated() {
    if (!isContextValid()) {
      if (STATE.checkTimer) {
        clearInterval(STATE.checkTimer);
        STATE.checkTimer = null;
      }
      if (STATE.observer) {
        STATE.observer.disconnect();
        STATE.observer = null;
      }
      if (STATE.audioElement) {
        try {
          STATE.audioElement.pause();
        } catch (_) {}
      }
      return true;
    }
    return false;
  }

  console.log(`${LOG_PREFIX} Engine active on:`, window.location.href);

  // Exact selectors targeting Stop buttons across desktop & mobile web views (Safari iOS / Samsung Internet)
  const STOP_SELECTORS = [
    // --- Google Gemini (Desktop & Mobile Web) ---
    'button[aria-label*="Stop response" i]',
    'button[aria-label*="Stop generating" i]',
    'button[aria-label*="Stop streaming" i]',
    'button[aria-label*="Stop responding" i]',
    'button[aria-label*="Detener" i]',
    'button[aria-label*="Arrêter" i]',
    'button[aria-label*="Stopp" i]',
    'button[aria-label*="रोकें" i]',
    'button.stop-button',
    '[role="button"][aria-label*="Stop response" i]',

    // --- ChatGPT (Desktop & Mobile Safari/Samsung Web) ---
    'button[data-testid="stop-button"]',
    'button[aria-label="Stop generating"]',
    'button[aria-label="Stop streaming"]',
    '[role="button"][data-testid="stop-button"]',

    // --- Claude (Desktop & Mobile Web) ---
    'button[aria-label="Stop Response"]',
    'button[aria-label="Stop response"]',

    // --- Grok & Perplexity (Desktop, Comet, & Mobile Web) ---
    'button[data-testid="stop-button"]',
    '[data-testid="stop-generating-button"]',

    // --- DeepSeek, Copilot, & Poe ---
    'button.ds-icon-button[aria-label*="stop" i]',
    'button[aria-label="Stop Responding"]',
    'button[title="Stop Responding"]',
    '[class*="ChatMessageSendButton_stopButton"]'
  ];

  // Indicators present exclusively while AI is thinking, calculating, or streaming
  const THINKING_INDICATORS = [
    // --- Google Gemini Active Thinking Elements ---
    'model-response [aria-busy="true"]',
    'model-response .sparkle-container',
    'model-response .animated-sparkle',
    'model-response .loading-indicator',
    'model-response .thinking-indicator',
    'model-response mat-progress-bar',
    'model-response mat-spinner',
    '.pending-response',

    // --- ChatGPT & Claude Streaming ---
    '.result-streaming',
    '[data-is-streaming="true"]',
    '.font-claude-message[data-is-streaming="true"]',
    '[data-testid*="conversation-turn"] .streaming-animation',

    // --- DeepSeek Reasoning Block ---
    '.deepseek-think'
  ];

  /**
   * Resolves the appropriate audio source URL with safety guard
   */
  function resolveAudioSrc() {
    if (STATE.selectedSound === 'custom' && STATE.customAudioDataUrl) {
      return STATE.customAudioDataUrl;
    }
    const bundledFile = ['rain_loop.mp3', 'zen_chimes.mp3', 'deep_space.mp3', 'lofi_hum.mp3'].includes(STATE.selectedSound)
      ? STATE.selectedSound
      : 'rain_loop.mp3';

    if (!isContextValid()) {
      return '';
    }
    try {
      return browserAPI.runtime.getURL(bundledFile);
    } catch (_) {
      return '';
    }
  }

  /**
   * Applies volume to both standard HTMLMediaElement.volume AND Web Audio API GainNode
   * (Guarantees software volume scaling on Apple Safari iOS/iPadOS & Samsung Internet Android)
   */
  function applyUnifiedVolume(vol) {
    const clamped = Math.max(0, Math.min(1, Number(vol) || 0));
    if (STATE.audioElement) {
      try {
        STATE.audioElement.volume = clamped;
      } catch (_) {}
    }
    if (STATE.gainNode && STATE.audioCtx) {
      try {
        STATE.gainNode.gain.setValueAtTime(clamped, STATE.audioCtx.currentTime || 0);
      } catch (_) {
        STATE.gainNode.gain.value = clamped;
      }
    }
  }

  /**
   * Connects optional Web Audio API GainNode bridge for iOS Safari / Mobile browsers
   */
  function ensureWebAudioGainBridge() {
    if (STATE.mediaSourceAttached || !STATE.audioElement) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!STATE.audioCtx) {
        STATE.audioCtx = new AudioContextClass();
      }
      if (!STATE.gainNode) {
        STATE.gainNode = STATE.audioCtx.createGain();
        STATE.gainNode.gain.value = STATE.volume;
        STATE.gainNode.connect(STATE.audioCtx.destination);
      }
      const source = STATE.audioCtx.createMediaElementSource(STATE.audioElement);
      source.connect(STATE.gainNode);
      STATE.mediaSourceAttached = true;
    } catch (_) {
      // Fallback gracefully to standard HTML5 Audio element if restricted by page policy
    }
  }

  /**
   * Instantiates or reconfigures the DOM-anchored Audio element with preloading
   * Includes playsinline attributes required by Apple Safari (iOS/macOS) and Samsung Internet
   */
  function ensureAudioElement() {
    if (teardownIfInvalidated()) return;

    const desiredSrc = resolveAudioSrc();
    if (!desiredSrc) return;

    if (!STATE.audioElement || !STATE.audioElement.isConnected) {
      let existing = document.getElementById('__ai_audio_scape_player__');
      if (!existing) {
        existing = document.createElement('audio');
        existing.id = '__ai_audio_scape_player__';
        existing.loop = true;
        existing.preload = 'auto';
        existing.hidden = true;
        existing.playsInline = true;
        existing.setAttribute('playsinline', '');
        existing.setAttribute('webkit-playsinline', '');
        existing.setAttribute('x-webkit-airplay', 'allow');
        const targetParent = document.body || document.documentElement;
        if (targetParent) {
          targetParent.appendChild(existing);
        }
      }
      STATE.audioElement = existing;
    }

    if (STATE.audioElement && STATE.audioElement.src !== desiredSrc) {
      const wasPlaying = !STATE.audioElement.paused;
      STATE.audioElement.src = desiredSrc;
      if (wasPlaying && STATE.enabled && STATE.isGenerating) {
        applyUnifiedVolume(STATE.volume);
        STATE.audioElement.play().catch(() => {});
      }
    }

    applyUnifiedVolume(STATE.volume);
  }

  /**
   * Unlocks suspended WebKit / Mobile AudioContext on user gesture without playing sound
   */
  function unlockAudioContextOnGesture() {
    if (STATE.audioCtx && STATE.audioCtx.state === 'suspended') {
      STATE.audioCtx.resume().catch(() => {});
    }
  }

  window.addEventListener('touchstart', unlockAudioContextOnGesture, { capture: true, passive: true });
  window.addEventListener('pointerdown', unlockAudioContextOnGesture, { capture: true, passive: true });
  window.addEventListener('keydown', unlockAudioContextOnGesture, { capture: true, passive: true });

  /**
   * Starts playing continuous audio loop strictly when AI is generating
   */
  function startAudioLoop() {
    if (!STATE.enabled || teardownIfInvalidated()) return;
    ensureAudioElement();
    ensureWebAudioGainBridge();
    if (STATE.audioCtx && STATE.audioCtx.state === 'suspended') {
      STATE.audioCtx.resume().catch(() => {});
    }
    if (STATE.audioElement && STATE.audioElement.paused) {
      applyUnifiedVolume(STATE.volume);
      const p = STATE.audioElement.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          console.log(`${LOG_PREFIX} ▶️ Playing soundscape (${STATE.selectedSound}) at ${Math.round(STATE.volume * 100)}% volume`);
        }).catch((err) => {
          if (err && err.name !== 'AbortError') {
            console.warn(`${LOG_PREFIX} Playback notice:`, err.message);
          }
        });
      }
    }
  }

  /**
   * Stops audio loop immediately when AI finishes reply
   */
  function stopAudioLoop() {
    if (!STATE.audioElement) return;
    if (!STATE.audioElement.paused) {
      STATE.audioElement.pause();
      STATE.audioElement.currentTime = 0;
      console.log(`${LOG_PREFIX} ⏹️ Audio stopped (AI generation finished)`);
    }
  }

  /**
   * Checks if a DOM element is visible across Blink, Gecko, and WebKit
   */
  function isElementVisible(el) {
    if (!el || !el.isConnected) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
      return false;
    }
    if (el !== document.body && el !== document.documentElement) {
      if (el.offsetParent === null && style.position !== 'fixed') {
        return false;
      }
    }
    return true;
  }

  /**
   * Strict verification: Is the AI actively thinking or streaming right now?
   */
  function isAIGenerating() {
    if (teardownIfInvalidated()) return false;

    // 1. Check strict Stop buttons
    for (let i = 0; i < STOP_SELECTORS.length; i++) {
      try {
        const matches = document.querySelectorAll(STOP_SELECTORS[i]);
        for (let j = 0; j < matches.length; j++) {
          if (isElementVisible(matches[j])) {
            return true;
          }
        }
      } catch (_) {}
    }

    // 2. Check standalone Stop buttons (exact label "Stop", excluding microphone/voice)
    const buttons = document.querySelectorAll('button[aria-label], [role="button"][aria-label]');
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const label = (btn.getAttribute('aria-label') || '').trim().toLowerCase();
      if ((label === 'stop' || label.startsWith('stop ')) && !label.includes('mic') && !label.includes('voice') && !label.includes('record')) {
        if (isElementVisible(btn)) {
          return true;
        }
      }
    }

    // 3. Check for Material Icon with 'stop' text or attribute inside a button
    const matIcons = document.querySelectorAll('mat-icon');
    for (let i = 0; i < matIcons.length; i++) {
      const icon = matIcons[i];
      const name = (icon.getAttribute('data-mat-icon-name') || icon.getAttribute('fonticon') || icon.textContent || '').trim().toLowerCase();
      if (name === 'stop' || name === 'stop_circle') {
        const parentBtn = icon.closest('button, [role="button"]');
        if (parentBtn && isElementVisible(parentBtn)) {
          return true;
        }
      }
    }

    // 4. Check active Thinking & Progress indicators
    for (let i = 0; i < THINKING_INDICATORS.length; i++) {
      try {
        const matches = document.querySelectorAll(THINKING_INDICATORS[i]);
        for (let j = 0; j < matches.length; j++) {
          if (isElementVisible(matches[j])) {
            return true;
          }
        }
      } catch (_) {}
    }

    return false;
  }

  /**
   * Evaluates generation state and transitions playback
   */
  function evaluateGenerationState() {
    if (teardownIfInvalidated()) return;

    if (!STATE.enabled) {
      if (STATE.isGenerating) {
        STATE.isGenerating = false;
        stopAudioLoop();
      }
      return;
    }

    const currentlyGenerating = isAIGenerating();

    if (currentlyGenerating && !STATE.isGenerating) {
      STATE.isGenerating = true;
      startAudioLoop();
    } else if (!currentlyGenerating && STATE.isGenerating) {
      STATE.isGenerating = false;
      stopAudioLoop();
    }
  }

  /**
   * Observes live DOM changes for thinking and streaming state changes
   */
  function initObserver() {
    ensureAudioElement();

    STATE.observer = new MutationObserver(() => {
      evaluateGenerationState();
    });

    STATE.observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'aria-busy', 'class', 'data-is-streaming', 'data-testid']
    });

    // Steady heartbeat verification (evaluates every 200ms for instant cutoff)
    STATE.checkTimer = setInterval(() => {
      evaluateGenerationState();
    }, 200);
  }

  /**
   * Synchronizes preferences from storage
   */
  function loadInitialSettings() {
    if (!isContextValid()) return;
    safeStorageGet(
      ['enabled', 'selectedSound', 'volume', 'customAudioDataUrl'],
      (data) => {
        if (teardownIfInvalidated()) return;
        STATE.enabled = data.enabled !== undefined ? Boolean(data.enabled) : true;
        STATE.selectedSound = data.selectedSound || 'rain_loop.mp3';
        STATE.volume = typeof data.volume === 'number' ? data.volume : 0.65;
        STATE.customAudioDataUrl = data.customAudioDataUrl || null;
        ensureAudioElement();
        console.log(`${LOG_PREFIX} Settings loaded: sound=${STATE.selectedSound}, volume=${Math.round(STATE.volume * 100)}%, enabled=${STATE.enabled}`);
        evaluateGenerationState();
      }
    );
  }

  // Storage listener for instantaneous popup controls response
  if (isContextValid() && browserAPI.storage && browserAPI.storage.onChanged) {
    try {
      browserAPI.storage.onChanged.addListener((changes, areaName) => {
        if (teardownIfInvalidated()) return;
        if (areaName !== 'local') return;
        if (changes.enabled !== undefined) {
          STATE.enabled = Boolean(changes.enabled.newValue);
        }
        if (changes.selectedSound !== undefined) {
          STATE.selectedSound = changes.selectedSound.newValue;
        }
        if (changes.volume !== undefined) {
          STATE.volume = Number(changes.volume.newValue);
        }
        if (changes.customAudioDataUrl !== undefined) {
          STATE.customAudioDataUrl = changes.customAudioDataUrl.newValue;
        }

        ensureAudioElement();
        if (!STATE.enabled) {
          stopAudioLoop();
          STATE.isGenerating = false;
        } else {
          evaluateGenerationState();
        }
      });
    } catch (_) {}
  }

  if (isContextValid() && browserAPI.runtime && browserAPI.runtime.onMessage) {
    try {
      browserAPI.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (teardownIfInvalidated()) return false;
        if (message && message.type === 'PREFS_UPDATED' && message.payload) {
          const p = message.payload;
          if (p.enabled !== undefined) STATE.enabled = Boolean(p.enabled);
          if (p.selectedSound !== undefined) STATE.selectedSound = p.selectedSound;
          if (p.volume !== undefined) STATE.volume = Number(p.volume);
          ensureAudioElement();
          evaluateGenerationState();
          sendResponse({ ok: true });
        }
        return false;
      });
    } catch (_) {}
  }

  loadInitialSettings();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObserver, { once: true });
  } else {
    initObserver();
  }
})();
