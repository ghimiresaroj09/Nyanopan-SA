/**
 * Allowlist-based HTML sanitizer for rich-text policy content.
 * Unknown tags are unwrapped (children kept); dangerous elements are
 * removed with their content; every attribute is stripped except a
 * safe `href` on anchors.
 */

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'HR',
  'STRONG', 'B', 'EM', 'I', 'U', 'S', 'SUB', 'SUP',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'UL', 'OL', 'LI',
  'A', 'BLOCKQUOTE', 'PRE', 'CODE',
  'SPAN', 'DIV',
  'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TD', 'TH',
]);

const REMOVE_WITH_CONTENTS = new Set([
  'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META',
  'FORM', 'INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'SVG', 'MATH',
  'VIDEO', 'AUDIO', 'SOURCE', 'TEMPLATE', 'BASE',
]);

const SAFE_HREF = /^(https?:|mailto:|tel:|#|\/)/i;

function cleanNode(node: Node, out: Node[], doc: Document): void {
  if (node.nodeType === Node.TEXT_NODE) {
    out.push(doc.importNode(node, false));
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as Element;
  const tag = element.tagName.toUpperCase();

  if (REMOVE_WITH_CONTENTS.has(tag)) return; // drop entirely

  const children: Node[] = [];
  node.childNodes.forEach((child) => cleanNode(child, children, doc));

  if (!ALLOWED_TAGS.has(tag)) {
    // Unknown tag: unwrap, keep the cleaned children.
    out.push(...children);
    return;
  }

  const clone = doc.createElement(tag.toLowerCase());
  if (tag === 'A') {
    const href = element.getAttribute('href') ?? '';
    if (SAFE_HREF.test(href.trim())) {
      clone.setAttribute('href', href.trim());
      clone.setAttribute('rel', 'noopener noreferrer');
    }
  }
  children.forEach((child) => clone.appendChild(child));
  out.push(clone);
}

export function sanitizeHtml(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const doc = document.implementation.createHTMLDocument('sanitized');
  const cleaned: Node[] = [];
  parsed.body.childNodes.forEach((child) => cleanNode(child, cleaned, doc));
  const holder = doc.createElement('div');
  cleaned.forEach((child) => holder.appendChild(child));
  return holder.innerHTML;
}
