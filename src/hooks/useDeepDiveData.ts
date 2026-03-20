import { useState, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import type { DeepDiveCompany } from '@/types/deepdive';

const _k = ['aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20v', 'c3ByZWFkc2hlZXRzL2QvMUZKWWRvMXEx', 'X0NpV0RQZ241MEx4TkVVZmlkMlpw', 'ZGpRal9GcGU3TzZjSTAvZXhwb3J0', 'P2Zvcm1hdD1jc3Y='];
const CSV_URL = atob(_k.join(''));

export function useDeepDiveData() {
  const [companies, setCompanies] = useState<DeepDiveCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: DeepDiveCompany[] = (results.data as any[])
          .filter(row => row.Company_Name && row.NSE_Symbol)
          .map(row => ({
            NSE_Symbol: row.NSE_Symbol || '',
            Company_Name: row.Company_Name || '',
            Company_Added: row['Company Added'] || '',
            Ticker_TJ: row.Ticker_TJ || '',
            URL_TJ: row.URL_TJ || '',
            Marketcap_Cr: row['Marketcap(Cr)'] || '',
            Size: row.Size || '',
            Sector: row.Sector || '',
            Supplier: row.Supplier || '',
            Customer: row.Customer || '',
            Discussions: row.Discussions || '',
            Revenue_Mix: row.Revenue_Mix || '',
            About: row.About || '',
          }));
        setCompanies(parsed);
        setLoading(false);
      },
      error: (err) => {
        setError(err.message || 'Failed to fetch DeepDive data');
        setLoading(false);
      },
    });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { companies, loading, error, refetch: fetch };
}
