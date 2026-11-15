# NEON//WAVE

A neon-futurist / cyberpunk visual theme for Spotify Web Player.

> This is an independent community theme. It does not modify Spotify's backend or replace its playback logic. Spotify's DOM changes over time, so selectors may need maintenance.

## Features

- Full-page dark glass / neon treatment for Spotify navigation, library, top bar, search, cards, track lists, dialogs, menus, and the bottom playback bar.
- Cyan / violet / magenta accent system with restrained glow, gradients, and hover states.
- Responsive layout adjustments and reduced-motion support.
- Optional live spectrum visualizer driven by Chrome tab audio capture (FFT via Web Audio AnalyserNode).

## Install (unpacked)

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select this repository folder.
5. Open or refresh [Spotify Web Player](https://open.spotify.com/).

## Live audio visualizer

Click the **WAVE / VISUALIZER** control injected into the Spotify page. Chrome will start tab audio capture for the current Spotify tab. Click it again to stop. The offscreen audio pipeline routes the captured stream back to the tab's audio output while analysing FFT data.

Chrome may display its own capture indicator. Capture only starts after the user's click.

## Compatibility notes

- Target: current Chromium-based desktop browsers with Manifest V3, `tabCapture`, and `offscreen` support.
- Spotify is a frequently updated single-page app. The stylesheet uses a mix of stable ARIA / data attributes and class fallbacks; some selectors may need updating as Spotify evolves.
- The extension changes presentation only. Spotify account, playback, queue, search, library, and navigation actions remain owned by Spotify.
- The visualizer requires the extension to be loaded unpacked and audio capture to be permitted by Chrome. It has not been certified against every Spotify layout or browser release.

## Project layout

- `manifest.json` — MV3 extension manifest
- `styles/theme.css` — global Spotify UI redesign
- `scripts/content.js` — visualizer controls and UI integration
- `scripts/background.js` — tab capture / offscreen lifecycle
- `visualizer/offscreen.html`, `visualizer/offscreen.js` — FFT analyser pipeline

## License

MIT
