import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import type { NewsArticle } from '@/types/news';
import { parseExtractionDate } from '@/utils/dateUtils';

const _k = ['aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20v', 'c3ByZWFkc2hlZXRzL2QvMWI3U0k5', 'Szlad3Z2bU84NHE4NC16YlJkSXo0', 'c2FJQlczLXZKWGsyOE1Ma28vZXhw', 'b3J0P2Zvcm1hdD1jc3Y='];
const NEWS_CSV_URL = atob(_k.join(''));

export function useNewsData() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchNews = useCallback(() => {
    setLoading(true);
    setError(null);

    Papa.parse(NEWS_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: NewsArticle[] = (results.data as any[])
          .filter((row) => row.Headline && row.Headline.trim())
          .map((row, i) => ({
            Headline: row.Headline || '',
            Summary: row.Summary || '',
            Detailed_Summary: row.Detailed_Summary || '',
            Impact_to_india: row.Impact_to_india || '',
            Event_Category: row.Event_Category || 'Others',
            Industry_Sector: row.Industry_Sector || 'Others',
            Extraction_Date: row.Extraction_Date || '',
            _parsedDate: parseExtractionDate(row.Extraction_Date || ''),
            _id: `news-${i}-${row.Extraction_Date}`,
          }));
        setArticles(parsed);
        setLastFetched(new Date());
        setLoading(false);
      },
      error: (err) => {
        setError(err.message || 'Failed to fetch news data');
        setLoading(false);
      },
    });
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  return { articles, loading, error, lastFetched, refetch: fetchNews };
}
