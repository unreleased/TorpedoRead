/**
 * Visualizer codebase
 */

 const visualizer = {
  contrast: {
    bold: document.getElementById("boldContrast"),
    regular: document.getElementById("regularContrast"),
    thickness: document.getElementById("thickness")
  },
  baseThickness: document.getElementById("baseThickness"),
  spacing: document.getElementById("spacing"),
  font: document.getElementById("font"),
}

const saveContrastBold = () => {
  const brightness = parseFloat(visualizer.contrast.bold.value)
  const elements = document.getElementsByClassName("torpedo__bold")
  for (const el of elements) {
    el.style['filter'] = `brightness(${brightness})`
  }
}

const saveContrastRegular = () => {
  const brightness = parseFloat(visualizer.contrast.regular.value)
  const elements = document.getElementsByClassName("torpedo__regular")
  for (const el of elements) {
    el.style['filter'] = `brightness(${brightness})`
  }
}

const saveSpacing = () => {
  const spacing = parseFloat(visualizer.spacing.value)
  const elements = document.querySelectorAll("[class^=torpedo__]")
  for (const el of elements) {
    el.style['letter-spacing'] = `${spacing}px`
  }
}

const saveFont = () => {
  const font = visualizer.font.value
  const elements = document.querySelectorAll("[class^=torpedo__]")
  for (const el of elements) {
    el.style['font-family'] = font
  }
}

const saveThickness = () => {
  const baseThickness = parseInt(visualizer.baseThickness.value)
  const contrastThickness = parseInt(visualizer.contrast.thickness.value)

  for (const el of document.getElementsByClassName("torpedo__bold")) {
    el.style['font-weight'] = baseThickness + contrastThickness
  }

  for (const el of document.getElementsByClassName("torpedo__regular")) {
    el.style['font-weight'] = baseThickness
  }
}

visualizer.baseThickness.addEventListener("change", saveThickness);
visualizer.contrast.thickness.addEventListener("change", saveThickness);
visualizer.font.addEventListener("change", saveFont);
visualizer.spacing.addEventListener("input", saveSpacing);
visualizer.contrast.regular.addEventListener("input", saveContrastRegular);
visualizer.contrast.bold.addEventListener("input", saveContrastBold);

/**
 * Code for saving to Chrome Storage
 */

const save = document.getElementById("saveVisuals")

save.addEventListener("click", () => {
  const visuals = {
    contrast: {
      bold: visualizer.contrast.bold.value,
      regular: visualizer.contrast.regular.value,
      thickness: parseInt(visualizer.contrast.thickness.value),
    },
    baseThickness: parseInt(visualizer.baseThickness.value),
    spacing: visualizer.spacing.value,
    font: visualizer.font.value,
  }
  
  chrome.storage.sync.set({
    visuals: visuals
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
    visuals: false
  }, function(options) {
    if (options.visuals) {
      visualizer.contrast.bold.value = options.visuals.contrast.bold
      visualizer.contrast.regular.value = options.visuals.contrast.regular
      visualizer.contrast.thickness.value = options.visuals.contrast.thickness
      visualizer.baseThickness.value = options.visuals.baseThickness
      visualizer.spacing.value = options.visuals.spacing
      visualizer.font.value = options.visuals.font
    }

    saveThickness();
    saveFont();
    saveSpacing();
    saveContrastRegular();
    saveContrastBold();
  });
});

