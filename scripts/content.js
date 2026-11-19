(() => {
  "use strict";
  if (window.__NEON_WAVE_GLASS__) return;
  window.__NEON_WAVE_GLASS__ = true;

  const root = document.documentElement;
  const KEY = "neonWaveThemeEnabled";
  let artworkObserver = null;
  let playerRoot = null;
  let discoveryObserver = null;
  let lastArtwork = "";

  function setEnabled(enabled) {
    root.classList.toggle("ng-glass-on", enabled);
    if (!enabled) root.style.removeProperty("--ng-track-art");
    else updateArtwork();
  }

  function readArtwork() {
    if (!playerRoot) return "";
    const image = playerRoot.querySelector(
      '[data-testid="cover-art-image"], img[alt][src], img[src]'
    );
    if (!image) return "";
    return image.currentSrc || image.src || image.getAttribute("src") || "";
  }

  function updateArtwork() {
    if (!root.classList.contains("ng-glass-on")) return;
    const src = readArtwork();
    if (!src || src === lastArtwork) return;
    lastArtwork = src;
    // Spotify artwork URLs are supplied by Spotify itself; reject non-http sources.
    if (!/^https?:\/\//i.test(src)) return;
    root.style.setProperty("--ng-track-art", 'url("' + src.replace(/["\\\\\n\r]/g, "") + '")');
  }

  function attachPlayerObserver() {
    const candidate =
      document.querySelector('[data-testid="now-playing-bar"]') ||
      document.querySelector('.Root__now-playing-bar') ||
      document.querySelector('footer');
    if (!candidate || candidate === playerRoot) return !!candidate;
    if (artworkObserver) artworkObserver.disconnect();
    playerRoot = candidate;
    artworkObserver = new MutationObserver(updateArtwork);
    artworkObserver.observe(playerRoot, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["src", "srcset", "alt"]
    });
    updateArtwork();
    return true;
  }

  chrome.storage.local.get({[KEY]: true}, result => {
    setEnabled(result[KEY] !== false);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[KEY]) setEnabled(changes[KEY].newValue !== false);
  });

  if (!attachPlayerObserver()) {
    // This observer exists only until Spotify mounts its persistent player node.
    discoveryObserver = new MutationObserver(() => {
      if (attachPlayerObserver()) discoveryObserver.disconnect();
    });
    discoveryObserver.observe(document.documentElement, {childList: true, subtree: true});
  }
})();
