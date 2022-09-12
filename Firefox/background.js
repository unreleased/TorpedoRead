let injected = false

chrome.commands.onCommand.addListener(async (command) => {
  console.log("COMMAND!")
  if (!injected) {
    injected = true
    const tab = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    const options = await browser.storage.sync.get({
      runObserver: false,
      visuals: false,
    })

    console.log(`[TorpedoRead] Sending script message due to user input.`)
    chrome.tabs.sendMessage(tab[0].id, {
      ...options,
      startCommand: true,
    });
  }
});

chrome.tabs.onUpdated.addListener(async function (id, change, tab) {
  if (change.status === "complete") {
    injected = false
    try {
      const url = new URL(tab.url);
      if (["file:", "http:", "https:"].includes(url.protocol)) {
        // Get options
        const options = await browser.storage.sync.get({
          runObserver: false,
          autoapply: false,
          visuals: false
        })

        if (options.autoapply) {
          injected = true
          const tab = await browser.tabs.query({ active: true, lastFocusedWindow: true });

          console.log(`[TorpedoRead] Sending script message due to AutoApply`)
          chrome.tabs.sendMessage(tab[0].id, options)
        }
      }
    } catch (err) {
      console.log(`err: ${err.message}`);
    }
  }
});
