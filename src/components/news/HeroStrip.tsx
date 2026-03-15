import { useMemo } from 'react';
import type { NewsArticle } from '@/types/news';
import { parseImpact } from '@/utils/impactUtils';

interface HeroStripProps {
  articles: NewsArticle[];
}

export function HeroStrip({ articles }: HeroStripProps) {
  const stats = useMemo(() => {
    let pos = 0, neg = 0, neu = 0, withImpact = 0;
    articles.forEach(a => {
      // Simple sentiment detection from summary/headline keywords or default neutral
      // Since news doesn't have a sentiment column, we count impact instead
      const impact = parseImpact(a.Impact_to_india);
      if (impact.hasImpact) withImpact++;
    });
    return { total: articles.length, pos, neg, neu, withImpact };
  }, [articles]);

  return (
    <div className="flex items-stretch border border-border rounded-lg overflow-hidden mb-6">
      <StatBox value={stats.total} label="articles" />
      <StatBox value={stats.withImpact} label="India impact" colorClass="text-primary" />
    </div>
  );
}

function StatBox({ value, label, colorClass }: { value: number; label: string; colorClass?: string }) {
  return (
    <div className="flex-1 px-5 py-3 border-r border-border last:border-r-0">
      <div className={`text-[28px] font-medium tabular-nums ${colorClass || 'text-foreground'}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
