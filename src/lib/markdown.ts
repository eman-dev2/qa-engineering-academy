import { cacheLife } from "next/cache";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import type { Root, Element, Text } from "hast";
import { visit } from "unist-util-visit";
import { slugifyHeading } from "@/lib/content/headings";

function textOf(node: Element): string {
  let out = "";
  visit(node, "text", (t: Text) => {
    out += t.value;
  });
  return out;
}

/** Give h2/h3 ids that match the table of contents, and mark external links. */
function rehypeAcademy() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "h2" || node.tagName === "h3") {
        node.properties = { ...node.properties, id: slugifyHeading(textOf(node)) };
      }
      if (node.tagName === "a") {
        const href = String(node.properties?.href ?? "");
        if (/^https?:\/\//.test(href)) {
          node.properties = { ...node.properties, target: "_blank", rel: ["noopener", "noreferrer"] };
        }
      }
      if (node.tagName === "table") {
        node.properties = { ...node.properties, tabIndex: 0 };
      }
    });
  };
}

/**
 * Render trusted, repository-authored markdown to HTML.
 * Cached: the output only depends on the input text, so it joins the static shell.
 */
export async function renderMarkdown(markdown: string): Promise<string> {
  "use cache";
  cacheLife("max");
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeShiki, {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: "light",
      langs: ["ts", "typescript", "json", "bash", "http"],
    })
    .use(rehypeAcademy)
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}
