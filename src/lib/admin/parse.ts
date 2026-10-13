/**
 * Plain-text formats used by the admin forms, so editors can work in a textarea:
 *
 *   lines      one item per line
 *   pairs      "left :: right" per line (key terms, common mistakes)
 *   references "title | https://url | publisher" per line
 *
 * Each parser returns either a value or the 1-based number of the first bad line.
 */
export type Parsed<T> = { ok: true; value: T } | { ok: false; line: number };

export function parseLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function formatLines(items: string[]): string {
  return items.join("\n");
}

export function parsePairs(text: string): Parsed<[string, string][]> {
  const out: [string, string][] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const at = line.indexOf("::");
    if (at <= 0) return { ok: false, line: i + 1 };
    const left = line.slice(0, at).trim();
    const right = line.slice(at + 2).trim();
    if (!left || !right) return { ok: false, line: i + 1 };
    out.push([left, right]);
  }
  return { ok: true, value: out };
}

export function formatPairs(pairs: [string, string][]): string {
  return pairs.map(([a, b]) => `${a} :: ${b}`).join("\n");
}

export type ReferenceLine = { title: string; url: string; publisher: string };

export function parseReferences(text: string): Parsed<ReferenceLine[]> {
  const out: ReferenceLine[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length !== 3 || !parts[0] || !parts[2] || !/^https:\/\/[^\s]+$/.test(parts[1])) return { ok: false, line: i + 1 };
    out.push({ title: parts[0], url: parts[1], publisher: parts[2] });
  }
  return { ok: true, value: out };
}

export function formatReferences(refs: ReferenceLine[]): string {
  return refs.map((r) => `${r.title} | ${r.url} | ${r.publisher}`).join("\n");
}

/** Accepts a YouTube watch/short/embed URL, a youtu.be link, or a bare 11-character id. */
export function parseYouTubeId(input: string): string | null {
  const v = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
  let url: URL;
  try {
    url = new URL(v);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/);
      id = m?.[1] ?? null;
    }
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
