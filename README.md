# 🎧 AI Response Audio Scape

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Privacy](https://img.shields.io/badge/Data%20Collection-Zero%20Telemetry-emerald.svg)](#-privacy-policy)
[![Browsers](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Edge%20%7C%20Firefox%20%7C%20Opera%20%7C%20Safari%20%7C%20Brave%20%7C%20Comet%20%7C%20Samsung-indigo.svg)](#-universal-browser-support)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

> **Plays soothing ambient audio loops while AI chatbots think & stream responses, stopping automatically when generation completes.**

Built with passion by **Ojus Wankhede using AI**.  
Contact & Support: [ojuswankhede@gmail.com](mailto:ojuswankhede@gmail.com)

---

## ✨ Features

- **Strict Thinking-Only Audio:** Plays automatically when an AI is actively thinking, calculating, or streaming response tokens. Completely silent during idle browsing, menu navigation, or prompt typing.
- **Instant Cutoff Guarantee:** Halts audio immediately the exact instant the AI finishes its response.
- **4 Bundled Ambient Soundscapes (100% Offline):**
  - 🌧️ **Gentle Rain:** Warm acoustic rainfall with soft acoustic filtering.
  - 🎐 **Zen Chimes:** Harmonic pentatonic temple bells with meditative overtones.
  - 🌌 **Deep Space:** Cosmic binaural drone in A-minor fifths for deep focus.
  - 📻 **Lo-Fi Hum:** Warm analog tape electric piano chord with gentle vinyl flutter.
- **Custom MP3 Upload (100% On-Device):** Upload your personal MP3/WAV tracks (up to 8 MB) saved locally via `chrome.storage.local`.
- **Software Volume Slider (0%–100%):** Unified volume control bridging standard HTML5 Audio and the Web Audio API `GainNode` for seamless mobile & desktop volume scaling.
- **100% Local & Zero Telemetry:** Zero external network calls, zero tracking scripts, zero CDNs, and zero cookies.

---

## 🌐 Supported AI Platforms

AI Response Audio Scape includes real-time DOM `MutationObserver` streaming hooks for:

1. **Google Gemini** (`gemini.google.com`, `*.gemini.google.com`)
2. **ChatGPT** (`chatgpt.com`, `chat.openai.com`)
3. **Anthropic Claude** (`claude.ai`)
4. **xAI Grok** (`grok.com`, `x.ai`)
5. **Perplexity AI** (`perplexity.ai`, `www.perplexity.ai`)
6. **DeepSeek** (`chat.deepseek.com`, `*.deepseek.com`)
7. **Microsoft Copilot** (`copilot.microsoft.com`)
8. **Poe** (`poe.com`)
9. **Mistral Le Chat** (`chat.mistral.ai`)

---

## 🚀 Universal Browser Support & Installation

### 1. Google Chrome, Brave, Comet (Perplexity), Microsoft Edge, & Opera
1. Download `AI_Response_Audio_Scape_MV3.zip` or clone this repository:
   ```bash
   git clone https://github.com/your-username/ai-response-audio-scape.git
   ```
2. Open your browser's extensions manager:
   - **Chrome:** `chrome://extensions/`
   - **Brave:** `brave://extensions/`
   - **Edge:** `edge://extensions/`
   - **Opera:** `opera://extensions/`
   - **Comet:** `comet://extensions/`
3. Enable **Developer mode** (top-right toggle switch).
4. Click **Load unpacked** and select the extension folder containing `manifest.json`.

### 2. Mozilla Firefox
1. Navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**
3. Select `manifest.json` from the repository folder.

### 3. Apple Safari (macOS & iOS)
Convert and package using Apple's official converter:
```bash
xcrun safari-web-extension-converter /path/to/ai-response-audio-scape
```
Open the generated Xcode project and run the extension target.

---

## ☁️ 1-Click Hosting on Vercel

You can host the onboarding launch site (`setup.html`) and the live Privacy Policy (`privacy.html`) directly on Vercel to obtain the public HTTPS URL required for the Web Stores.

### Method A: Deploy via GitHub (Recommended)
1. Push this repository to your GitHub account.
2. Log in to [Vercel](https://vercel.com/) and click **Add New...** -> **Project**.
3. Import your `ai-response-audio-scape` repository.
4. Leave all build settings as default (Framework Preset: **Other**; Build Command: *empty*; Output Directory: *empty*).
5. Click **Deploy**. Vercel will automatically read `vercel.json` and deploy:
   - **Main Website:** `https://your-project.vercel.app/` -> loads `setup.html`
   - **Privacy Policy:** `https://your-project.vercel.app/privacy` -> loads `privacy.html`

### Method B: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel login
cd ai-response-audio-scape
vercel --prod
```

---

## 🛡️ Privacy Policy

**AI Response Audio Scape collects ZERO data.**
- No user personal data is ever collected, transmitted, or logged.
- No analytics or third-party tracking scripts are bundled.
- All audio preferences, volume settings, and custom MP3 files are stored strictly on-device in `storage.local`.
- Full policy available at [`privacy.html`](privacy.html) or `https://your-domain.vercel.app/privacy`.

---

## ☕ Support, Bug Reports & Contributions

Built and maintained by **Ojus Wankhede**.  
If you'd like to report a bug, contribute, or support the project with a donation:
- ✉️ **Email:** [ojuswankhede@gmail.com](mailto:ojuswankhede@gmail.com)
- ☕ **Donations & Sponsorships:** Contact [ojuswankhede@gmail.com](mailto:ojuswankhede@gmail.com)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
