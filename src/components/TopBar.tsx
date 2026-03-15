import { RefreshCw, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/utils/dateUtils';

interface TopBarProps {
  lastFetched: Date | null;
  onRefresh: () => void;
  sentimentCounts: { pos: number; neg: number; neu: number; total: number };
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeFilterCount: number;
  isRefreshing: boolean;
}

export function TopBar({
  lastFetched, onRefresh, sentimentCounts,
  sidebarOpen, onToggleSidebar, activeFilterCount, isRefreshing,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-[200] flex items-center justify-between border-b border-border bg-card px-4 py-2.5 card-shadow">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-sentiment-pos opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sentiment-pos" />
          </span>
          <span className="font-sans text-sm font-semibold text-foreground">
            NSE Filings
          </span>
        </div>
        <span className="text-border">|</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {lastFetched ? `Updated ${timeAgo(lastFetched)}` : 'Loading...'}
        </span>
      </div>

      <div className="hidden items-center gap-3 text-xs tabular-nums md:flex">
        <span className="text-sentiment-pos font-medium">▲ {sentimentCounts.pos}</span>
        <span className="text-sentiment-neg font-medium">▼ {sentimentCounts.neg}</span>
        <span className="text-sentiment-neu font-medium">● {sentimentCounts.neu}</span>
        <span className="text-border">|</span>
        <span className="text-muted-foreground">{sentimentCounts.total} shown</span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {sidebarOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeft className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">
            {sidebarOpen ? 'Hide' : 'Filters'}
            {!sidebarOpen && activeFilterCount > 0 && ` (${activeFilterCount})`}
          </span>
        </Button>
      </div>
    </header>
  );
}
