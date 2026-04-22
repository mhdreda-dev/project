/**
 * Minimal, dependency-free CSV writer.
 *
 * Rules:
 *  - RFC 4180: CRLF row separator, double-quote-wrap any field that contains
 *    comma, quote, CR, LF, or leading/trailing whitespace.
 *  - Embedded double quotes are doubled.
 *  - `null` / `undefined` become empty strings, never "null"/"undefined".
 *  - BOM prefix so Excel on Windows opens UTF-8 files correctly.
 */

export type CsvRow = Record<string, unknown>

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let str: string
  if (value instanceof Date) {
    str = value.toISOString()
  } else if (typeof value === 'object') {
    // Dates, Decimals, etc. — rely on toString/JSON as best-effort.
    str = typeof (value as any).toString === 'function' ? (value as any).toString() : JSON.stringify(value)
  } else {
    str = String(value)
  }

  const needsQuote = /[",\r\n]/.test(str) || /^\s|\s$/.test(str)
  if (!needsQuote) return str
  return `"${str.replace(/"/g, '""')}"`
}

export function toCsv(rows: CsvRow[], columns: { key: string; header: string }[]): string {
  const header = columns.map((c) => escapeCell(c.header)).join(',')
  const body = rows
    .map((r) => columns.map((c) => escapeCell(r[c.key])).join(','))
    .join('\r\n')
  return '\uFEFF' + header + '\r\n' + body + (body ? '\r\n' : '')
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
