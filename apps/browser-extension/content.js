(function () {
  const MAX_VISIBLE_TEXT = 15000;
  const SKIP_TAGS = new Set([
    "script",
    "style",
    "noscript",
    "template",
    "input",
    "textarea",
    "select",
    "svg",
    "button",
    "nav",
    "header",
    "footer",
  ]);
  const NOISE_PATTERNS = [
    /^skip to /i,
    /^0 notifications total$/i,
    /^notifications?$/i,
    /^messaging$/i,
    /^home$/i,
    /^my network$/i,
    /^jobs$/i,
    /^search$/i,
  ];

  function isVisible(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return true;
    }

    const tagName = element.tagName.toLowerCase();
    if (SKIP_TAGS.has(tagName)) {
      return false;
    }

    if (element.closest("nav, header, footer, aside, button, [aria-hidden='true'], [hidden]")) {
      return false;
    }

    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function isNoiseText(text) {
    return NOISE_PATTERNS.some((pattern) => pattern.test(text));
  }

  function getTextRoot() {
    return (
      document.querySelector("main") ||
      document.querySelector("[role='main']") ||
      document.querySelector("article") ||
      document.body
    );
  }

  function collectVisibleText() {
    const walker = document.createTreeWalker(getTextRoot(), NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const text = normalizeText(node.nodeValue);
        if (!text || isNoiseText(text) || !isVisible(node.parentElement)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const parts = [];
    let total = 0;
    let node = walker.nextNode();

    while (node && total < MAX_VISIBLE_TEXT) {
      const text = normalizeText(node.nodeValue);
      const remaining = MAX_VISIBLE_TEXT - total;
      parts.push(text.slice(0, remaining));
      total += text.length + 1;
      node = walker.nextNode();
    }

    return parts.join("\n").slice(0, MAX_VISIBLE_TEXT);
  }

  window.jobOpsCaptureCollectPageData = function () {
    return {
      title: document.title || "",
      url: window.location.href,
      selected_text: String(window.getSelection ? window.getSelection() : "").slice(0, MAX_VISIBLE_TEXT),
      dom_text: collectVisibleText(),
    };
  };
})();
