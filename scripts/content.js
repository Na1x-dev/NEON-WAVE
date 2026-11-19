(() => {
  "use strict";
  if (window.__NEON_WAVE_LOADED__) return;
  window.__NEON_WAVE_LOADED__ = true;

  const host = document.createElement("div");
  host.id = "neon-wave-dock";
  host.innerHTML = '<button id="nw-toggle" type="button" aria-pressed="false" title="Start live audio visualizer"><span class="nw-dot"></span><span>WAVE / VISUALIZER</span></button><canvas id="nw-spectrum" aria-hidden="true"></canvas><span id="nw-status" role="status">STANDBY</span>';
  const style = document.createElement("style");
  style.textContent = `
    #neon-wave-dock{position:fixed;z-index:99999;right:22px;top:82px;display:flex;align-items:center;gap:9px;padding:8px 11px;background:rgba(4,9,17,.92);border:1px solid rgba(0,240,255,.5);border-left:3px solid #ff2a6d;border-radius:3px 12px 3px 12px;box-shadow:0 8px 32px #000b,0 0 22px #00f0ff22;font:600 10px/1.2 ui-monospace,monospace;letter-spacing:.12em;color:#f2f7ff}
    #nw-toggle{display:flex;align-items:center;gap:8px;background:transparent;border:0;color:inherit;cursor:pointer;font:inherit;letter-spacing:inherit;padding:3px}
    #nw-toggle:hover{color:#00f0ff} #nw-toggle:focus-visible{outline:2px solid #00f0ff;outline-offset:4px}
    .nw-dot{width:7px;height:7px;border-radius:50%;background:#657080}
    #neon-wave-dock.nw-active .nw-dot{background:#00f0ff;box-shadow:0 0 9px #00f0ff}
    #nw-spectrum{width:108px;height:27px;display:block}
    #nw-status{color:#ff2a6d;font-size:9px;min-width:48px;text-align:right}
    @media(max-width:700px){#neon-wave-dock{right:10px;top:68px}#nw-spectrum{width:65px}}
  `;
  (document.head || document.documentElement).append(style);

  const backdrop = document.createElement("div");
  backdrop.id = "nw-art-backdrop";
  document.documentElement.append(backdrop);
  const attachDock = () => {
    if (document.body && !host.isConnected) document.body.append(host);
  };
  attachDock();

  // Observe only the now-playing region, not Spotify's entire rapidly-changing app tree.
  let artworkObserver = null;
  let artworkRoot = null;
  let discoveryObserver = null;
  let lastArtwork = "";
  function updateArtwork() {
    if (!artworkRoot) return;
    const img = artworkRoot.querySelector('img[src], img[data-src]');
    const src = img?.currentSrc || img?.src || img?.getAttribute("data-src") || "";
    if (src && src !== lastArtwork) {
      lastArtwork = src;
      document.documentElement.style.setProperty("--nw-track-art", 'url("' + src.replace(/["\\\\]/g, "") + '")');
    }
  }
  function bindArtworkRoot() {
    const root = document.querySelector('[data-testid="now-playing-bar"]') ||
      document.querySelector('.Root__now-playing-bar') ||
      document.querySelector('footer');
    if (!root || root === artworkRoot) return !!root;
    artworkObserver?.disconnect();
    artworkRoot = root;
    artworkObserver = new MutationObserver(updateArtwork);
    artworkObserver.observe(root, {subtree:true, childList:true, attributes:true, attributeFilter:["src","srcset","data-src"]});
    updateArtwork();
    return true;
  }
  if (!bindArtworkRoot()) {
    discoveryObserver = new MutationObserver(() => {
      attachDock();
      if (bindArtworkRoot()) discoveryObserver.disconnect();
    });
    discoveryObserver.observe(document.documentElement, {childList:true,subtree:true});
  }

  const btn = host.querySelector("#nw-toggle");
  const canvas = host.querySelector("#nw-spectrum");
  const ctx = canvas.getContext("2d", {alpha:true});
  const status = host.querySelector("#nw-status");
  let active = false;
  const levels = new Float32Array(40);
  let lastDraw = 0;
  function draw(now = 0) {
    if (!active && now) return;
    if (now && now - lastDraw < 45) return;
    lastDraw = now || lastDraw;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = canvas.clientWidth || 108, h = canvas.clientHeight || 27;
    const targetW = Math.round(w*dpr), targetH = Math.round(h*dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) { canvas.width=targetW; canvas.height=targetH; }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    const gap=2, bw=(w-gap*(levels.length-1))/levels.length;
    const grad=ctx.createLinearGradient(0,0,0,h);
    grad.addColorStop(0,"#ff2a6d"); grad.addColorStop(.52,"#bd00ff"); grad.addColorStop(1,"#00f0ff");
    ctx.fillStyle=grad;
    for(let i=0;i<levels.length;i++) {
      const bh=Math.max(1,levels[i]*(h-2));
      ctx.fillRect(i*(bw+gap),h-bh,bw,bh);
    }
  }
  draw();

  btn.addEventListener("click", () => {
    btn.disabled=true;
    status.textContent=active?"STOPPING":"LINKING";
    chrome.runtime.sendMessage({type:active?"NW_STOP_CAPTURE":"NW_START_CAPTURE"}, response => {
      btn.disabled=false;
      if(chrome.runtime.lastError || !response?.ok) { status.textContent="NO SIGNAL"; return; }
      active=!active;
      host.classList.toggle("nw-active",active);
      btn.setAttribute("aria-pressed",String(active));
      status.textContent=active?"LIVE FFT":"STANDBY";
      if(!active) { levels.fill(0); draw(); }
    });
  });

  chrome.runtime.onMessage.addListener(message => {
    if(message?.type==="NW_FFT" && Array.isArray(message.bins) && active) {
      const bins=message.bins;
      for(let i=0;i<levels.length;i++) {
        const index=Math.floor(Math.pow(i/(levels.length-1),1.7)*(bins.length-1));
        levels[i]=Math.max(levels[i]*.72,Math.min(1,bins[index]/210));
      }
      draw(performance.now());
    }
    if(message?.type==="NW_CAPTURE_STOPPED") {
      active=false; host.classList.remove("nw-active");
      btn.setAttribute("aria-pressed","false"); status.textContent="STANDBY";
      levels.fill(0); draw();
    }
  });
})();