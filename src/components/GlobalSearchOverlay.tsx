import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, X, Newspaper, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { parseImpact } from '@/utils/impactUtils';
import { getSentimentBadgeClasses } from '@/utils/sentimentUtils';
import { format } from 'date-fns';
import type { NewsArticle } from '@/types/news';
import type { ParsedFiling } from '@/types/filing';

interface GlobalSearchOverlayProps {
  open: boolean;
  onClose: () => void;
  articles: NewsArticle[];
  filings: ParsedFiling[];
  onSelectArticle: (a: NewsArticle) => void;
  onSelectFiling: (f: ParsedFiling) => void;
}

export function GlobalSearchOverlay({
  open, onClose, articles, filings, onSelectArticle, onSelectFiling,
}: GlobalSearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const matchedArticles = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return articles
      .filter(a =>
        a.Headline.toLowerCase().includes(q) ||
        a.Summary.toLowerCase().includes(q) ||
        a.Industry_Sector.toLowerCase().includes(q) ||
        a.Event_Category.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [articles, query]);

  const matchedFilings = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return filings
      .filter(f =>
        f.Ticker.toLowerCase().includes(q) ||
        f.Title.toLowerCase().includes(q) ||
        f.AI_Summary.toLowerCase().includes(q) ||
        f.AI_Topic.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [filings, query]);

  const totalResults = matchedArticles.length + matchedFilings.length;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[600] bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-[601] inset-x-0 top-0 mx-auto mt-14 w-[90vw] max-w-[720px] rounded-xl border border-border bg-card shadow-2xl max-h-[75vh] flex flex-col overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search across news & filings… (ticker, keyword, sector)"
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {query.length < 2 ? (
            <div className="py-12 text-center text-[13px] text-muted-foreground">
              Type at least 2 characters to search across all news and filings
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-[13px] text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            <>
              {/* News results */}
              {matchedArticles.length > 0 && (
                <div>
                  <div className="sticky top-0 bg-card border-b border-border px-4 py-2 flex items-center gap-2">
                    <Newspaper className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[12px] font-medium text-foreground">News</span>
                    <span className="text-[11px] text-muted-foreground">({matchedArticles.length})</span>
                  </div>
                  {matchedArticles.map(a => (
                    <button
                      key={a._id}
                      onClick={() => { onSelectArticle(a); onClose(); }}
                      className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b border-border/50"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{a.Industry_Sector}</span>
                        <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{a.Event_Category}</span>
                        {a._parsedDate && (
                          <span className="text-[11px] font-mono text-muted-foreground ml-auto">{format(a._parsedDate, 'dd-MMM')}</span>
                        )}
                      </div>
                      <p className="text-[13px] font-medium text-foreground line-clamp-1">{a.Headline}</p>
                      <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{a.Summary}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Filings results */}
              {matchedFilings.length > 0 && (
                <div>
                  <div className="sticky top-0 bg-card border-b border-border px-4 py-2 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[12px] font-medium text-foreground">Filings</span>
                    <span className="text-[11px] text-muted-foreground">({matchedFilings.length})</span>
                  </div>
                  {matchedFilings.map(f => (
                    <button
                      key={f.id}
                      onClick={() => { onSelectFiling(f); onClose(); }}
                      className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b border-border/50"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono font-medium text-primary bg-primary/8 rounded px-1.5 py-0.5">{f.Ticker}</span>
                        <span className={cn('text-[11px] rounded px-1.5 py-0.5 border', getSentimentBadgeClasses(f.AI_Sentiment as any))}>
                          {f.AI_Sentiment}
                        </span>
                        {f.AI_Topic && (
                          <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{f.AI_Topic}</span>
                        )}
                        {f.PubDate && (
                          <span className="text-[11px] font-mono text-muted-foreground ml-auto">{format(f.PubDate, 'dd-MMM')}</span>
                        )}
                      </div>
                      <p className="text-[13px] font-medium text-foreground line-clamp-1">{f.Title}</p>
                      <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{f.AI_Summary}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
