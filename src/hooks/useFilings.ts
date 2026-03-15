import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import type { Filing, ParsedFiling } from '@/types/filing';
import { parseDate } from '@/utils/dateUtils';
import { normalizeSentiment } from '@/utils/sentimentUtils';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1BJKNujqR8uqCRdsvGNmBNIGKaRNMr4Qmn6hrkSuwhlY/export?format=csv';

export function useFilings() {
  const [filings, setFilings] = useState<ParsedFiling[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchFilings = useCallback(() => {
    setLoading(true);
    setError(null);

    Papa.parse<Filing>(SHEET_URL, {
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
        setFilings(parsed);
        setLastFetched(new Date());
        setLoading(false);
      },
      error: (err) => {
        setError(err.message || 'Failed to fetch filings data');
        setLoading(false);
      },
    });
  }, []);

  return { filings, loading, error, lastFetched, fetchFilings };
}
