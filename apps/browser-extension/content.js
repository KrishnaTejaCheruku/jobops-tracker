(function () {
  const MAX_VISIBLE_TEXT = 15000;

  function isVisible(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return true;
    }

    const tagName = element.tagName.toLowerCase();
    if (["script", "style", "noscript", "template", "input", "textarea", "select"].includes(tagName)) {
      return false;
    }

    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function collectVisibleText() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const text = node.nodeValue.replace(/\s+/g, " ").trim();
        if (!text || !isVisible(node.parentElement)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const parts = [];
    let total = 0;
    let node = walker.nextNode();

    while (node && total < MAX_VISIBLE_TEXT) {
      const text = node.nodeValue.replace(/\s+/g, " ").trim();
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
