const inject = document.getElementById("inject");

const clicked = [];

inject.addEventListener("click", async () => {
  // Get tab + options (visuals, runObserver)
  const tab = await chrome.tabs.query({ active: true, currentWindow: true });
  const options = await chrome.storage.sync.get({
    visuals: false,
    runObserver: false,
  })

  // Send those options to Chrome
  // Make sure autoapply is true since they want to manually inject the content.
  chrome.tabs.sendMessage(tab[0].id, {
    ...options,
    autoapply: true
  })
});

window.onload = async function() {
  // Get URL for appending to text.
  const tab = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("onload" + Date(), tab)
}