import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { NewsArticle } from '@/types/news';
import { parseImpact, getImpactBadgeColor } from '@/utils/impactUtils';
import { formatDateShort } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: NewsArticle;
}

const cardTransition = { type: "tween" as const, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number], duration: 0.2 };

export function ArticleCard({ article }: ArticleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const impact = parseImpact(article.Impact_to_india);
  const dateLabel = article._parsedDate ? formatDateShort(article._parsedDate) : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={cardTransition}
      className="border border-border bg-card rounded-lg card-hover-border cursor-pointer"
      onClick={() => setExpanded(e => !e)}
    >
      <div className="p-5">
        {/* Top row: chips + date */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              {article.Industry_Sector}
            </span>
            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              {article.Event_Category}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{dateLabel}</span>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
          </div>
        </div>

        {/* Headline */}
        <h3 className="text-[15px] font-medium leading-snug text-foreground">
          {article.Headline}
        </h3>

        {/* Summary preview */}
        {!expanded && article.Summary && (
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
            {article.Summary.length > 120 ? article.Summary.slice(0, 120) + '…' : article.Summary}
          </p>
        )}

        {/* Impact row */}
        {impact.hasImpact && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px]">◆</span>
            {impact.type && (
              <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', getImpactBadgeColor(impact.type))}>
                {impact.type}
              </span>
            )}
            {impact.sectors.length > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {impact.sectors.join(' | ')}
              </span>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={cardTransition}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
              {/* Detailed Summary */}
              {article.Detailed_Summary && (
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Detailed Summary</div>
                  <div className="rounded-md bg-surface-0 p-4 text-[13px] leading-[1.75] text-muted-foreground">
                    {article.Detailed_Summary}
                  </div>
                </div>
              )}

              {/* India Impact */}
              {impact.hasImpact && (
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">India Impact</div>
                  <div className="space-y-2">
                    {impact.type && (
                      <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium', getImpactBadgeColor(impact.type))}>
                        {impact.type}
                      </span>
                    )}
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{article.Impact_to_india}</p>
                    {impact.sectors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {impact.sectors.map(s => (
                          <span key={s} className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata footer */}
              <div className="font-mono text-[11px] text-muted-foreground">
                {article.Event_Category} · {article.Industry_Sector} · {article.Extraction_Date}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
