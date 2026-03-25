import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyBriefModalProps {
  summary: string | null;
  dateLabel: string;
  onClose: () => void;
}

function parseBriefBullets(raw: string): { tag: string; body: string }[] {
  // Split by bullet markers: *, •, or numbered
  // Remove "Here is your..." intro line
  const cleaned = raw.replace(/^.*?here is your[^\n]*\.?\n*/i, '');
  const lines = cleaned.split(/(?:^|\n)\s*[\*•\-]\s+/).filter(Boolean);
  return lines.map(line => {
    // Extract bold tag like **[Macro & Geopolitics]** or [Tag]
    const tagMatch = line.match(/^\*{0,2}\[([^\]]+)\]\*{0,2}\s*/);
    if (tagMatch) {
      return { tag: tagMatch[1], body: line.slice(tagMatch[0].length).trim() };
    }
    // Try bold prefix like **Something:**
    const boldMatch = line.match(/^\*{0,2}([^:*]+?)\*{0,2}:\s*/);
    if (boldMatch && boldMatch[1].length < 50) {
      return { tag: boldMatch[1], body: line.slice(boldMatch[0].length).trim() };
    }
    return { tag: '', body: line.trim() };
  }).filter(b => b.body.length > 0);
}

function getTagColor(tag: string): string {
  const t = tag.toLowerCase();
  if (t.includes('macro') || t.includes('economy') || t.includes('geopolit')) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (t.includes('energy') || t.includes('supply')) return 'bg-orange-100 text-orange-800 border-orange-200';
  if (t.includes('financial') || t.includes('banking') || t.includes('credit')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (t.includes('tech') || t.includes('digital')) return 'bg-violet-100 text-violet-800 border-violet-200';
  if (t.includes('health') || t.includes('pharma')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (t.includes('regulat') || t.includes('legal') || t.includes('governance')) return 'bg-red-100 text-red-800 border-red-200';
  if (t.includes('corporate') || t.includes('m&a') || t.includes('business')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  return 'bg-muted text-muted-foreground border-border';
}

export function DailyBriefModal({ summary, dateLabel, onClose }: DailyBriefModalProps) {
  useEffect(() => {
    if (!summary) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [summary, onClose]);

  useEffect(() => {
    if (summary) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [summary]);

  const bullets = summary ? parseBriefBullets(summary) : [];

  return (
    <AnimatePresence>
      {summary && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[500] bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[501] inset-0 m-auto w-[92vw] max-w-[760px] h-fit max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl p-6"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-lg bg-primary/10">
                <Newspaper className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-foreground">Daily Brief</h2>
                <p className="text-[12px] text-muted-foreground">{dateLabel}</p>
              </div>
            </div>

            <div className="space-y-4">
              {bullets.map((b, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <div className="flex-1">
                    {b.tag && (
                      <span className={cn(
                        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium mb-1.5',
                        getTagColor(b.tag)
                      )}>
                        {b.tag}
                      </span>
                    )}
                    <p className="text-[13px] leading-relaxed text-foreground/85">{b.body}</p>
                  </div>
                </div>
              ))}
              {bullets.length === 0 && (
                <p className="text-[13px] leading-relaxed text-foreground/85 whitespace-pre-wrap">{summary}</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
