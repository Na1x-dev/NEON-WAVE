"use strict";
const OFFSCREEN_URL = "visualizer/offscreen.html";
let creatingOffscreen;

async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({contextTypes:["OFFSCREEN_DOCUMENT"], documentUrls:[chrome.runtime.getURL(OFFSCREEN_URL)]});
  if (contexts.length) return;
  if (creatingOffscreen) return creatingOffscreen;
  creatingOffscreen = chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons:["USER_MEDIA","AUDIO_PLAYBACK"],
    justification:"Capture the current Spotify tab after a user click, route its audio back to the tab, and analyse its frequency spectrum."
  });
  try { await creatingOffscreen; } finally { creatingOffscreen = null; }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "NW_START_CAPTURE") {
    (async () => {
      try {
        const tabId = sender.tab?.id;
        if (typeof tabId !== "number") throw new Error("No active tab");
        await ensureOffscreen();
        const streamId = await chrome.tabCapture.getMediaStreamId({targetTabId:tabId});
        const result = await chrome.runtime.sendMessage({target:"offscreen", type:"NW_OFFSCREEN_START", streamId, tabId});
        if (!result?.ok) throw new Error(result?.error || "Audio pipeline failed");
        sendResponse({ok:true});
      } catch (error) {
        sendResponse({ok:false,error:String(error?.message || error)});
      }
    })();
    return true;
  }
  if (message?.type === "NW_STOP_CAPTURE") {
    chrome.runtime.sendMessage({target:"offscreen",type:"NW_OFFSCREEN_STOP"}).then(
      () => sendResponse({ok:true}), () => sendResponse({ok:false})
    );
    return true;
  }
  if (message?.type === "NW_FFT_FROM_OFFSCREEN" && Number.isInteger(message.tabId)) {
    chrome.tabs.sendMessage(message.tabId,{type:"NW_FFT",bins:message.bins}).catch(()=>{});
  }
  if (message?.type === "NW_OFFSCREEN_STOPPED" && Number.isInteger(message.tabId)) {
    chrome.tabs.sendMessage(message.tabId,{type:"NW_CAPTURE_STOPPED"}).catch(()=>{});
  }
});