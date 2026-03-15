import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import type { ParsedFiling, TimeFrame } from '@/types/filing';
import { getDayKey, getDayName, getWeekKey } from '@/utils/dateUtils';
import { CHART_COLORS, TOPIC_COLORS } from '@/utils/sentimentUtils';
import { cn } from '@/lib/utils';

interface ChartsTabProps {
  filings: ParsedFiling[];
  timeframe: TimeFrame;
  onTopicFilter: (topic: string) => void;
}

type ChartMode = 'bar' | 'line';

// Custom tick for daily mode showing day name below date
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

export function ChartsTab({ filings, timeframe, onTopicFilter }: ChartsTabProps) {
  const [chartMode, setChartMode] = useState<ChartMode>('bar');

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

  const donutData = useMemo(() => {
    let pos = 0, neg = 0, neu = 0;
    filings.forEach(f => {
      if (f.AI_Sentiment === 'Positive') pos++;
      else if (f.AI_Sentiment === 'Negative') neg++;
      else neu++;
    });
    return [
      { name: 'Positive', value: pos, color: CHART_COLORS.positive },
      { name: 'Neutral', value: neu, color: CHART_COLORS.neutral },
      { name: 'Negative', value: neg, color: CHART_COLORS.negative },
    ];
  }, [filings]);

  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: String(i).padStart(2, '0'), count: 0 }));
    filings.forEach(f => {
      if (f.PubDate) hours[f.PubDate.getHours()].count++;
    });
    return hours;
  }, [filings]);

  const tooltipStyle = {
    contentStyle: {
      background: 'hsl(0 0% 100%)',
      border: '1px solid hsl(220 13% 91%)',
      borderRadius: '8px',
      fontSize: '12px',
      boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.08)',
    },
    labelStyle: { color: 'hsl(220 13% 18%)' },
  };

  // Custom tooltip for sentiment timeline to show clean labels
  const timelineTooltipFormatter = (value: number, name: string) => [value, name];
  const timelineLabelFormatter = (label: string) => {
    if (typeof label === 'string' && label.includes('|')) return label.split('|')[0];
    return label;
  };

  return (
    <div className="mx-auto max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Sentiment Timeline */}
      <div className="col-span-1 lg:col-span-2 rounded-lg border border-border bg-card p-4 card-shadow">
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
        <ResponsiveContainer width="100%" height={280}>
          {chartMode === 'bar' ? (
            <BarChart data={timelineData}>
              <XAxis
                dataKey="name"
                tick={(props) => <DailyTick {...props} timeframe={timeframe} />}
                axisLine={false}
                tickLine={false}
                height={timeframe === 'daily' ? 40 : 25}
              />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(220 9% 46%)' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={timelineTooltipFormatter} labelFormatter={timelineLabelFormatter} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Positive" fill={CHART_COLORS.positive} stackId="a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Neutral" fill={CHART_COLORS.neutral} stackId="a" />
              <Bar dataKey="Negative" fill={CHART_COLORS.negative} stackId="a" radius={[0, 0, 3, 3]} />
            </BarChart>
          ) : (
            <LineChart data={timelineData}>
              <XAxis
                dataKey="name"
                tick={(props) => <DailyTick {...props} timeframe={timeframe} />}
                axisLine={false}
                tickLine={false}
                height={timeframe === 'daily' ? 40 : 25}
              />
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

      {/* Topic Distribution */}
      <div className="rounded-lg border border-border bg-card p-4 card-shadow">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Topic Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topicData} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(220 9% 46%)' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 10, fill: 'hsl(220 9% 46%)' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(d) => onTopicFilter(d.fullName)}>
              {topicData.map((_, i) => (
                <Cell key={i} fill={TOPIC_COLORS[i % TOPIC_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sentiment Donut */}
      <div className="rounded-lg border border-border bg-card p-4 card-shadow">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Sentiment Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" strokeWidth={0}>
              {donutData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(value: number, name: string) => {
              const total = donutData.reduce((s, d) => s + d.value, 0);
              return [`${value} (${total ? ((value / total) * 100).toFixed(1) : 0}%)`, name];
            }} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly Volume */}
      <div className="col-span-1 lg:col-span-2 rounded-lg border border-border bg-card p-4 card-shadow">
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
