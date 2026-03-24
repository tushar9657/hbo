import { useState, useCallback, useEffect } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { NewsSection } from '@/components/news/NewsSection';
import { FilingsSection } from '@/components/filings/FilingsSection';
import { DeepDiveSection } from '@/components/deepdive/DeepDiveSection';
import { GlobalSearchOverlay } from '@/components/GlobalSearchOverlay';
import { useNewsData } from '@/hooks/useNewsData';
import { useDailySummary } from '@/hooks/useDailySummary';
import { useReadingHistory } from '@/hooks/useReadingHistory';
import { Loader2 } from 'lucide-react';
import type { NewsArticle } from '@/types/news';
import type { ParsedFiling } from '@/types/filing';

type Section = 'news' | 'filings' | 'deepdive';

const Index = () => {
  const [activeSection, setActiveSection] = useState<Section>('news');
  const { articles, loading: newsLoading, error: newsError, refetch: refetchNews } = useNewsData();
  const { summaries: dailySummaries } = useDailySummary();
  const [filingsRefresh, setFilingsRefresh] = useState<(() => void) | null>(null);
  const [filingsLoading, setFilingsLoading] = useState(false);
  const [filingsData, setFilingsData] = useState<ParsedFiling[]>([]);
  const [deepdiveRefresh, setDeepdiveRefresh] = useState<(() => void) | null>(null);
  const [deepdiveLoading, setDeepdiveLoading] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const { markRead } = useReadingHistory();

  const [readIdsVersion, setReadIdsVersion] = useState(0);
  const readIdsSet = useState(() => {
    try {
      const raw = localStorage.getItem('hubble-reading-history');
      return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
    } catch { return new Set<string>(); }
  })[0];

  const handleMarkRead = useCallback((id: string) => {
    markRead(id);
    readIdsSet.add(id);
    setReadIdsVersion(v => v + 1);
  }, [markRead, readIdsSet]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(o => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleRefresh = useCallback(() => {
    if (activeSection === 'news') refetchNews();
    else if (activeSection === 'filings') filingsRefresh?.();
    else deepdiveRefresh?.();
  }, [activeSection, refetchNews, filingsRefresh, deepdiveRefresh]);

  const isRefreshing = activeSection === 'news' ? newsLoading : activeSection === 'filings' ? filingsLoading : deepdiveLoading;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onSearchOpen={() => setGlobalSearchOpen(true)}
      />

      {activeSection === 'news' ? (
        newsLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-3" />
            <p className="text-[13px] text-muted-foreground">Loading today's news...</p>
          </div>
        ) : newsError ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="rounded-lg border border-border bg-card p-8 text-center max-w-md">
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <span className="text-destructive text-lg">✕</span>
              </div>
              <h2 className="text-[13px] font-medium text-foreground mb-2">Failed to load news data</h2>
              <p className="text-[12px] text-muted-foreground mb-1">{newsError}</p>
              <p className="text-[12px] text-muted-foreground mb-4">Ensure the Google Sheet is set to "Anyone with link can view"</p>
              <button onClick={refetchNews} className="text-[12px] text-primary hover:underline">↺ Try again</button>
            </div>
          </div>
        ) : (
          <NewsSection articles={articles} readIds={readIdsSet} onMarkRead={handleMarkRead} dailySummaries={dailySummaries} />
        )
      ) : activeSection === 'filings' ? (
        <FilingsSection
          onLoadingChange={setFilingsLoading}
          onRefreshRef={(fn) => setFilingsRefresh(() => fn)}
          onFilingsData={setFilingsData}
          readIds={readIdsSet}
          onMarkRead={handleMarkRead}
        />
      ) : (
        <DeepDiveSection
          onLoadingChange={setDeepdiveLoading}
          onRefreshRef={(fn) => setDeepdiveRefresh(() => fn)}
        />
      )}

      <GlobalSearchOverlay
        open={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        articles={articles}
        filings={filingsData}
        onSelectArticle={(a) => { setActiveSection('news'); handleMarkRead(a._id); }}
        onSelectFiling={() => { setActiveSection('filings'); }}
      />
    </div>
  );
};

export default Index;
