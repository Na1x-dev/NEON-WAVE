const KEY="neonWaveThemeEnabled";
const toggle=document.getElementById("theme-toggle");
const status=document.getElementById("status");
chrome.storage.local.get({[KEY]:true}, value => { toggle.checked=value[KEY]!==false; });
toggle.addEventListener("change", () => {
  chrome.storage.local.set({[KEY]:toggle.checked}, () => {
    status.textContent=toggle.checked ? "Тема включена." : "Тема отключена.";
  });
});