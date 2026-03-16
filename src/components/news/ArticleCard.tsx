import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NewsArticle } from '@/types/news';
import { parseImpact } from '@/utils/impactUtils';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: NewsArticle;
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

const cardTransition = { type: "tween" as const, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number], duration: 0.2 };

export function ArticleCard({ article }: ArticleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const impact = parseImpact(article.Impact_to_india);
  const bgClass = impact.hasImpact ? getImpactBgClass(impact.type) : getImpactBgClass(null);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={cardTransition}
      className={cn(
        'rounded-lg border cursor-pointer card-hover-border transition-all',
        bgClass
      )}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="p-4">
        {/* Top row: sector + category chips + impact type */}
        <div className="flex items-start justify-between gap-2 mb-2">
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

        {/* Headline */}
        <h3 className="text-[14px] font-semibold leading-snug text-foreground mb-1.5">
          {article.Headline}
        </h3>

        {/* Summary - always visible */}
        {article.Summary && (
          <p className="text-[13px] leading-relaxed text-foreground/80">
            {capitalize(article.Summary)}
          </p>
        )}
      </div>

      {/* Expanded: Detailed Summary overlay */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={cardTransition}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3">
              {article.Detailed_Summary && (
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Detailed Summary</div>
                  <p className="text-[13px] leading-[1.75] text-foreground/75">
                    {capitalize(article.Detailed_Summary)}
                  </p>
                </div>
              )}

              {impact.hasImpact && (
                <div>
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">India Impact</div>
                  <p className="text-[13px] text-foreground/75 leading-relaxed">{article.Impact_to_india}</p>
                  {impact.sectors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {impact.sectors.map(s => (
                        <span key={s} className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="font-mono text-[11px] text-muted-foreground pt-1">
                {article.Event_Category} · {article.Industry_Sector} · {article.Extraction_Date}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}