import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import { parseExtractionDate } from '@/utils/dateUtils';

export interface DailySummary {
  Date: string;
  Summary: string;
  _parsedDate: Date | null;
}

const SHEET_ID = '1b7SI9K9ZwvvmO84q84-zbRdIz4saIBW3-vJXk28MLko';
const DAILY_SUMMARY_GID = '129417283';
const DAILY_SUMMARY_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${DAILY_SUMMARY_GID}`;

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
            _parsedDate: parseExtractionDate(row.Date || ''),
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
