import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, Cell,
} from 'recharts';
import { ArrowLeft } from 'lucide-react';
import type { ParsedFiling, TimeFrame } from '@/types/filing';
import { getDayKey, getDayName, getWeekKey } from '@/utils/dateUtils';
import { CHART_COLORS, TOPIC_COLORS } from '@/utils/sentimentUtils';
import { cn } from '@/lib/utils';

interface ChartsTabProps {
  filings: ParsedFiling[];
  timeframe: TimeFrame;
  onTopicFilter: (topic: string) => void;
  onDateFilter: (dateLabel: string) => void;
}

type ChartMode = 'bar' | 'line';

function DailyTick({ x, y, payload, timeframe }: any) {
  if (timeframe !== 'daily') {
    return (
      <text x={x} y={y + 12} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11 }}>
        {payload.value}
      </text>
    );
  }
  const parts = (payload.value as string).split('|');
  const date = parts[0];
  const day = parts[1] || '';
  return (
    <g>
      <text x={x} y={y + 12} textAnchor="middle" className="fill-foreground" style={{ fontSize: 11 }}>
        {date}
      </text>
      <text x={x} y={y + 24} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9 }}>
        {day}
      </text>
    </g>
  );
}

export function ChartsTab({ filings, timeframe, onTopicFilter, onDateFilter }: ChartsTabProps) {
  const [chartMode, setChartMode] = useState<ChartMode>('bar');
  const [drilldownTopic, setDrilldownTopic] = useState<string | null>(null);

  const timelineData = useMemo(() => {
    const map = new Map<string, { name: string; displayName: string; Positive: number; Negative: number; Neutral: number; sortKey: number }>();
    filings.forEach(f => {
      if (!f.PubDate) return;
      const dateKey = timeframe === 'daily' ? getDayKey(f.PubDate) : getWeekKey(f.PubDate);
      const displayName = timeframe === 'daily'
        ? `${getDayKey(f.PubDate)}|${getDayName(f.PubDate)}`
        : dateKey;
      if (!map.has(dateKey)) map.set(dateKey, { name: displayName, displayName: dateKey, Positive: 0, Negative: 0, Neutral: 0, sortKey: f.PubDate.getTime() });
      const entry = map.get(dateKey)!;
      const s = f.AI_Sentiment as string;
      if (s === 'Positive') entry.Positive++;
      else if (s === 'Negative') entry.Negative++;
      else entry.Neutral++;
      if (f.PubDate.getTime() < entry.sortKey) entry.sortKey = f.PubDate.getTime();
    });
    return Array.from(map.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [filings, timeframe]);

  const topicData = useMemo(() => {
    const map = new Map<string, number>();
    filings.forEach(f => {
      if (!f.AI_Topic) return;
      map.set(f.AI_Topic, (map.get(f.AI_Topic) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name: name.length > 30 ? name.slice(0, 30) + '…' : name, fullName: name, count }));
  }, [filings]);

  const subtopicData = useMemo(() => {
    if (!drilldownTopic) return [];
    const map = new Map<string, number>();
    filings.forEach(f => {
      if (f.AI_Topic !== drilldownTopic || !f.AI_Subtopic) return;
      map.set(f.AI_Subtopic, (map.get(f.AI_Subtopic) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name: name.length > 30 ? name.slice(0, 30) + '…' : name, fullName: name, count }));
  }, [filings, drilldownTopic]);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: String(i).padStart(2, '0'), count: 0 }));
    filings.forEach(f => {
      if (f.PubDate) hours[f.PubDate.getHours()].count++;
    });
    return hours;
  }, [filings]);

  const tooltipStyle = {
    contentStyle: {
      background: '#111',
      border: '1px solid #222',
      borderRadius: '8px',
      fontSize: '12px',
      color: '#f5f5f5',
    },
    labelStyle: { color: '#888' },
  };

  const timelineTooltipFormatter = (value: number, name: string) => [value, name];
  const timelineLabelFormatter = (label: string) => {
    if (typeof label === 'string' && label.includes('|')) return label.split('|')[0];
    return label;
  };

  const handleTimelineBarClick = (data: any) => {
    if (data?.name) {
      onDateFilter(data.name);
    }
  };

  const handleTopicClick = (d: any) => {
    setDrilldownTopic(d.fullName);
  };

  const isShowingSubtopics = drilldownTopic !== null;
  const distributionData = isShowingSubtopics ? subtopicData : topicData;
  const distributionTitle = isShowingSubtopics
    ? `Subtopics: ${drilldownTopic!.length > 25 ? drilldownTopic!.slice(0, 25) + '…' : drilldownTopic}`
    : 'Topic Distribution';

  return (
    <div className="mx-auto max-w-[1200px] space-y-4">
      {/* Sentiment Timeline — full width */}
      <div className="rounded-lg border border-border bg-card p-4 card-shadow">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Sentiment Timeline
            <span className="ml-2 text-xs font-normal text-muted-foreground">({timeframe})</span>
          </h3>
          <div className="flex rounded-lg bg-muted p-0.5">
            {(['bar', 'line'] as ChartMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setChartMode(mode)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-all',
                  chartMode === mode
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-2 text-[10px] text-muted-foreground">Click a date bar to filter the feed</p>
        <ResponsiveContainer width="100%" height={280}>
          {chartMode === 'bar' ? (
            <BarChart data={timelineData} onClick={(e) => e?.activePayload?.[0] && handleTimelineBarClick(e.activePayload[0].payload)}>
              <XAxis dataKey="name" tick={(props) => <DailyTick {...props} timeframe={timeframe} />} axisLine={false} tickLine={false} height={timeframe === 'daily' ? 40 : 25} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(220 9% 46%)' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={timelineTooltipFormatter} labelFormatter={timelineLabelFormatter} cursor={{ fill: 'hsl(220 13% 95%)' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Positive" fill={CHART_COLORS.positive} stackId="a" radius={0} />
              <Bar dataKey="Neutral" fill={CHART_COLORS.neutral} stackId="a" radius={0} />
              <Bar dataKey="Negative" fill={CHART_COLORS.negative} stackId="a" radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={timelineData} onClick={(e) => e?.activePayload?.[0] && handleTimelineBarClick(e.activePayload[0].payload)}>
              <XAxis dataKey="name" tick={(props) => <DailyTick {...props} timeframe={timeframe} />} axisLine={false} tickLine={false} height={timeframe === 'daily' ? 40 : 25} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(220 9% 46%)' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={timelineTooltipFormatter} labelFormatter={timelineLabelFormatter} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="Positive" stroke={CHART_COLORS.positive} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Neutral" stroke={CHART_COLORS.neutral} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Negative" stroke={CHART_COLORS.negative} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Topic / Subtopic Distribution — full width */}
      <div className="rounded-lg border border-border bg-card p-4 card-shadow">
        <div className="mb-3 flex items-center gap-2">
          {isShowingSubtopics && (
            <button
              onClick={() => setDrilldownTopic(null)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              aria-label="Back to topics"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
          <h3 className="text-sm font-semibold text-foreground">{distributionTitle}</h3>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={distributionData} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(220 9% 46%)' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 10, fill: 'hsl(220 9% 46%)' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(d) => isShowingSubtopics ? onTopicFilter(drilldownTopic!) : handleTopicClick(d)}
            >
              {distributionData.map((_, i) => (
                <Cell key={i} fill={TOPIC_COLORS[i % TOPIC_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {!isShowingSubtopics && (
          <p className="mt-1 text-[10px] text-muted-foreground text-center">Click a topic to see subtopics</p>
        )}
      </div>

      {/* Hourly Volume — full width */}
      <div className="rounded-lg border border-border bg-card p-4 card-shadow">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Filing Volume by Hour</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={hourlyData}>
            <defs>
              <linearGradient id="hourGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217 91% 50%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(217 91% 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'hsl(220 9% 46%)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(220 9% 46%)' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="count" stroke="hsl(217 91% 50%)" strokeWidth={2} fill="url(#hourGradient)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
