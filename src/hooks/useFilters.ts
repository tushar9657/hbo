import { useState, useMemo, useCallback } from 'react';
import type { ParsedFiling, FilterState, Sentiment } from '@/types/filing';
import { isSameDay } from '@/utils/dateUtils';

const DEFAULT_FILTERS: FilterState = {
  sentiment: 'All',
  topic: '',
  search: '',
  dateFrom: null,
  dateTo: null,
  timeframe: 'daily',
  selectedDate: null,
};

export function useFilters(filings: ParsedFiling[]) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const setSentiment = useCallback((s: Sentiment | 'All') => setFilters(f => ({ ...f, sentiment: s })), []);
  const setTopic = useCallback((t: string) => setFilters(f => ({ ...f, topic: t })), []);
  const setSearch = useCallback((s: string) => setFilters(f => ({ ...f, search: s })), []);
  const setDateFrom = useCallback((d: Date | null) => setFilters(f => ({ ...f, dateFrom: d })), []);
  const setDateTo = useCallback((d: Date | null) => setFilters(f => ({ ...f, dateTo: d })), []);
  const setTimeframe = useCallback((t: 'daily' | 'weekly') => setFilters(f => ({ ...f, timeframe: t })), []);
  const setSelectedDate = useCallback((d: Date | null) => setFilters(f => ({ ...f, selectedDate: d })), []);
  const clearAll = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.sentiment !== 'All') count++;
    if (filters.topic) count++;
    if (filters.search) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.selectedDate) count++;
    return count;
  }, [filters]);

  const filtered = useMemo(() => {
    return filings.filter(f => {
      if (filters.sentiment !== 'All' && f.AI_Sentiment !== filters.sentiment) return false;
      if (filters.topic && f.AI_Topic !== filters.topic) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !f.Title.toLowerCase().includes(q) &&
          !f.Ticker.toLowerCase().includes(q) &&
          !f.AI_Summary.toLowerCase().includes(q)
        ) return false;
      }
      if (f.PubDate) {
        if (filters.dateFrom && f.PubDate < filters.dateFrom) return false;
        if (filters.dateTo) {
          const end = new Date(filters.dateTo);
          end.setHours(23, 59, 59, 999);
          if (f.PubDate > end) return false;
        }
        if (filters.selectedDate && !isSameDay(f.PubDate, filters.selectedDate)) return false;
      }
      return true;
    });
  }, [filings, filters]);

  const topics = useMemo(() => {
    const set = new Set<string>();
    filings.forEach(f => { if (f.AI_Topic) set.add(f.AI_Topic); });
    return Array.from(set).sort();
  }, [filings]);

  const sentimentCounts = useMemo(() => {
    const pos = filtered.filter(f => f.AI_Sentiment === 'Positive').length;
    const neg = filtered.filter(f => f.AI_Sentiment === 'Negative').length;
    const neu = filtered.filter(f => f.AI_Sentiment === 'Neutral').length;
    return { pos, neg, neu, total: filtered.length };
  }, [filtered]);

  return {
    filters,
    filtered,
    topics,
    sentimentCounts,
    activeFilterCount,
    setSentiment,
    setTopic,
    setSearch,
    setDateFrom,
    setDateTo,
    setTimeframe,
    setSelectedDate,
    clearAll,
  };
}
