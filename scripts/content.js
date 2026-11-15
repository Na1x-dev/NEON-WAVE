(() => {
  "use strict";
  if (window.__NEON_WAVE_LOADED__) return;
  window.__NEON_WAVE_LOADED__ = true;

  const host = document.createElement("div");
  host.id = "neon-wave-dock";
  host.innerHTML = `
    <button id="nw-toggle" type="button" aria-pressed="false" title="Start live audio visualizer">
      <span class="nw-dot"></span><span class="nw-label">WAVE / VISUALIZER</span>
    </button>
    <canvas id="nw-spectrum" aria-hidden="true"></canvas>
    <span id="nw-status" role="status">STANDBY</span>`;
  const style = document.createElement("style");
  style.textContent = `
    #neon-wave-dock{position:fixed;z-index:99999;right:22px;top:82px;display:flex;align-items:center;gap:9px;padding:8px 11px;background:rgba(7,12,26,.88);border:1px solid rgba(85,243,255,.34);border-radius:13px;box-shadow:0 8px 32px #0008,0 0 22px #55f3ff18;backdrop-filter:blur(16px);font:600 10px/1.2 ui-monospace,monospace;letter-spacing:.12em;color:#eafaff}
    #nw-toggle{display:flex;align-items:center;gap:8px;background:transparent;border:0;color:inherit;cursor:pointer;font:inherit;letter-spacing:inherit;padding:3px}
    #nw-toggle:hover{color:#55f3ff} #nw-toggle:focus-visible{outline:2px solid #55f3ff;outline-offset:4px}
    .nw-dot{width:7px;height:7px;border-radius:50%;background:#718096;box-shadow:0 0 8px currentColor}
    #neon-wave-dock.nw-active .nw-dot{background:#55f3ff;color:#55f3ff;animation:nw-pulse 1.2s infinite}
    #nw-spectrum{width:108px;height:27px;display:block}
    #nw-status{color:#91a2bb;font-size:9px;min-width:48px;text-align:right}
    @keyframes nw-pulse{50%{opacity:.35;box-shadow:0 0 2px currentColor}}
    @media(max-width:700px){#neon-wave-dock{right:10px;top:68px}#nw-spectrum{width:65px}}
  `;
  (document.head || document.documentElement).append(style);
  (document.body || document.documentElement).append(host);

  const btn = host.querySelector("#nw-toggle");
  const canvas = host.querySelector("#nw-spectrum");
  const ctx = canvas.getContext("2d");
  const status = host.querySelector("#nw-status");
  let active = false;
  let levels = new Array(48).fill(0);

  function draw() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 108, h = canvas.clientHeight || 27;
    if (canvas.width !== Math.round(w*dpr) || canvas.height !== Math.round(h*dpr)) {
      canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    const gap = 2, bw = (w-gap*(levels.length-1))/levels.length;
    levels.forEach((v,i) => {
      const bh = Math.max(2, v*(h-2));
      const grad = ctx.createLinearGradient(0,h-bh,0,h);
      grad.addColorStop(0,"#ff4fd8"); grad.addColorStop(.55,"#9b7bff"); grad.addColorStop(1,"#55f3ff");
      ctx.fillStyle = grad;
      ctx.fillRect(i*(bw+gap),h-bh,bw,bh);
    });
  }
  draw();

  btn.addEventListener("click", () => {
    btn.disabled = true;
    status.textContent = active ? "STOPPING" : "CONNECTING";
    chrome.runtime.sendMessage({type: active ? "NW_STOP_CAPTURE" : "NW_START_CAPTURE"}, response => {
      btn.disabled = false;
      if (chrome.runtime.lastError || !response || !response.ok) {
        status.textContent = "UNAVAILABLE";
        return;
      }
      active = !active;
      host.classList.toggle("nw-active", active);
      btn.setAttribute("aria-pressed", String(active));
      btn.title = active ? "Stop live audio visualizer" : "Start live audio visualizer";
      status.textContent = active ? "LIVE FFT" : "STANDBY";
      if (!active) { levels.fill(0); draw(); }
    });
  });

  chrome.runtime.onMessage.addListener(message => {
    if (message?.type === "NW_FFT" && Array.isArray(message.bins)) {
      const bins = message.bins;
      for (let i=0;i<levels.length;i++) {
        const index = Math.floor(Math.pow(i/(levels.length-1), 1.7)*(bins.length-1));
        levels[i] = Math.max(levels[i]*.72, Math.min(1, bins[index]/210));
      }
      draw();
    }
    if (message?.type === "NW_CAPTURE_STOPPED") {
      active = false; host.classList.remove("nw-active");
      btn.setAttribute("aria-pressed","false"); status.textContent="STANDBY";
      levels.fill(0); draw();
    }
  });
})();