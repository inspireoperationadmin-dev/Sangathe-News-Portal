import "server-only";
import sanitizeHtml from "sanitize-html";

export function sanitizeArticleHtml(input: string) {
  return sanitizeHtml(input, {
    allowedTags: ["p", "h2", "h3", "strong", "em", "u", "s", "blockquote", "ul", "ol", "li", "a", "img", "hr", "br", "div", "iframe"],
    allowedAttributes: {
      a: ["href", "target", "rel"], img: ["src", "alt", "title", "width", "height"],
      p: ["style"], h2: ["style"], h3: ["style"], div: ["data-youtube-video"],
      iframe: ["src", "width", "height", "allowfullscreen", "allow", "frameborder"],
    },
    allowedStyles: { "*": { "text-align": [/^left$/, /^center$/, /^right$/, /^justify$/] } },
    allowedSchemes: ["http", "https", "mailto"],
    allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "youtube-nocookie.com"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }, true) },
  });
}

export function articleText(input: string) {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
}
