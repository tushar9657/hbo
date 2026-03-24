import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';

export interface DailySummary {
  Date: string;
  Summary: string;
  _parsedDate: Date | null;
}

const SHEET_ID = '1b7SI9K9ZwvvmO84q84-zbRdIz4saIBW3-vJXk28MLk';
const DAILY_SUMMARY_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Daily_Summary`;

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d;
  // Try DD-Mon-YYYY
  const m = raw.match(/(\d{1,2})-(\w{3})-(\d{4})/);
  if (m) {
    const parsed = new Date(`${m[2]} ${m[1]}, ${m[3]}`);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

export function useDailySummary() {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    Papa.parse(DAILY_SUMMARY_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: DailySummary[] = (results.data as any[])
          .filter(row => row.Date && row.Summary)
          .map(row => ({
            Date: row.Date || '',
            Summary: row.Summary || '',
            _parsedDate: parseDate(row.Date || ''),
          }));
        setSummaries(parsed);
        setLoading(false);
      },
      error: (err) => {
        setError(err.message || 'Failed to fetch daily summaries');
        setLoading(false);
      },
    });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { summaries, loading, error, refetch: fetch };
}
