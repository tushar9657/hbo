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
  sentiments: ['Positive', 'Negative'],
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

  const toggleSentiment = useCallback((s: Sentiment) => {
    setFilters(f => {
      const current = f.sentiments;
      const next = current.includes(s)
        ? current.filter(x => x !== s)
        : [...current, s];
      return { ...f, sentiments: next };
    });
  }, []);

  const clearSentiments = useCallback(() => setFilters(f => ({ ...f, sentiments: [] })), []);
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
    if (filters.sentiments.length > 0) count++;
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
      if (filters.sentiments.length > 0 && !filters.sentiments.includes(f.AI_Sentiment as Sentiment)) return false;
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
    toggleSentiment,
    clearSentiments,
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
