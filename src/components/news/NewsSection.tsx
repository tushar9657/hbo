import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNewsFilters } from '@/hooks/useNewsFilters';
import { HeroStrip } from '@/components/news/HeroStrip';
import { FilterBar } from '@/components/news/FilterBar';
import { ArticleCard } from '@/components/news/ArticleCard';
import { SectorSidebar } from '@/components/news/SectorSidebar';
import { NewsAnalytics } from '@/components/news/NewsAnalytics';
import { formatDateShort } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import type { NewsArticle, NewsTab } from '@/types/news';

interface NewsSectionProps {
  articles: NewsArticle[];
}

export function NewsSection({ articles }: NewsSectionProps) {
  const {
    filtered, selectedDate, goToPrevDate, goToNextDate,
    isLatestDate, isEarliestDate,
    search, setSearch, sectors, setSectors, availableSectors,
    categories, setCategories, availableCategories,
    impactFilter, setImpactFilter, activeFilterCount, clearFilters,
  } = useNewsFilters(articles);

  const [activeTab, setActiveTab] = useState<NewsTab>('feed');

  const handleSectorClick = useCallback((sector: string) => {
    if (sectors.includes(sector)) {
      setSectors(sectors.filter(s => s !== sector));
    } else {
      setSectors([sector]);
    }
  }, [sectors, setSectors]);

  const activeSector = sectors.length === 1 ? sectors[0] : null;

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-6">
      {/* Date navigation */}
      {selectedDate && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[13px] text-muted-foreground">Showing news for</span>
          <span className="font-mono text-[13px] font-medium text-foreground">{formatDateShort(selectedDate)}</span>
          <span className="text-[11px] text-muted-foreground">· {filtered.length} article{filtered.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={goToPrevDate}
              disabled={isEarliestDate}
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToNextDate}
              disabled={isLatestDate}
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero strip */}
      <HeroStrip articles={filtered} />

      {/* Inner tabs: Feed | Analytics */}
      <div className="flex gap-1 border-b border-border mb-4">
        {([
          { key: 'feed' as NewsTab, label: "Today's Feed" },
          { key: 'analytics' as NewsTab, label: 'Analytics' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            <span className={cn(
              'ml-1.5 text-[11px] rounded-full px-1.5 py-0.5 tabular-nums',
              activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}>{filtered.length}</span>
          </button>
        ))}
      </div>

      {activeTab === 'feed' ? (
        <>
          {/* Filter bar */}
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

          {/* Feed + Sector sidebar */}
          <div className="flex gap-6">
            <div className="flex-1 min-w-0 space-y-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-[13px] text-muted-foreground">No articles found for the selected filters.</p>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="mt-2 text-[12px] text-primary hover:underline">Clear filters</button>
                  )}
                </div>
              ) : (
                filtered.map(a => <ArticleCard key={a._id} article={a} />)
              )}
            </div>

            {/* Sector sidebar — desktop only */}
            <div className="hidden xl:block">
              <SectorSidebar
                articles={filtered}
                activeSector={activeSector}
                onSectorClick={handleSectorClick}
              />
            </div>
          </div>
        </>
      ) : (
        <NewsAnalytics articles={filtered} allArticles={articles} />
      )}
    </div>
  );
}
