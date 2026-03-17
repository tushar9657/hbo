import { parseImpact } from '@/utils/impactUtils';
import { cn } from '@/lib/utils';
import type { NewsArticle } from '@/types/news';

interface ArticleCardProps {
  article: NewsArticle;
  onClick: () => void;
}

function getImpactBgClass(type: string | null): string {
  switch (type) {
    case 'Supply/Demand': return 'bg-impact-supply-bg border-impact-supply/20';
    case 'Regulatory': return 'bg-impact-regulatory-bg border-impact-regulatory/20';
    case 'Macro': return 'bg-impact-macro-bg border-impact-macro/20';
    default: return 'bg-impact-neutral-bg border-border';
  }
}

function getImpactLabelClass(type: string | null): string {
  switch (type) {
    case 'Supply/Demand': return 'text-impact-supply';
    case 'Regulatory': return 'text-impact-regulatory';
    case 'Macro': return 'text-impact-macro';
    default: return 'text-muted-foreground';
  }
}

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function ArticleCard({ article, onClick }: ArticleCardProps) {
  const impact = parseImpact(article.Impact_to_india);
  const bgClass = impact.hasImpact ? getImpactBgClass(impact.type) : getImpactBgClass(null);

  return (
    <div
      className={cn(
        'rounded-lg border cursor-pointer card-hover-border transition-all p-5 flex flex-col h-full',
        bgClass
      )}
      onClick={onClick}
    >
      {/* Top row: sector + category chips + impact type */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
            {article.Industry_Sector}
          </span>
          <span className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
            {article.Event_Category}
          </span>
        </div>
        {impact.hasImpact && impact.type && (
          <span className={cn('text-[11px] font-medium shrink-0', getImpactLabelClass(impact.type))}>
            {impact.type}
          </span>
        )}
      </div>

      {/* Summary - full text */}
      {article.Summary && (
        <p className="text-[14px] leading-relaxed text-foreground/85 flex-1">
          {capitalize(article.Summary)}
        </p>
      )}
    </div>
  );
}
