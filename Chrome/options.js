const save = document.getElementById("save")
const autoapply = document.getElementById("autoapply")
const runObserver = document.getElementById("runObserver")


save.addEventListener("click", (e) => {
  // Save to chrome storage:
  chrome.storage.sync.set({
    autoapply: autoapply.checked,
    runObserver: runObserver.checked,
  }, function() {
    // Update status to let user know options were saved.
    save.innerText = 'Saved!'
    setTimeout(function() {
      save.innerText = 'Save';
    }, 450);
  });
})


document.addEventListener('DOMContentLoaded', (e) => {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    autoapply: false,
    runObserver: false,
  }, function(options) {
    if (options.autoapply) {
      autoapply.checked = true
    }

    if (options.runObserver) {
      runObserver.checked = true
    }
  });
});



