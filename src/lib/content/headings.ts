/** Heading anchors shared by the markdown renderer and the table of contents (works for Arabic too). */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractHeadings(body: string) {
  const headings: { id: string; text: string }[] = [];
  let inFence = false;
  for (const line of body.split("\n")) {
    if (line.trimStart().startsWith("```")) inFence = !inFence;
    if (inFence) continue;
    const m = /^##\s+(.+)$/.exec(line);
    if (m) headings.push({ id: slugifyHeading(m[1]), text: m[1].replace(/`/g, "") });
  }
  return headings;
}
