import { useState, useCallback } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { NewsSection } from '@/components/news/NewsSection';
import { FilingsSection } from '@/components/filings/FilingsSection';
import { useNewsData } from '@/hooks/useNewsData';
import { Loader2 } from 'lucide-react';

type Section = 'news' | 'filings';

const Index = () => {
  const [activeSection, setActiveSection] = useState<Section>('news');
  const { articles, loading: newsLoading, error: newsError, refetch: refetchNews } = useNewsData();
  const [filingsRefresh, setFilingsRefresh] = useState<(() => void) | null>(null);
  const [filingsLoading, setFilingsLoading] = useState(false);

  const handleRefresh = useCallback(() => {
    if (activeSection === 'news') {
      refetchNews();
    } else {
      filingsRefresh?.();
    }
  }, [activeSection, refetchNews, filingsRefresh]);

  const isRefreshing = activeSection === 'news' ? newsLoading : filingsLoading;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
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
          <NewsSection articles={articles} />
        )
      ) : (
        <FilingsSection
          onLoadingChange={setFilingsLoading}
          onRefreshRef={(fn) => setFilingsRefresh(() => fn)}
        />
      )}
    </div>
  );
};

export default Index;
