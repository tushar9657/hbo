import { useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type Section = 'news' | 'filings' | 'deepdive';

interface TopNavProps {
  activeSection: Section;
  onSectionChange: (s: Section) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onSearchOpen?: () => void;
}

export function TopNav({ activeSection, onSectionChange, onRefresh, isRefreshing, onSearchOpen }: TopNavProps) {
  const today = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateStr = `${String(today.getDate()).padStart(2, '0')} ${months[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <header className="sticky top-0 z-[200] flex h-12 items-center justify-between border-b border-border bg-card px-4">
      {/* Left: Logo */}
      <div className="flex items-center gap-2.5">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
          <circle cx="10" cy="10" r="8" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="none" />
          <circle cx="10" cy="10" r="4" stroke="hsl(var(--foreground))" strokeWidth="1" fill="none" />
          <circle cx="10" cy="10" r="1.5" fill="hsl(var(--foreground))" />
        </svg>
        <span className="text-base font-medium text-foreground">Hubble</span>
      </div>

      {/* Centre: Nav tabs */}
      <nav className="flex items-center gap-1">
        {(['news', 'filings', 'deepdive'] as Section[]).map(s => (
          <button
            key={s}
            onClick={() => onSectionChange(s)}
            className={cn(
              'relative px-4 py-3 text-[13px] font-medium transition-colors',
              activeSection === s
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {s === 'news' ? 'News' : s === 'filings' ? 'Filings' : 'DeepDive'}
            {activeSection === s && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-8 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </nav>

      {/* Right: Search + Refresh + date */}
      <div className="flex items-center gap-3">
        {onSearchOpen && (
          <button
            onClick={onSearchOpen}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Global Search"
            title="Search across news & filings (⌘K)"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          aria-label="Refresh"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
        </button>
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{dateStr}</span>
      </div>
    </header>
  );
}
