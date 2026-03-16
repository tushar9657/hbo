import { useMemo } from 'react';
import type { NewsArticle } from '@/types/news';
import { parseImpact } from '@/utils/impactUtils';

interface HeroStripProps {
  articles: NewsArticle[];
}

export function HeroStrip({ articles }: HeroStripProps) {
  const stats = useMemo(() => {
    let supplyDemand = 0, regulatory = 0, macro = 0;
    articles.forEach(a => {
      const impact = parseImpact(a.Impact_to_india);
      if (impact.hasImpact && impact.type === 'Supply/Demand') supplyDemand++;
      if (impact.hasImpact && impact.type === 'Regulatory') regulatory++;
      if (impact.hasImpact && impact.type === 'Macro') macro++;
    });
    return { total: articles.length, supplyDemand, regulatory, macro };
  }, [articles]);

  return (
    <div className="flex items-stretch border border-border rounded-lg overflow-hidden mb-5 bg-card">
      <StatBox value={stats.total} label="Total Articles" />
      <StatBox value={stats.supplyDemand} label="Supply / Demand" colorClass="text-impact-supply" />
      <StatBox value={stats.regulatory} label="Regulatory" colorClass="text-impact-regulatory" />
      <StatBox value={stats.macro} label="Macro" colorClass="text-impact-macro" />
    </div>
  );
}

function StatBox({ value, label, colorClass }: { value: number; label: string; colorClass?: string }) {
  return (
    <div className="flex-1 px-5 py-3 border-r border-border last:border-r-0">
      <div className={`text-[24px] font-semibold tabular-nums ${colorClass || 'text-foreground'}`}>{value}</div>
      <div className="text-[12px] text-muted-foreground">{label}</div>
    </div>
  );
}