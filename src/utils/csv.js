function escapeCsvField(value) {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(headers, rows) {
  const head = headers.map(escapeCsvField).join(',');
  const lines = rows.map((row) => headers.map((h) => escapeCsvField(row[h])).join(','));
  return [head, ...lines].join('\n');
}

module.exports = { toCsv };


