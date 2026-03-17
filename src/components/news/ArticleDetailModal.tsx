import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { parseImpact } from '@/utils/impactUtils';
import { cn } from '@/lib/utils';
import type { NewsArticle } from '@/types/news';

interface ArticleDetailModalProps {
  article: NewsArticle | null;
  onClose: () => void;
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

export function ArticleDetailModal({ article, onClose }: ArticleDetailModalProps) {
  useEffect(() => {
    if (!article) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [article, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (article) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [article]);

  const impact = article ? parseImpact(article.Impact_to_india) : null;

  return (
    <AnimatePresence>
      {article && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[500] bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed z-[501] inset-0 m-auto',
              'w-[90vw] max-w-[680px] h-fit max-h-[80vh] overflow-y-auto',
              'rounded-xl border shadow-xl p-6',
              impact?.hasImpact ? getImpactBgClass(impact.type) : getImpactBgClass(null)
            )}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[12px] text-muted-foreground">
                {article.Industry_Sector}
              </span>
              <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[12px] text-muted-foreground">
                {article.Event_Category}
              </span>
              {impact?.hasImpact && impact.type && (
                <span className={cn('text-[12px] font-medium ml-auto', getImpactLabelClass(impact.type))}>
                  {impact.type}
                </span>
              )}
            </div>

            {/* Headline */}
            {article.Headline && (
              <h2 className="text-[17px] font-semibold leading-snug text-foreground mb-3">
                {article.Headline}
              </h2>
            )}

            {/* Summary */}
            {article.Summary && (
              <p className="text-[14px] leading-relaxed text-foreground/85 mb-4">
                {capitalize(article.Summary)}
              </p>
            )}

            {/* Detailed Summary */}
            {article.Detailed_Summary && (
              <div className="mb-4">
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Detailed Summary</div>
                <div className="rounded-lg bg-card border border-border p-4">
                  <p className="text-[14px] leading-[1.75] text-foreground/80">
                    {capitalize(article.Detailed_Summary)}
                  </p>
                </div>
              </div>
            )}

            {/* India Impact */}
            {impact?.hasImpact && (
              <div className="mb-4">
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">India Impact</div>
                <div className="rounded-lg bg-card border border-border p-4">
                  <p className="text-[14px] text-foreground/80 leading-relaxed">{article.Impact_to_india}</p>
                  {impact.sectors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {impact.sectors.map(s => (
                        <span key={s} className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata footer */}
            <div className="font-mono text-[12px] text-muted-foreground pt-2 border-t border-border">
              {article.Event_Category} · {article.Industry_Sector} · {article.Extraction_Date}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
