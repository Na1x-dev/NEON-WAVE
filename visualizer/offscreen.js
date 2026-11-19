"use strict";
let stream = null;
let audioContext = null;
let source = null;
let analyser = null;
let raf = 0;
let activeTabId = null;\nlet lastSendAt = 0;\nlet frequencyData = null;

async function stop() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  try { source?.disconnect(); } catch {}
  try { analyser?.disconnect(); } catch {}
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null; source = null; analyser = null;
  if (audioContext && audioContext.state !== "closed") await audioContext.close();
  audioContext = null;
  const tabId = activeTabId;
  activeTabId = null;
  if (tabId !== null) chrome.runtime.sendMessage({type:"NW_OFFSCREEN_STOPPED",tabId}).catch(()=>{});
}
function analyse() {
  if (!analyser || !activeTabId) return;
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  const bins = [];
  const count = 64;
  for (let i=0;i<count;i++) {
    const start = Math.floor(Math.pow(i/count,2)*data.length);
    const end = Math.max(start+1,Math.floor(Math.pow((i+1)/count,2)*data.length));
    let peak = 0;
    for (let j=start;j<Math.min(end,data.length);j++) peak = Math.max(peak,data[j]);
    bins.push(peak);
  }
  chrome.runtime.sendMessage({type:"NW_FFT_FROM_OFFSCREEN",tabId:activeTabId,bins}).catch(()=>{});
  raf = requestAnimationFrame(analyse);
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.target !== "offscreen") return;
  if (message.type === "NW_OFFSCREEN_STOP") {
    stop().then(()=>sendResponse({ok:true}),()=>sendResponse({ok:false}));
    return true;
  }
  if (message.type === "NW_OFFSCREEN_START") {
    (async () => {
      try {
        await stop();
        activeTabId = message.tabId;
        stream = await navigator.mediaDevices.getUserMedia({
          audio:{mandatory:{chromeMediaSource:"tab",chromeMediaSourceId:message.streamId}},
          video:false
        });
        audioContext = new AudioContext();
        source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = .82;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        await audioContext.resume();
        analyse();
        sendResponse({ok:true});
      } catch (error) {
        await stop();
        sendResponse({ok:false,error:String(error?.message || error)});
      }
    })();
    return true;
  }
});