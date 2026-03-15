import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import type { ParsedFiling, TimeFrame } from '@/types/filing';
import { getDayKey, getWeekKey } from '@/utils/dateUtils';
import { CHART_COLORS, TOPIC_COLORS } from '@/utils/sentimentUtils';

interface ChartsTabProps {
  filings: ParsedFiling[];
  timeframe: TimeFrame;
  onTopicFilter: (topic: string) => void;
}

export function ChartsTab({ filings, timeframe, onTopicFilter }: ChartsTabProps) {
  // 2A - Sentiment Timeline
  const timelineData = useMemo(() => {
    const map = new Map<string, { name: string; Positive: number; Negative: number; Neutral: number; sortKey: number }>();
    filings.forEach(f => {
      if (!f.PubDate) return;
      const key = timeframe === 'daily' ? getDayKey(f.PubDate) : getWeekKey(f.PubDate);
      if (!map.has(key)) map.set(key, { name: key, Positive: 0, Negative: 0, Neutral: 0, sortKey: f.PubDate.getTime() });
      const entry = map.get(key)!;
      const s = f.AI_Sentiment as string;
      if (s === 'Positive') entry.Positive++;
      else if (s === 'Negative') entry.Negative++;
      else entry.Neutral++;
      if (f.PubDate.getTime() < entry.sortKey) entry.sortKey = f.PubDate.getTime();
    });
    return Array.from(map.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [filings, timeframe]);

  // 2B - Topic Distribution
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

  // 2C - Sentiment Donut
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

  // 2D - Hourly Volume
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: String(i).padStart(2, '0'), count: 0 }));
    filings.forEach(f => {
      if (f.PubDate) hours[f.PubDate.getHours()].count++;
    });
    return hours;
  }, [filings]);

  const tooltipStyle = {
    contentStyle: { background: 'hsl(222 47% 9%)', border: '1px solid hsl(217 33% 17%)', borderRadius: '4px', fontSize: '12px', fontFamily: 'IBM Plex Mono' },
    labelStyle: { color: 'hsl(214 32% 91%)' },
  };

  return (
    <div className="mx-auto max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 2A - Sentiment Timeline */}
      <div className="col-span-1 lg:col-span-2 rounded-md border border-border bg-surface-1 p-4 terminal-shadow">
        <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Sentiment Timeline ({timeframe})
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={timelineData}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#475569' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#475569' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'IBM Plex Mono' }} />
            <Bar dataKey="Positive" fill={CHART_COLORS.positive} stackId="a" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Neutral" fill={CHART_COLORS.neutral} stackId="a" />
            <Bar dataKey="Negative" fill={CHART_COLORS.negative} stackId="a" radius={[0, 0, 2, 2]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 2B - Topic Distribution */}
      <div className="rounded-md border border-border bg-surface-1 p-4 terminal-shadow">
        <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Topic Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topicData} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#475569' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono', fill: '#475569' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" radius={[0, 2, 2, 0]} cursor="pointer" onClick={(d) => onTopicFilter(d.fullName)}>
              {topicData.map((_, i) => (
                <Cell key={i} fill={TOPIC_COLORS[i % TOPIC_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 2C - Sentiment Donut */}
      <div className="rounded-md border border-border bg-surface-1 p-4 terminal-shadow">
        <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Sentiment Distribution
        </h3>
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
            <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'IBM Plex Mono' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 2D - Hourly Volume */}
      <div className="col-span-1 lg:col-span-2 rounded-md border border-border bg-surface-1 p-4 terminal-shadow">
        <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Filing Volume by Hour
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={hourlyData}>
            <defs>
              <linearGradient id="hourGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="hour" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#475569' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#475569' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#hourGradient)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
