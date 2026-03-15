import { useMemo } from 'react';
import type { ParsedFiling } from '@/types/filing';
import { isSameDay } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HeatmapTabProps {
  filings: ParsedFiling[];
  onSelectDate: (d: Date) => void;
}

interface DayData {
  date: Date;
  total: number;
  pos: number;
  neg: number;
  neu: number;
}

export function HeatmapTab({ filings, onSelectDate }: HeatmapTabProps) {
  const { weeks, maxCount } = useMemo(() => {
    // Build day map
    const dayMap = new Map<string, DayData>();
    filings.forEach(f => {
      if (!f.PubDate) return;
      const key = `${f.PubDate.getFullYear()}-${f.PubDate.getMonth()}-${f.PubDate.getDate()}`;
      if (!dayMap.has(key)) {
        const d = new Date(f.PubDate.getFullYear(), f.PubDate.getMonth(), f.PubDate.getDate());
        dayMap.set(key, { date: d, total: 0, pos: 0, neg: 0, neu: 0 });
      }
      const entry = dayMap.get(key)!;
      entry.total++;
      if (f.AI_Sentiment === 'Positive') entry.pos++;
      else if (f.AI_Sentiment === 'Negative') entry.neg++;
      else entry.neu++;
    });

    if (dayMap.size === 0) return { weeks: [] as DayData[][], maxCount: 0 };

    const days = Array.from(dayMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    const maxCount = Math.max(...days.map(d => d.total));

    // Fill gaps and organize into weeks
    const start = new Date(days[0].date);
    const end = new Date(days[days.length - 1].date);
    
    // Adjust start to Monday
    const startDay = start.getDay();
    start.setDate(start.getDate() - (startDay === 0 ? 6 : startDay - 1));

    const allDays: (DayData | null)[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const found = days.find(d => isSameDay(d.date, cursor));
      allDays.push(found || { date: new Date(cursor), total: 0, pos: 0, neg: 0, neu: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Group into weeks
    const weeks: (DayData | null)[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }

    return { weeks, maxCount };
  }, [filings]);

  const getCellColor = (day: DayData) => {
    if (day.total === 0) return 'bg-surface-2';
    const intensity = Math.min(day.total / Math.max(maxCount, 1), 1);
    const opacity = 0.2 + intensity * 0.8;
    
    if (day.neg > day.pos) return `bg-sentiment-neg`;
    if (day.pos > day.neg) return `bg-sentiment-pos`;
    return `bg-sentiment-neu`;
  };

  const getCellOpacity = (day: DayData) => {
    if (day.total === 0) return 0.15;
    return 0.2 + (Math.min(day.total / Math.max(maxCount, 1), 1)) * 0.8;
  };

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="rounded-md border border-border bg-surface-1 p-4 terminal-shadow">
        <h3 className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Filing Activity Heatmap
        </h3>

        <div className="overflow-x-auto">
          <div className="inline-flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pr-2">
              {dayLabels.map(d => (
                <div key={d} className="flex h-5 items-center font-mono text-[10px] text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="h-5 w-5" />;
                  return (
                    <Tooltip key={di} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => day.total > 0 && onSelectDate(day.date)}
                          className={cn(
                            'h-5 w-5 rounded-sm border border-border/50 transition-colors',
                            day.total > 0 ? 'cursor-pointer hover:border-primary/50' : 'cursor-default',
                            getCellColor(day)
                          )}
                          style={{ opacity: getCellOpacity(day) }}
                          aria-label={`${day.date.getDate()} ${months[day.date.getMonth()]}: ${day.total} filings`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-surface-2 border-border font-mono text-xs">
                        <p className="font-semibold">{day.date.getDate()} {months[day.date.getMonth()]} {day.date.getFullYear()}</p>
                        <p className="text-muted-foreground">{day.total} filings</p>
                        {day.total > 0 && (
                          <p>
                            <span className="text-sentiment-pos">{day.pos} pos</span>
                            {' · '}
                            <span className="text-sentiment-neg">{day.neg} neg</span>
                            {' · '}
                            <span className="text-sentiment-neu">{day.neu} neu</span>
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 font-mono text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            {[0.15, 0.35, 0.55, 0.75, 1].map((op, i) => (
              <div key={i} className="h-3 w-3 rounded-sm bg-primary" style={{ opacity: op }} />
            ))}
          </div>
          <span>More</span>
          <span className="ml-4">
            <span className="inline-block h-2 w-2 rounded-full bg-sentiment-pos mr-1" /> Pos dominant
          </span>
          <span>
            <span className="inline-block h-2 w-2 rounded-full bg-sentiment-neg mr-1" /> Neg dominant
          </span>
          <span>
            <span className="inline-block h-2 w-2 rounded-full bg-sentiment-neu mr-1" /> Neutral/Mixed
          </span>
        </div>
      </div>
    </div>
  );
}
