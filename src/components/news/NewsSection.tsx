import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarIcon, X, ArrowUpDown, Download } from 'lucide-react';
import { useNewsFilters } from '@/hooks/useNewsFilters';
import { HeroStrip } from '@/components/news/HeroStrip';
import { FilterBar } from '@/components/news/FilterBar';
import { parseImpact } from '@/utils/impactUtils';
import { ArticleCard } from '@/components/news/ArticleCard';
import { ArticleDetailModal } from '@/components/news/ArticleDetailModal';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { formatDateShort } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { NewsArticle } from '@/types/news';

interface NewsSectionProps {
  articles: NewsArticle[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function exportNewsToCSV(articles: NewsArticle[]) {
  const headers = ['Headline', 'Summary', 'Detailed Summary', 'India Impact', 'Event Category', 'Industry Sector', 'Extraction Date'];
  const rows = articles.map(a => [
    `"${(a.Headline || '').replace(/"/g, '""')}"`,
    `"${(a.Summary || '').replace(/"/g, '""')}"`,
    `"${(a.Detailed_Summary || '').replace(/"/g, '""')}"`,
    `"${(a.Impact_to_india || '').replace(/"/g, '""')}"`,
    `"${(a.Event_Category || '').replace(/"/g, '""')}"`,
    `"${(a.Industry_Sector || '').replace(/"/g, '""')}"`,
    `"${(a.Extraction_Date || '').replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hubble-news-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function NewsSection({ articles }: NewsSectionProps) {
  const {
    filtered, selectedDate, setSelectedDate, goToPrevDate, goToNextDate,
    isLatestDate, isEarliestDate, allDates,
    search, setSearch, sectors, setSectors, availableSectors,
    categories, setCategories, availableCategories,
    impactFilter, setImpactFilter, activeFilterCount, clearFilters,
  } = useNewsFilters(articles);

  const [dateRangeMode, setDateRangeMode] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [sortAsc, setSortAsc] = useState(false);

  const minDate = allDates.length > 0 ? allDates[allDates.length - 1] : null;
  const maxDate = allDates.length > 0 ? allDates[0] : null;
  const minTime = minDate?.getTime() ?? 0;
  const maxTime = maxDate?.getTime() ?? 0;
  const fromTime = dateFrom?.getTime() ?? minTime;
  const toTime = dateTo?.getTime() ?? maxTime;

  const dateRangeArticles = dateRangeMode
    ? articles.filter(a => {
        if (!a._parsedDate) return false;
        const t = a._parsedDate.getTime();
        const from = dateFrom ? dateFrom.getTime() : minTime;
        const to = dateTo ? dateTo.getTime() : maxTime;
        if (t < from || t > to) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!a.Headline.toLowerCase().includes(q) && !a.Summary.toLowerCase().includes(q) && !a.Detailed_Summary.toLowerCase().includes(q)) return false;
        }
        if (sectors.length > 0 && !sectors.includes(a.Industry_Sector)) return false;
        if (categories.length > 0 && !categories.includes(a.Event_Category)) return false;
        if (impactFilter !== 'All') {
          const impact = parseImpact(a.Impact_to_india);
          if (impactFilter === 'Supply/Demand' && impact.type !== 'Supply/Demand') return false;
          if (impactFilter === 'Regulatory' && impact.type !== 'Regulatory') return false;
          if (impactFilter === 'Macro' && impact.type !== 'Macro') return false;
        }
        return true;
      })
    : [];

  const preSort = dateRangeMode ? dateRangeArticles : filtered;

  const finalArticles = useMemo(() => {
    if (!dateRangeMode) return preSort;
    return [...preSort].sort((a, b) => {
      const da = a._parsedDate?.getTime() ?? 0;
      const db = b._parsedDate?.getTime() ?? 0;
      return sortAsc ? da - db : db - da;
    });
  }, [preSort, dateRangeMode, sortAsc]);

  const handleDateRangeToggle = (on: boolean) => {
    setDateRangeMode(on);
    if (!on) {
      setDateFrom(null);
      setDateTo(null);
    }
  };

  const handleSliderChange = (values: number[]) => {
    const newFrom = new Date(values[0]);
    const newTo = new Date(values[1]);
    newFrom.setHours(0, 0, 0, 0);
    newTo.setHours(23, 59, 59, 999);
    setDateFrom(values[0] <= minTime ? null : newFrom);
    setDateTo(values[1] >= maxTime ? null : newTo);
  };

  const dayName = selectedDate ? DAYS[selectedDate.getDay()] : '';

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-5">
      {/* Date navigation + sort + date range toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {!dateRangeMode && selectedDate && (
            <>
              <span className="text-[14px] text-muted-foreground">Showing news for</span>
              <span className="font-mono text-[14px] font-medium text-foreground">
                {formatDateShort(selectedDate)} • {dayName}
              </span>
              <div className="flex items-center gap-1 ml-1">
                <button onClick={goToPrevDate} disabled={isEarliestDate} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={goToNextDate} disabled={isLatestDate} className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
          {dateRangeMode && (
            <>
              <span className="text-[14px] text-muted-foreground">Showing news for</span>
              <span className="font-mono text-[14px] font-medium text-foreground">
                {dateFrom ? formatDateShort(dateFrom) : (minDate ? formatDateShort(minDate) : '—')}
                {' → '}
                {dateTo ? formatDateShort(dateTo) : (maxDate ? formatDateShort(maxDate) : '—')}
              </span>
              <span className="text-[13px] text-muted-foreground">· {finalArticles.length} article{finalArticles.length !== 1 ? 's' : ''}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* CSV export */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportNewsToCSV(finalArticles)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Export to CSV"
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Sort (only in date range mode) */}
          {dateRangeMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortAsc(s => !s)}
              className="gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortAsc ? 'Oldest first' : 'Newest first'}
            </Button>
          )}

          <span className="text-[13px] text-muted-foreground">Date Range</span>
          <Switch checked={dateRangeMode} onCheckedChange={handleDateRangeToggle} />
        </div>
      </div>

      {/* Date range controls */}
      {dateRangeMode && minTime > 0 && maxTime > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-border bg-card">
          <Slider
            min={minTime}
            max={maxTime}
            step={86400000}
            value={[fromTime, toTime]}
            onValueChange={handleSliderChange}
            className="flex-1"
          />
          <DatePickerField label="From" value={dateFrom} onChange={setDateFrom} />
          <DatePickerField label="To" value={dateTo} onChange={setDateTo} />
        </div>
      )}

      <HeroStrip articles={finalArticles} />

      <FilterBar
        search={search}
        onSearch={setSearch}
        sectors={sectors}
        onSectors={setSectors}
        availableSectors={availableSectors}
        categories={categories}
        onCategories={setCategories}
        availableCategories={availableCategories}
        impactFilter={impactFilter}
        onImpactFilter={setImpactFilter}
        activeFilterCount={activeFilterCount}
        onClear={clearFilters}
      />

      <div className="w-full">
        {finalArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[14px] text-muted-foreground">No articles found for the selected filters.</p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="mt-2 text-[13px] text-primary hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {finalArticles.map(a => (
              <ArticleCard key={a._id} article={a} onClick={() => setSelectedArticle(a)} />
            ))}
          </div>
        )}
      </div>

      <ArticleDetailModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  );
}

function DatePickerField({ label, value, onChange }: { label: string; value: Date | null; onChange: (d: Date | null) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-8 w-[120px] justify-start text-[12px] border-border bg-card',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-1.5 h-3 w-3" />
          {value ? format(value, 'dd MMM') : label}
          {value && (
            <X
              className="ml-auto h-3 w-3 text-muted-foreground hover:text-foreground"
              onClick={e => { e.stopPropagation(); onChange(null); }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[300]" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(d) => onChange(d ?? null)}
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
