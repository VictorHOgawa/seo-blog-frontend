export interface ParsedIdea {
  titleSeed: string;
  briefing?: string;
  keywords?: string[];
  locale?: string;
  notes?: string;
}

/** Bulk paste — uma ideia por linha. Linhas vazias ignoradas. */
export function parsePaste(text: string): ParsedIdea[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((titleSeed) => ({ titleSeed }));
}

/** Markdown — aceita listas `- item`, `* item`, `1. item`. Fallback: linha por linha. */
export function parseMarkdown(text: string): ParsedIdea[] {
  const out: ParsedIdea[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m =
      line.match(/^[-*]\s+(.+)$/) ?? line.match(/^\d+[.)]\s+(.+)$/) ?? null;
    out.push({ titleSeed: m ? m[1].trim() : line });
  }
  return out;
}

/** JSON — array de objetos. Aceita {title|titleSeed, briefing, keywords[]}. */
export function parseJson(text: string): ParsedIdea[] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('JSON deve ser um array');
  return data.map((row, idx) => {
    if (typeof row === 'string') return { titleSeed: row };
    const titleSeed = String(row.titleSeed ?? row.title ?? '').trim();
    if (!titleSeed) throw new Error(`item #${idx + 1}: titleSeed obrigatório`);
    return {
      titleSeed,
      briefing: row.briefing ?? row.description ?? undefined,
      keywords: Array.isArray(row.keywords) ? row.keywords.map(String) : undefined,
      locale: row.locale ?? undefined,
      notes: row.notes ?? undefined,
    };
  });
}

/**
 * CSV simples. Primeira linha = header. Suporta valores entre aspas e vírgulas dentro.
 * Colunas aceitas: titleSeed | title (obrigatória), briefing, keywords, locale, notes.
 * keywords = csv interno separado por `;` ou `|`.
 */
export function parseCsv(text: string): ParsedIdea[] {
  const rows = csvRows(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const titleIdx = headers.findIndex((h) => h === 'titleseed' || h === 'title');
  if (titleIdx < 0) throw new Error('CSV precisa coluna "title" ou "titleSeed"');
  const briefIdx = headers.findIndex((h) => h === 'briefing' || h === 'description');
  const kwIdx = headers.findIndex((h) => h === 'keywords');
  const localeIdx = headers.findIndex((h) => h === 'locale');
  const notesIdx = headers.findIndex((h) => h === 'notes');

  const out: ParsedIdea[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every((c) => !c.trim())) continue;
    const titleSeed = (row[titleIdx] ?? '').trim();
    if (!titleSeed) continue;
    out.push({
      titleSeed,
      briefing: briefIdx >= 0 ? row[briefIdx]?.trim() || undefined : undefined,
      keywords:
        kwIdx >= 0 && row[kwIdx]
          ? row[kwIdx]
              .split(/[;|]/)
              .map((k) => k.trim())
              .filter(Boolean)
          : undefined,
      locale: localeIdx >= 0 ? row[localeIdx]?.trim() || undefined : undefined,
      notes: notesIdx >= 0 ? row[notesIdx]?.trim() || undefined : undefined,
    });
  }
  return out;
}

function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') {
        row.push(cur);
        cur = '';
      } else if (c === '\n') {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
      } else if (c === '\r') {
        /* skip */
      } else {
        cur += c;
      }
    }
  }
  if (cur || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}
