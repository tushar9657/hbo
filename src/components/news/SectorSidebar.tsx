import { useMemo } from 'react';
import type { NewsArticle } from '@/types/news';
import { cn } from '@/lib/utils';

interface SectorSidebarProps {
  articles: NewsArticle[];
  activeSector: string | null;
  onSectorClick: (sector: string) => void;
}

export function SectorSidebar({ articles, activeSector, onSectorClick }: SectorSidebarProps) {
  const sectorCounts = useMemo(() => {
    const map = new Map<string, number>();
    articles.forEach(a => {
      if (a.Industry_Sector) {
        map.set(a.Industry_Sector, (map.get(a.Industry_Sector) || 0) + 1);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [articles]);

  if (sectorCounts.length === 0) return null;

  return (
    <div className="w-[180px] shrink-0">
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
        Sectors Today
      </div>
      <div className="space-y-0.5">
        {sectorCounts.map(([sector, count]) => (
          <button
            key={sector}
            onClick={() => onSectorClick(sector)}
            className={cn(
              'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] transition-colors text-left',
              activeSector === sector
                ? 'text-primary bg-primary/5 border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-2 border border-transparent'
            )}
          >
            <span className="truncate pr-2">{sector}</span>
            <span className="font-mono tabular-nums shrink-0">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
