import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import type { Filing, ParsedFiling } from '@/types/filing';
import { parseDate } from '@/utils/dateUtils';
import { normalizeSentiment } from '@/utils/sentimentUtils';

const SHEET_URLS = [
  // 2026
  atob(['aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20v','c3ByZWFkc2hlZXRzL2QvMUJKS051anFS','OHVxQ1Jkc3ZHTm1CTklHS2FSTk1y','NFFtbjZocmtTdXdobFkvZXhwb3J0','P2Zvcm1hdD1jc3Y='].join('')),
  // 2025
  'https://docs.google.com/spreadsheets/d/1BJKNujqR8uqCRdsvGNmBNIGKaRNMr4Qmn6hrkSuwhY/export?format=csv&gid=0',
  // 2024
  'https://docs.google.com/spreadsheets/d/11gJMh6GM0PyPojlJ2U8EH3n23F09yuc-IdCGiTNcd_k/export?format=csv',
  // 2023
  'https://docs.google.com/spreadsheets/d/11gJMh6GM0PyPojlJ2U8EH3n23F09yuc-IdCGiTNcd_k/export?format=csv',
];

// We need the actual separate sheet IDs. Let me use the one provided for 2023 and derive others.
// User said 2023 sheet: https://docs.google.com/spreadsheets/d/11gJMh6GM0PyPojlJ2U8EH3n23F09yuc-IdCGiTNcd_k/
// The 2026 sheet is already known. For 2024/2025 we need separate sheet IDs.
// For now, use the 2026 main sheet and the 2023 sheet. User can provide 2024/2025 later.

function getSheetExportUrl(sheetId: string, gid?: string): string {
  let url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  if (gid) url += `&gid=${gid}`;
  return url;
}

const SHEETS = [
  // 2026 (original)
  atob(['aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20v','c3ByZWFkc2hlZXRzL2QvMUJKS051anFS','OHVxQ1Jkc3ZHTm1CTklHS2FSTk1y','NFFtbjZocmtTdXdobFkvZXhwb3J0','P2Zvcm1hdD1jc3Y='].join('')),
  // 2023
  getSheetExportUrl('11gJMh6GM0PyPojlJ2U8EH3n23F09yuc-IdCGiTNcd_k'),
];

function parseSheet(url: string): Promise<ParsedFiling[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Filing>(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: ParsedFiling[] = results.data
          .filter((row) => row.Title && row.Ticker)
          .map((row, i) => ({
            ...row,
            PubDateRaw: row.PubDate,
            PubDate: parseDate(row.PubDate),
            AI_Sentiment: normalizeSentiment(row.AI_Sentiment),
            id: `${row.Ticker}-${i}-${row.PubDate}`,
          }));
        resolve(parsed);
      },
      error: (err) => reject(err),
    });
  });
}

export function useFilings() {
  const [filings, setFilings] = useState<ParsedFiling[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchFilings = useCallback(() => {
    setLoading(true);
    setError(null);

    Promise.all(SHEETS.map(url => parseSheet(url)))
      .then((results) => {
        // Combine all sheets, deduplicate by id, sort by date desc
        const all = results.flat();
        const seen = new Set<string>();
        const deduped: ParsedFiling[] = [];
        for (const f of all) {
          if (!seen.has(f.id)) {
            seen.add(f.id);
            deduped.push(f);
          }
        }
        deduped.sort((a, b) => (b.PubDate?.getTime() ?? 0) - (a.PubDate?.getTime() ?? 0));
        setFilings(deduped);
        setLastFetched(new Date());
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch filings data');
        setLoading(false);
      });
  }, []);

  return { filings, loading, error, lastFetched, fetchFilings };
}
