# NEON//WAVE — Liquid Glass for Spotify

A lightweight appearance-only theme for Spotify Web Player.

## Features
- Liquid-glass surfaces with restrained transparency, soft blur, and subtle borders.
- Full-page blurred background from the currently playing track's cover art.
- A popup switch to enable or disable the theme.
- Original Spotify playback controls and layout are preserved.
- No audio capture, visualizer, canvas, animation loop, or background service worker.

## Install
1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click **Load unpacked** and select this folder.
5. Open or refresh [Spotify Web Player](https://open.spotify.com/).

Use the NEON//WAVE extension icon to turn the theme on or off.

## Notes
The cover art is read from Spotify's currently playing bar image element. Spotify may change its DOM, so this selector may need maintenance. The extension does not modify Spotify playback or account data.
