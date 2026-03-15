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
  lastFetched,
  onRefresh,
  sentimentCounts,
  sidebarOpen,
  onToggleSidebar,
  activeFilterCount,
  isRefreshing,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-[200] flex items-center justify-between border-b border-border bg-surface-1 px-4 py-2.5 terminal-shadow">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-sentiment-pos opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sentiment-pos" />
          </span>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
            NSE FILINGS MONITOR
          </span>
        </div>
        <span className="text-muted-foreground">│</span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {lastFetched ? `Updated ${timeAgo(lastFetched)}` : 'Loading...'}
        </span>
      </div>

      <div className="hidden items-center gap-3 font-mono text-xs tabular-nums md:flex">
        <span className="text-sentiment-pos">▲ {sentimentCounts.pos} pos</span>
        <span className="text-sentiment-neg">▼ {sentimentCounts.neg} neg</span>
        <span className="text-sentiment-neu">● {sentimentCounts.neu} neu</span>
        <span className="text-muted-foreground">│</span>
        <span className="text-muted-foreground">{sentimentCounts.total} shown</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
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
