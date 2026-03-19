import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink } from 'lucide-react';
import type { ParsedFiling } from '@/types/filing';
import { formatDate } from '@/utils/dateUtils';
import { getSentimentBadgeClasses, getSentimentLabel, getSentimentRailClass } from '@/utils/sentimentUtils';
import { cn } from '@/lib/utils';

interface FilingCardProps {
  filing: ParsedFiling;
  isRead?: boolean;
  onOpen?: () => void;
}

const cardTransition = { type: "tween" as const, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number], duration: 0.2 };

export function FilingCard({ filing, isRead, onOpen }: FilingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sentiment = filing.AI_Sentiment as 'Positive' | 'Negative' | 'Neutral';

  const handleLinkClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleClick = useCallback(() => {
    onOpen?.();
    setExpanded(e => !e);
  }, [onOpen]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={cardTransition}
      className={cn(
        'border border-border bg-card card-hover-border cursor-pointer rounded-lg card-shadow',
        getSentimentRailClass(sentiment),
        isRead && 'opacity-55'
      )}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-primary/8 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
              {filing.Ticker}
            </span>
            <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium', getSentimentBadgeClasses(sentiment))}>
              {getSentimentLabel(sentiment)}
            </span>
            {filing.AI_Topic && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {filing.AI_Topic}
              </span>
            )}
            {filing.AI_Subtopic && (
              <span className="text-[11px] text-muted-foreground/60">
                / {filing.AI_Subtopic}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {filing.Link && (
              <a
                href={filing.Link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClick}
                className="p-1 text-muted-foreground hover:text-primary transition-colors"
                aria-label="Open original filing"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
          </div>
        </div>

        <h3 className="mt-2 font-sans text-sm font-semibold leading-snug text-foreground">
          {filing.Title}
        </h3>
        <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
          {formatDate(filing.PubDate)}
        </p>

        {!expanded && filing.AI_Summary && (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {filing.AI_Summary}
          </p>
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
            <div className="border-t border-border px-4 pb-4 pt-3">
              {filing.AI_Summary && (
                <div className="mb-3 rounded-lg border-l-2 border-primary/30 bg-muted/50 p-3">
                  <p className="text-sm leading-relaxed text-foreground">
                    {filing.AI_Summary}
                  </p>
                </div>
              )}

              {filing.AI_Topic_2 && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-muted-foreground/60">Secondary:</span>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {filing.AI_Topic_2}
                  </span>
                  {filing.AI_Subtopic_2 && (
                    <span className="text-[11px] text-muted-foreground/60">/ {filing.AI_Subtopic_2}</span>
                  )}
                </div>
              )}

              {filing.Link && (
                <a
                  href={filing.Link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  Open Original Filing <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
