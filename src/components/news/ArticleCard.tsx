import { parseImpact } from '@/utils/impactUtils';
import { cn } from '@/lib/utils';
import { CATEGORY_SHORT_NAMES } from '@/constants/categories';
import { format } from 'date-fns';
import { Bookmark } from 'lucide-react';
import type { NewsArticle } from '@/types/news';

interface ArticleCardProps {
  article: NewsArticle;
  onClick: () => void;
  isRead?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

function getImpactBgClass(type: string | null): string {
  switch (type) {
    case 'Supply/Demand': return 'bg-impact-supply-bg border-impact-supply/20';
    case 'Regulatory': return 'bg-impact-regulatory-bg border-impact-regulatory/20';
    case 'Macro': return 'bg-impact-macro-bg border-impact-macro/20';
    default: return 'bg-impact-neutral-bg border-border';
  }
}

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function ArticleCard({ article, onClick, isRead }: ArticleCardProps) {
  const impact = parseImpact(article.Impact_to_india);
  const bgClass = impact.hasImpact ? getImpactBgClass(impact.type) : getImpactBgClass(null);
  const shortCategory = CATEGORY_SHORT_NAMES[article.Event_Category] || article.Event_Category;
  const dateLabel = article._parsedDate ? format(article._parsedDate, 'dd-MMM') : '';

  return (
    <div
      className={cn(
        'rounded-lg border cursor-pointer card-hover-border transition-all p-5 flex flex-col h-full',
        bgClass,
        isRead && 'opacity-55'
      )}
      onClick={onClick}
    >
      {/* Top row: pills + date */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
            {article.Industry_Sector}
          </span>
          <span className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground whitespace-nowrap truncate">
            {shortCategory}
          </span>
        </div>
        {dateLabel && (
          <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap shrink-0">
            {dateLabel}
          </span>
        )}
      </div>

      {/* Headline title */}
      {article.Headline && (
        <h3 className="text-[14px] font-bold leading-snug text-foreground mb-2 line-clamp-2">
          {article.Headline}
        </h3>
      )}

      {/* Summary */}
      {article.Summary && (
        <p className="text-[14px] leading-relaxed text-foreground/85 flex-1">
          {capitalize(article.Summary)}
        </p>
      )}
    </div>
  );
}
