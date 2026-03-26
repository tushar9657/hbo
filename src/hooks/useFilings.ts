import { useState, useCallback, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import type { Filing, ParsedFiling } from '@/types/filing';
import { parseDate } from '@/utils/dateUtils';
import { normalizeSentiment } from '@/utils/sentimentUtils';

const CACHE_KEY = 'hubble_filings_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getSheetExportUrl(sheetId: string, gid?: string): string {
  let url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  if (gid) url += `&gid=${gid}`;
  return url;
}

function getGvizQueryUrl(sheetId: string, sheetName: string, query: string): string {
  const encoded = encodeURIComponent(query);
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&tq=${encoded}`;
}

// Sheet IDs
const SHEET_IDS: Record<number, string> = {
  2026: '1BJKNujqR8uqCRdsvGNmBNIGKaRNMr4Qmn6hrkSuwhbY',
  2025: '1oqyfvDGMs9PbhHd2W7EbDOtBAFOLm8fsUeAQUWuy69E',
  2024: '1-NC0IK2VnZx-TrZqMbKmbw-0DEnUZNEBT2puWpD7Grw',
  2023: '11gJMh6GM0PyPojlJ2U8EH3n23F09yuc-IdCGiTNcd_k',
};

function getSheetName(year: number): string {
  return `${year}_NSE_Filings_Database`;
}

function parseCSVText(csvText: string): ParsedFiling[] {
  const result = Papa.parse<Filing>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data
    .filter((row) => row.Title && row.Ticker)
    .map((row, i) => ({
      ...row,
      PubDateRaw: row.PubDate,
      PubDate: parseDate(row.PubDate),
      AI_Sentiment: normalizeSentiment(row.AI_Sentiment),
      id: `${row.Ticker}-${i}-${row.PubDate}`,
    }));
}

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

function filterLastNDays(filings: ParsedFiling[], days: number): ParsedFiling[] {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  return filings.filter(f => f.PubDate && f.PubDate >= cutoff);
}

// localStorage cache helpers
function loadCache(): ParsedFiling[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    // Re-hydrate dates
    return data.map((f: any) => ({
      ...f,
      PubDate: f.PubDate ? new Date(f.PubDate) : null,
    }));
  } catch {
    return null;
  }
}

function saveCache(filings: ParsedFiling[]) {
  try {
    const slim = filings.slice(0, 500).map(f => ({
      ...f,
      PubDate: f.PubDate?.toISOString() ?? null,
    }));
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: slim, ts: Date.now() }));
  } catch { /* quota exceeded – ignore */ }
}

export interface FilingsLoadProgress {
  totalSheets: number;
  loadedSheets: number;
  labels: string[];
}

export function useFilings() {
  const [filings, setFilings] = useState<ParsedFiling[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [progress, setProgress] = useState<FilingsLoadProgress>({ totalSheets: 5, loadedSheets: 0, labels: [] });
  const abortRef = useRef(false);

  const fetchFilings = useCallback(() => {
    setLoading(true);
    setError(null);
    abortRef.current = false;
    setProgress({ totalSheets: 5, loadedSheets: 0, labels: [] });

    // Step 0: Show cached data instantly
    const cached = loadCache();
    if (cached && cached.length > 0) {
      setFilings(cached);
      setLoading(false);
    }

    const currentYear = new Date().getFullYear();
    const sheetId = SHEET_IDS[currentYear] || SHEET_IDS[2026];
    const sheetName = getSheetName(currentYear);

    // Step 1: Fetch last 30 days via Google Visualization API query filter
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const queryUrl = getGvizQueryUrl(sheetId, sheetName, 'select *');

    // Try query API first for speed, fallback to full CSV
    fetch(queryUrl)
      .then(r => {
        if (!r.ok) throw new Error('Query API failed');
        return r.text();
      })
      .then(csvText => parseCSVText(csvText))
      .catch(() => {
        // Fallback: full CSV export
        return parseSheet(getSheetExportUrl(sheetId));
      })
      .then((currentYearAll) => {
        if (abortRef.current) return;

        // Show last 30 days immediately
        const last30 = filterLastNDays(currentYearAll, 30);
        const initial = dedupeAndSort(last30.length > 0 ? last30 : currentYearAll.slice(0, 100));
        setFilings(initial);
        setLastFetched(new Date());
        setLoading(false);
        saveCache(initial);
        setProgress(p => ({ ...p, loadedSheets: 1, labels: [...p.labels, `${currentYear} (recent)`] }));

        // Step 2: Show full current year
        const fullCurrent = dedupeAndSort(currentYearAll);
        setFilings(fullCurrent);
        saveCache(fullCurrent);
        setProgress(p => ({ ...p, loadedSheets: 2, labels: [...p.labels, `${currentYear} (full)`] }));

        // Step 3: Load historical sheets sequentially: 2025, 2024, 2023
        const historicalYears = [2025, 2024, 2023].filter(y => y !== currentYear);
        let accumulated = fullCurrent;

        const loadNext = (index: number) => {
          if (index >= historicalYears.length || abortRef.current) return;
          const year = historicalYears[index];
          const id = SHEET_IDS[year];
          if (!id) { loadNext(index + 1); return; }

          parseSheet(getSheetExportUrl(id))
            .catch(() => [] as ParsedFiling[])
            .then(data => {
              if (abortRef.current) return;
              accumulated = dedupeAndSort([...accumulated, ...data]);
              setFilings(accumulated);
              setProgress(p => ({
                ...p,
                loadedSheets: p.loadedSheets + 1,
                labels: [...p.labels, `${year}`],
              }));
              loadNext(index + 1);
            });
        };
        loadNext(0);
      })
      .catch((err) => {
        if (abortRef.current) return;
        setError(err.message || 'Failed to fetch filings data');
        setLoading(false);
      });
  }, []);

  return { filings, loading, error, lastFetched, fetchFilings, progress };
}
