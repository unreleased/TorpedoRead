console.log("[TorpedoRead] Script Injected.")

const validateEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

function textNodesUnder(el) {
  if (el.nodeName === '#text') {
    if (el.parentElement.closest("pre, code, style, script, noscript, torpedo, input, textarea, br, img, hr, [contenteditable]")) {
      return []
    }

    return [ el ]
  }
  
  let n,
    a = [],
    walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, (node) => {
      // Check if element is some part of a code/pre element or part of a style or script.
      if (node.parentElement.closest("pre, code, style, script, noscript, torpedo, input, textarea, br, img, hr, [contenteditable]")) {
        return false
      }

      // Check string isn't empty
      // Usually found as part of webpage indenting
      if (node.textContent.trim().length === 0) {
        return false
      }

      return true
    });
    
  while ((n = walk.nextNode())) a.push(n);
  return a;
}

const check = (startEl = false, baseWeight = 300, weightContrast = 200) => {
  // Remove all existing Torpedo nodes and replace with their text.
  const body = startEl ? startEl : document.querySelector("body");
  if (!startEl) {
    console.log(`[TorpedoRead] Running Full Check.`) 
  }
  
  // Use the preferred element if defined otherwise whole page.
  // Used in MutationObserver
  const nodes = textNodesUnder(body);

  // Loop through all the nodes.
  for (const node of nodes) {
    checkNode(node, baseWeight, weightContrast)
  }
}

const checkNode = (node = false, baseWeight = 300, weightContrast = 200) => {  
  const words = node.textContent
    .split(/([\s-]+)/)
    .map((word, index) => {
      if (index % 2 === 0) {
        // Get style details (weight and italics)
        const styles = getComputedStyle(node.parentElement);
        const _weight = styles["font-weight"];
        const italic = styles["font-style"] === "italic";

        // Get weight, round to 100, take away 400 for the "boldness differentiator"
        const weight = (Math.round(_weight / 100) * 100) - baseWeight;
        const boldWeight = weight + baseWeight + weightContrast >= 800 ? 800 : weight + baseWeight + weightContrast
        const regularWeight = boldWeight - weightContrast

        const el = document.createElement("torpedo");
        el.innerHTML = Torpedify(word, boldWeight, regularWeight, italic);

        return el
      } else {
        return word
      }
    })

  node.replaceWith(...words);
}

const base = [0, 1, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6, 6];
const emojiRegex = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;


const Torpedify = (str, boldWeight, regularWeight, italic = false) => {
  // If emoji return the emoji
  if (emojiRegex.test(str)) {
    return `<torpedo class="torpedo__emoji">${str}</torpedo>`;
  }
  
  let prefix = ''
  let suffix = ''
  let content = str
  const letters = str.split("");

  // Get prefix + content strip
  for (const l of letters) {
    if ([",", "(", ")", "!", "?", ";", "[", "]", ".", ":", "'"].includes(l)) {
      prefix += l
      content = content.substring(1);
    } else {
      // String started, stop search.
      break;
    }
  }
  
  // Get suffix, content strip + stop cloning w/ reverse()
  // Don't run if content is empty because we already have punctuation
  if (content !== '') {
    for (const l of str.split("").reverse()) {
      if ([",", "(", ")", "!", "?", ";", "[", "]", ".", ":", "'"].includes(l)) {
        suffix = l + suffix
        content = content.slice(0, -1)
      } else {
        // String started, stop search.
        break;
      }
    }
  }

  const __italic = italic ? '__italic' : ''

  // Do not highlight any email addresses
  if (validateEmail(content)) {
    return `<torpedo class="torpedo__regular${__italic}__${regularWeight}">${content}</torpedo>`;
  }

  // Do not highlight any website URLs
  try {
    const protocols = ["file:", "http:", "https:"];
    const url = new URL(content);
    if (protocols.includes(url.protocol)) {
      return `<torpedo class="torpedo__regular${__italic}__${regularWeight}">${content}</torpedo>`;
    }
  } catch (e) {}

  // Recreate the initial and remaining text.
  const index = base[content.length] ? base[content.length] : 7;
  const contentSplit = content.split('')

  const initial = contentSplit.splice(0, index).join("");
  const remaining = contentSplit.join("");

  // Return as string
  const prefixEl = prefix.length > 0 ? `<torpedo class="torpedo__regular${__italic}__${regularWeight}">${prefix}</torpedo>` : ''
  const suffixEl = suffix.length > 0 ? `<torpedo class="torpedo__regular${__italic}__${regularWeight}">${suffix}</torpedo>` : ''
  const initialEl = initial.length > 0 ? `<torpedo class="torpedo__bold${__italic}__${boldWeight}">${initial}</torpedo>` : ''
  const remainingEl = remaining.length > 0 ? `<torpedo class="torpedo__regular${__italic}__${regularWeight}">${remaining}</torpedo>` : ''
  
  return prefixEl + initialEl + remainingEl + suffixEl;
};

const init = (visuals = false) => {
  /**
   * Init will inject the CSS required for our program to function.
   * Everyone else will be triggered using the Chrome runtime message receiver.
   */

  const exists = document.getElementById("torpedo__injected");
  if (exists) {
    // Already injected Torpedo.
    return;
  } else {
    if (!visuals) {
      visuals = {
        contrast: {
          bold: 1.2,
          regular: 1,
          thickness: 200
        },
        baseThickness: 300,
        spacing: 0,
        font: 'Open Sans',
      }
    }

    const extensionId = chrome.i18n.getMessage("@@extension_id")
    const css = `
    [class^="torpedo__regular"] {
      font-family: '${visuals.font}' !important;
      filter: brightness(${visuals.contrast.regular});
      font-weight: ${visuals.baseThickness};
      letter-spacing: ${visuals.spacing}px;
    }

    [class^="torpedo__bold"] {
      font-family: '${visuals.font}' !important;
      filter: brightness(${visuals.contrast.bold});
      font-weight: ${visuals.baseThickness + visuals.contrast.thickness};
      letter-spacing: ${visuals.spacing}px;
    }

    .torpedo__bold__300 {
      font-weight: 300 !important;;
    }

    .torpedo__bold__italic__300 {
      font-weight: 300 !important;;;
      font-style: italic;
    }

    .torpedo__bold__400 {
      font-weight: 400 !important;
      font-style: normal;
    }

    .torpedo__bold__italic__400 {
      font-weight: 400 !important;
      font-style: italic;
    }

    .torpedo__bold__500 {
      font-weight: 500 !important;
      font-style: normal;
    }

    .torpedo__bold__italic__500 {
      font-weight: 500 !important;
      font-style: italic;
    }

    .torpedo__bold__600 {
      font-weight: 600 !important;
      font-style: normal;
    }

    .torpedo__bold__italic__600 {
      font-weight: 600 !important;
      font-style: italic;
    }

    .torpedo__bold__700 {
      font-weight: 700 !important;
      font-style: normal;
    }

    .torpedo__bold__italic__700 {
      font-weight: 700 !important;
      font-style: italic;
    }

    .torpedo__bold__800 {
      font-weight: 800 !important;
      font-style: normal;
    }

    .torpedo__bold__italic__800 {
      font-weight: 800 !important;
      font-style: italic;
    }

    .torpedo__regular__300 {
      font-weight: 300 !important;;
    }

    .torpedo__regular__italic__300 {
      font-weight: 300 !important;;;
      font-style: italic;
    }

    .torpedo__regular__400 {
      font-weight: 400 !important;
      font-style: normal;
    }

    .torpedo__regular__italic__400 {
      font-weight: 400 !important;
      font-style: italic;
    }

    .torpedo__regular__500 {
      font-weight: 500 !important;
      font-style: normal;
    }

    .torpedo__regular__italic__500 {
      font-weight: 500 !important;
      font-style: italic;
    }

    .torpedo__regular__600 {
      font-weight: 600 !important;
      font-style: normal;
    }

    .torpedo__regular__italic__600 {
      font-weight: 600 !important;
      font-style: italic;
    }

    .torpedo__regular__700 {
      font-weight: 700 !important;
      font-style: normal;
    }

    .torpedo__regular__italic__700 {
      font-weight: 700 !important;
      font-style: italic;
    }

    .torpedo__regular__800 {
      font-weight: 800 !important;
      font-style: normal;
    }

    .torpedo__regular__italic__800 {
      font-weight: 800 !important;
      font-style: italic;
    }

    `;
    
    const style = document.createElement("style");
    style.id = "torpedo__injected";
    style.appendChild(document.createTextNode(css));

    // Inject fonts files without cramming the CSS inside the JS
    const fontLink = document.createElement("link")
    fontLink.setAttribute('href', `moz-extension://${extensionId}/fonts.css`)
    fontLink.setAttribute('type', 'text/css')
    fontLink.setAttribute('rel', 'stylesheet')

    const head = document.querySelector("head")
    head.appendChild(fontLink)
    head.appendChild(style)
  }
};


// We **do not** want to inject this twice. 
chrome.runtime.onMessage.addListener(function(options, sender, sendResponse) {
  // Only start the observer once the script has been started
  // The script can be started with the shortcut or autoapply setting
  if (options.runObserver && (options.startCommand || options.autoapply)) {
    console.log(`[TorpedoRead] Experimental observer launched.`)
    const weightContrast = options?.visuals?.contrast?.thickness || 200
    const baseWeight = options?.visuals?.baseThickness || 300

    /**
     * Create the MutationObservers
     */

    let NewNodeTimer;
    const NewNodeObserver = new MutationObserver(function(mutations) {
      // if (NewNodeTimer) clearTimeout(NewNodeTimer)

      // NewNodeTimer = setTimeout(() => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            // Get every new text nodes and append it to the TextChangeObserver.
            const textNodes = textNodesUnder(node)
            for (const node of textNodes) {
              const replaced = node.textContent.replaceAll(/([\s-]+)/gi, '')
              if (replaced.length > 0) {
                TextChangeObserver.observe(node, {
                  attributes: false,
                  childList: true,
                  characterData: true, 
                  subtree: true
                })

                // Torpedify!
                checkNode(node, baseWeight, weightContrast)
              }
            }
          })
        })
      // }, 25)
    });

    let TextChangeTimer;
    const TextChangeObserver = new MutationObserver(function(mutations) {
      if (TextChangeTimer) clearTimeout(TextChangeTimer)

      TextChangeTimer = setTimeout(() => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'characterData') {
            check(mutation.target, baseWeight, weightContrast)
          }
        })
      }, 25)
    });

    NewNodeObserver.observe(document.querySelector("body"), {
      attributes: false,
      childList: true,
      characterData: false, 
      subtree: true
    });

    // Start the observer.
    const nodes = textNodesUnder(document.querySelector("body"))
    console.log(`[TorpedoRead] Adding ${nodes.length} nodes to the TextChangeObserver.`)
    for (const node of nodes) {
      TextChangeObserver.observe(node, {
        attributes: false,
        childList: true,
        characterData: true, 
        subtree: true
      });
    }
  }

  // Init!
  init(options.visuals)

  if (options.autoapply) {
    // Autoapply and start the program!
    console.log("[TorpedoRead] Autoapply preference injected.")
    const weightContrast = options?.visuals?.contrast?.thickness || 200
    const baseWeight = options?.visuals?.baseThickness || 300

    check(false, baseWeight, weightContrast);
  }

  if (options.startCommand) {
    // Start the script!
    console.log("[TorpedoRead] Starting due to user input command.")
    const weightContrast = options?.visuals?.contrast?.thickness || 200
    const baseWeight = options?.visuals?.baseThickness || 300
    check(false, baseWeight, weightContrast);
  }
});