export type SearchDoc = {
  id: string;
  kind: "lesson" | "path" | "certification";
  title: string;
  summary: string;
  href: string;
  context: string;
  /** Text fields with weights: title > headings/terms > body */
  fields: { text: string; weight: number }[];
};

export type SearchHit = {
  doc: SearchDoc;
  score: number;
  snippet: string;
};

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "is", "how", "what", "with",
  "في", "من", "على", "إلى", "الى", "عن", "ما", "هو", "هي", "و", "او", "أو", "مع", "هذا", "هذه",
]);

/**
 * Normalise text for matching. Latin: lowercase, strip accents. Arabic: strip diacritics and tatweel,
 * unify alef, ya and ta marbuta forms, and drop a leading definite article ("ال", "وال", "بال"…)
 * so "الاختبار" and "اختبار" match.
 */
function normalizeToken(token: string): string {
  let t = token
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647");
  if (/^[\u0600-\u06FF]/.test(t) && t.length > 4) {
    t = t.replace(/^(?:[وفبكل]?ال|لل)/, "");
  }
  return t;
}

function words(input: string): string[] {
  return input
    .toLowerCase()
    .normalize("NFKD")
    // Strip Latin accents and Arabic diacritics/tatweel before splitting: they are combining
    // marks, not letters, so leaving them in would split words in two.
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u0640]/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .map(normalizeToken);
}

const STOP_NORMALIZED = new Set([...STOP].flatMap(words));

export function tokenize(input: string): string[] {
  return words(input).filter((t) => t.length > 1 && !STOP_NORMALIZED.has(t));
}

function stripMarkdown(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_|\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function makeSnippet(text: string, terms: string[], length = 180): string {
  const plain = stripMarkdown(text);
  const lower = plain.toLowerCase();
  let at = -1;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) return plain.slice(0, length) + (plain.length > length ? "…" : "");
  const start = Math.max(0, at - 60);
  const slice = plain.slice(start, start + length);
  return (start > 0 ? "…" : "") + slice + (start + length < plain.length ? "…" : "");
}

/**
 * Rank documents by weighted term frequency, requiring every query term to appear somewhere (AND semantics).
 * Prefix matches count, so "partition" finds "partitioning".
 */
export function searchDocs(docs: SearchDoc[], query: string): SearchHit[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  const hits: SearchHit[] = [];
  for (const doc of docs) {
    let score = 0;
    let allMatched = true;
    for (const term of terms) {
      let termScore = 0;
      for (const f of doc.fields) {
        const words = tokenize(f.text);
        for (const w of words) {
          if (w === term) termScore += f.weight;
          else if (w.startsWith(term)) termScore += f.weight * 0.6;
        }
      }
      if (termScore === 0) {
        allMatched = false;
        break;
      }
      score += Math.log(1 + termScore);
    }
    if (!allMatched) continue;
    const bodyField = doc.fields[doc.fields.length - 1]?.text ?? doc.summary;
    hits.push({ doc, score, snippet: makeSnippet(bodyField, terms) });
  }
  return hits.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title));
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1), totalPages);
  return {
    items: items.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    totalPages,
    total: items.length,
  };
}
