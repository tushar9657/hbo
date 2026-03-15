import { useState, useMemo, useCallback, useEffect } from 'react';
import type { NewsArticle } from '@/types/news';
import { parseImpact } from '@/utils/impactUtils';
import { isSameDay } from '@/utils/dateUtils';

export function useNewsFilters(articles: NewsArticle[]) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [sectors, setSectors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [impactFilter, setImpactFilter] = useState('All');

  // All unique extraction dates sorted descending
  const allDates = useMemo(() => {
    const dateMap = new Map<string, Date>();
    articles.forEach(a => {
      if (a._parsedDate) {
        const key = a._parsedDate.toDateString();
        if (!dateMap.has(key)) dateMap.set(key, a._parsedDate);
      }
    });
    return Array.from(dateMap.values()).sort((a, b) => b.getTime() - a.getTime());
  }, [articles]);

  // Auto-select latest date on first load
  const latestDate = allDates[0] || null;
  useEffect(() => {
    if (latestDate && !selectedDate) setSelectedDate(latestDate);
  }, [latestDate]);

  // Navigate to prev/next date
  const goToPrevDate = useCallback(() => {
    if (!selectedDate) return;
    const idx = allDates.findIndex(d => isSameDay(d, selectedDate));
    if (idx < allDates.length - 1) setSelectedDate(allDates[idx + 1]);
  }, [selectedDate, allDates]);

  const goToNextDate = useCallback(() => {
    if (!selectedDate) return;
    const idx = allDates.findIndex(d => isSameDay(d, selectedDate));
    if (idx > 0) setSelectedDate(allDates[idx - 1]);
  }, [selectedDate, allDates]);

  const isLatestDate = selectedDate && latestDate ? isSameDay(selectedDate, latestDate) : true;
  const isEarliestDate = selectedDate && allDates.length > 0 ? isSameDay(selectedDate, allDates[allDates.length - 1]) : true;

  const filtered = useMemo(() => {
    return articles.filter(a => {
      // Date filter
      if (selectedDate && a._parsedDate && !isSameDay(a._parsedDate, selectedDate)) return false;
      if (selectedDate && !a._parsedDate) return false;

      // Search
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.Headline.toLowerCase().includes(q) &&
          !a.Summary.toLowerCase().includes(q) &&
          !a.Detailed_Summary.toLowerCase().includes(q)
        ) return false;
      }

      // Sector
      if (sectors.length > 0 && !sectors.includes(a.Industry_Sector)) return false;

      // Category
      if (categories.length > 0 && !categories.includes(a.Event_Category)) return false;

      // Impact
      if (impactFilter !== 'All') {
        const impact = parseImpact(a.Impact_to_india);
        if (impactFilter === 'Has India Impact' && !impact.hasImpact) return false;
        if (impactFilter === 'No India Impact' && impact.hasImpact) return false;
        if (impactFilter === 'Supply/Demand' && impact.type !== 'Supply/Demand') return false;
        if (impactFilter === 'Regulatory' && impact.type !== 'Regulatory') return false;
        if (impactFilter === 'Macro' && impact.type !== 'Macro') return false;
      }

      return true;
    });
  }, [articles, selectedDate, search, sectors, categories, impactFilter]);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (search) c++;
    if (sectors.length > 0) c++;
    if (categories.length > 0) c++;
    if (impactFilter !== 'All') c++;
    return c;
  }, [search, sectors, categories, impactFilter]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSectors([]);
    setCategories([]);
    setImpactFilter('All');
  }, []);

  // Available sectors & categories from current date's articles
  const availableSectors = useMemo(() => {
    const set = new Set<string>();
    articles.forEach(a => {
      if (selectedDate && a._parsedDate && !isSameDay(a._parsedDate, selectedDate)) return;
      if (a.Industry_Sector) set.add(a.Industry_Sector);
    });
    return Array.from(set).sort();
  }, [articles, selectedDate]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach(a => {
      if (selectedDate && a._parsedDate && !isSameDay(a._parsedDate, selectedDate)) return;
      if (a.Event_Category) set.add(a.Event_Category);
    });
    return Array.from(set).sort();
  }, [articles, selectedDate]);

  return {
    filtered,
    selectedDate,
    setSelectedDate,
    search,
    setSearch,
    sectors,
    setSectors,
    categories,
    setCategories,
    impactFilter,
    setImpactFilter,
    latestDate,
    allDates,
    goToPrevDate,
    goToNextDate,
    isLatestDate,
    isEarliestDate,
    activeFilterCount,
    clearFilters,
    availableSectors,
    availableCategories,
  };
}
