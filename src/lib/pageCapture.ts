"use client";

/**
 * Extract visible textual content from the current document.
 * This function attempts to get only user-visible text by walking the
 * DOM and collecting text from visible elements while skipping scripts,
 * styles, and aria-hidden elements.
 */
export function captureVisibleText(options?: { maxChars?: number }) {
  const maxChars = options?.maxChars ?? 20_000;

  function isVisible(el: Element) {
    if (!(el instanceof HTMLElement)) return false;
    const style = window.getComputedStyle(el);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    )
      return false;
    if (el.hasAttribute("hidden")) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    return true;
  }

  const nodeFilter: NodeFilter = {
    acceptNode(node: Node) {
      // filter out purely whitespace nodes
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
      if (!/\S/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
      const parent = (node as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (["script", "style", "noscript", "svg", "canvas"].includes(tag))
        return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  };

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    nodeFilter
  );

  let text = "";
  let node: Node | null = walker.nextNode();
  while (node && text.length < maxChars) {
    const parent = node.parentElement as HTMLElement | null;
    if (parent && isVisible(parent)) {
      // normalize whitespace
      const chunk = node.nodeValue?.replace(/\s+/g, " ").trim() ?? "";
      if (chunk) {
        if (text) text += " ";
        text += chunk;
      }
    }
    node = walker.nextNode();
  }

  if (text.length > maxChars) {
    text = text.slice(0, maxChars) + "\n\n[truncated]";
  }

  return text;
}
