import { useState, useMemo, useCallback } from 'react';
import type { ParsedFiling, FilterState, Sentiment } from '@/types/filing';
import { isSameDay } from '@/utils/dateUtils';

function getDefaultDateFrom(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DEFAULT_FILTERS: FilterState = {
  sentiment: 'All',
  topics: [],
  subtopics: [],
  search: '',
  dateFrom: getDefaultDateFrom(),
  dateTo: null,
  timeframe: 'daily',
  selectedDate: null,
};

export function useFilters(filings: ParsedFiling[]) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const setSentiment = useCallback((s: Sentiment | 'All') => setFilters(f => ({ ...f, sentiment: s })), []);
  const setTopics = useCallback((t: string[]) => setFilters(f => ({ ...f, topics: t })), []);
  const setSubtopics = useCallback((s: string[]) => setFilters(f => ({ ...f, subtopics: s })), []);
  const setSearch = useCallback((s: string) => setFilters(f => ({ ...f, search: s })), []);
  const setDateFrom = useCallback((d: Date | null) => setFilters(f => ({ ...f, dateFrom: d })), []);
  const setDateTo = useCallback((d: Date | null) => setFilters(f => ({ ...f, dateTo: d })), []);
  const setTimeframe = useCallback((t: 'daily' | 'weekly') => setFilters(f => ({ ...f, timeframe: t })), []);
  const setSelectedDate = useCallback((d: Date | null) => setFilters(f => ({ ...f, selectedDate: d })), []);
  const clearAll = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.sentiment !== 'All') count++;
    if (filters.topics.length > 0) count++;
    if (filters.subtopics.length > 0) count++;
    if (filters.search) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.selectedDate) count++;
    return count;
  }, [filters]);

  const filtered = useMemo(() => {
    return filings.filter(f => {
      if (filters.sentiment !== 'All' && f.AI_Sentiment !== filters.sentiment) return false;
      if (filters.topics.length > 0 && !filters.topics.includes(f.AI_Topic)) return false;
      if (filters.subtopics.length > 0 && !filters.subtopics.includes(f.AI_Subtopic)) return false;
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

  const subtopics = useMemo(() => {
    const set = new Set<string>();
    const relevantFilings = filters.topics.length > 0
      ? filings.filter(f => filters.topics.includes(f.AI_Topic))
      : filings;
    relevantFilings.forEach(f => { if (f.AI_Subtopic) set.add(f.AI_Subtopic); });
    return Array.from(set).sort();
  }, [filings, filters.topics]);

  const sentimentCounts = useMemo(() => {
    const pos = filtered.filter(f => f.AI_Sentiment === 'Positive').length;
    const neg = filtered.filter(f => f.AI_Sentiment === 'Negative').length;
    const neu = filtered.filter(f => f.AI_Sentiment === 'Neutral').length;
    return { pos, neg, neu, total: filtered.length };
  }, [filtered]);

  // Date range from data
  const dateRange = useMemo(() => {
    let min: Date | null = null;
    let max: Date | null = null;
    filings.forEach(f => {
      if (f.PubDate) {
        if (!min || f.PubDate < min) min = f.PubDate;
        if (!max || f.PubDate > max) max = f.PubDate;
      }
    });
    return { min, max };
  }, [filings]);

  return {
    filters,
    filtered,
    topics,
    subtopics,
    sentimentCounts,
    activeFilterCount,
    dateRange,
    setSentiment,
    setTopics,
    setSubtopics,
    setSearch,
    setDateFrom,
    setDateTo,
    setTimeframe,
    setSelectedDate,
    clearAll,
  };
}
