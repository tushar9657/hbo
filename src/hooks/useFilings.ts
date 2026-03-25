import { useState, useCallback, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import type { Filing, ParsedFiling } from '@/types/filing';
import { parseDate } from '@/utils/dateUtils';
import { normalizeSentiment } from '@/utils/sentimentUtils';

function getSheetExportUrl(sheetId: string, gid?: string): string {
  let url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  if (gid) url += `&gid=${gid}`;
  return url;
}

// 2026 (current year - load first)
const CURRENT_YEAR_URL = atob(['aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20v','c3ByZWFkc2hlZXRzL2QvMUJKS051anFS','OHVxQ1Jkc3ZHTm1CTklHS2FSTk1y','NFFtbjZocmtTdXdobFkvZXhwb3J0','P2Zvcm1hdD1jc3Y='].join(''));

// Historical sheets (loaded in background)
const HISTORICAL_URLS = [
  // 2025
  getSheetExportUrl('1oqyfvDGMs9PbhHd2W7EbDOtBAFOLm8fsUeAQUWuy69E'),
  // 2024
  getSheetExportUrl('1-NC0IK2VnZx-TrZqMbKmbw-0DEnUZNEBT2puWpD7Grw'),
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

function dedupeAndSort(filings: ParsedFiling[]): ParsedFiling[] {
  const seen = new Set<string>();
  const deduped: ParsedFiling[] = [];
  for (const f of filings) {
    if (!seen.has(f.id)) {
      seen.add(f.id);
      deduped.push(f);
    }
  }
  deduped.sort((a, b) => (b.PubDate?.getTime() ?? 0) - (a.PubDate?.getTime() ?? 0));
  return deduped;
}

function filterLastMonth(filings: ParsedFiling[]): ParsedFiling[] {
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  return filings.filter(f => f.PubDate && f.PubDate >= oneMonthAgo);
}

export function useFilings() {
  const [filings, setFilings] = useState<ParsedFiling[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const historicalLoaded = useRef(false);

  const fetchFilings = useCallback(() => {
    setLoading(true);
    setError(null);
    historicalLoaded.current = false;

    // Load current year first (last 1 month only for fast initial render)
    parseSheet(CURRENT_YEAR_URL)
      .then((currentYear) => {
        const lastMonth = filterLastMonth(currentYear);
        setFilings(dedupeAndSort(lastMonth.length > 0 ? lastMonth : currentYear.slice(0, 50)));
        setLastFetched(new Date());
        setLoading(false);

        // Then load full current year
        setFilings(dedupeAndSort(currentYear));

        // Background load historical sheets
        Promise.all(HISTORICAL_URLS.map(url => parseSheet(url).catch(() => [] as ParsedFiling[])))
          .then((historicalResults) => {
            historicalLoaded.current = true;
            setFilings(prev => dedupeAndSort([...prev, ...historicalResults.flat()]));
          });
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch filings data');
        setLoading(false);
      });
  }, []);

  return { filings, loading, error, lastFetched, fetchFilings };
}
