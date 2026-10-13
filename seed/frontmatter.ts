import { parse } from "yaml";

/**
 * Split a Markdown file into YAML frontmatter and body.
 *
 *   ---
 *   title: "..."
 *   ---
 *   ## Body
 */
export function parseFrontmatter(source: string): { data: Record<string, unknown>; content: string } {
  const text = source.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!match) throw new Error("The file has no YAML frontmatter block (--- ... ---) at the top.");
  const data = parse(match[1]) as unknown;
  if (data === null || typeof data !== "object" || Array.isArray(data)) throw new Error("The frontmatter must be a YAML mapping.");
  return { data: data as Record<string, unknown>, content: match[2] };
}
