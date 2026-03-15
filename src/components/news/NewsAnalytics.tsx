import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie,
} from 'recharts';
import type { NewsArticle } from '@/types/news';
import { parseImpact } from '@/utils/impactUtils';
import { isSameDay, formatDateShort } from '@/utils/dateUtils';

interface NewsAnalyticsProps {
  articles: NewsArticle[];
  allArticles: NewsArticle[];
}

const SECTOR_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6',
  '#eab308', '#6366f1', '#22d3ee', '#f43f5e', '#84cc16',
  '#06b6d4', '#a855f7', '#f59e0b', '#10b981', '#ef4444',
];

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

export function NewsAnalytics({ articles, allArticles }: NewsAnalyticsProps) {
  // Chart 5A — Category Breakdown (Horizontal)
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    articles.forEach(a => {
      if (a.Event_Category) map.set(a.Event_Category, (map.get(a.Event_Category) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name: name.length > 35 ? name.slice(0, 35) + '…' : name,
        count,
      }));
  }, [articles]);

  // Chart 5B — Sector Distribution (Donut)
  const sectorData = useMemo(() => {
    const map = new Map<string, number>();
    articles.forEach(a => {
      if (a.Industry_Sector) map.set(a.Industry_Sector, (map.get(a.Industry_Sector) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [articles]);

  // Chart 5C — India Impact Breakdown (last 7 dates)
  const impactData = useMemo(() => {
    const dateMap = new Map<string, { date: string; hasImpact: number; noImpact: number; sortKey: number }>();
    allArticles.forEach(a => {
      if (!a._parsedDate) return;
      const key = formatDateShort(a._parsedDate);
      if (!dateMap.has(key)) {
        dateMap.set(key, { date: key, hasImpact: 0, noImpact: 0, sortKey: a._parsedDate.getTime() });
      }
      const entry = dateMap.get(key)!;
      const impact = parseImpact(a.Impact_to_india);
      if (impact.hasImpact) entry.hasImpact++;
      else entry.noImpact++;
    });
    return Array.from(dateMap.values()).sort((a, b) => a.sortKey - b.sortKey).slice(-7);
  }, [allArticles]);

  // Chart 5D — Sector × Impact Heatmap
  const heatmapData = useMemo(() => {
    const sectorImpact = new Map<string, { hasImpact: number; noImpact: number }>();
    articles.forEach(a => {
      const sector = a.Industry_Sector || 'Others';
      if (!sectorImpact.has(sector)) sectorImpact.set(sector, { hasImpact: 0, noImpact: 0 });
      const entry = sectorImpact.get(sector)!;
      const impact = parseImpact(a.Impact_to_india);
      if (impact.hasImpact) entry.hasImpact++;
      else entry.noImpact++;
    });
    return Array.from(sectorImpact.entries())
      .sort((a, b) => (b[1].hasImpact + b[1].noImpact) - (a[1].hasImpact + a[1].noImpact))
      .slice(0, 8);
  }, [articles]);

  // Chart 5E — Volume by extraction date (last 14)
  const volumeData = useMemo(() => {
    const dateMap = new Map<string, { date: string; count: number; sortKey: number }>();
    allArticles.forEach(a => {
      if (!a._parsedDate) return;
      const key = formatDateShort(a._parsedDate);
      if (!dateMap.has(key)) dateMap.set(key, { date: key, count: 0, sortKey: a._parsedDate.getTime() });
      dateMap.get(key)!.count++;
    });
    return Array.from(dateMap.values()).sort((a, b) => a.sortKey - b.sortKey).slice(-14);
  }, [allArticles]);

  const maxHeatVal = Math.max(...heatmapData.flatMap(([, v]) => [v.hasImpact, v.noImpact]), 1);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Category Breakdown */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-[13px] font-medium text-foreground mb-4">Category Breakdown</h3>
        <ResponsiveContainer width="100%" height={Math.max(categoryData.length * 32, 200)}>
          <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" width={220} tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {categoryData.map((_, i) => (
                <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sector Distribution Donut */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-[13px] font-medium text-foreground mb-4">Sector Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sectorData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={{ stroke: '#444', strokeWidth: 1 }}
            >
              {sectorData.map((_, i) => (
                <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* India Impact Stacked Bar */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-[13px] font-medium text-foreground mb-4">India Impact by Date</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={impactData}>
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="hasImpact" name="Has Impact" fill="#2563eb" stackId="a" radius={0} />
            <Bar dataKey="noImpact" name="No Impact" fill="#444" stackId="a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sector × Impact Heatmap */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-[13px] font-medium text-foreground mb-4">Sector × Impact</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-muted-foreground font-normal py-2 pr-4">Sector</th>
                <th className="text-center text-muted-foreground font-normal py-2 px-4 w-28">Has Impact</th>
                <th className="text-center text-muted-foreground font-normal py-2 px-4 w-28">No Impact</th>
              </tr>
            </thead>
            <tbody>
              {heatmapData.map(([sector, vals]) => (
                <tr key={sector} className="border-b border-border/50">
                  <td className="py-2 pr-4 text-muted-foreground">{sector}</td>
                  <td className="py-2 px-4 text-center">
                    <span
                      className="inline-flex items-center justify-center w-12 h-7 rounded text-[11px] tabular-nums"
                      style={{
                        backgroundColor: `rgba(37, 99, 235, ${vals.hasImpact / maxHeatVal * 0.6})`,
                        color: vals.hasImpact > 0 ? '#f5f5f5' : '#888',
                      }}
                    >
                      {vals.hasImpact}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-center">
                    <span
                      className="inline-flex items-center justify-center w-12 h-7 rounded text-[11px] tabular-nums"
                      style={{
                        backgroundColor: `rgba(68, 68, 68, ${vals.noImpact / maxHeatVal * 0.8})`,
                        color: vals.noImpact > 0 ? '#f5f5f5' : '#888',
                      }}
                    >
                      {vals.noImpact}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* News Volume Area Chart */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-[13px] font-medium text-foreground mb-4">News Volume by Date</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={volumeData}>
            <defs>
              <linearGradient id="newsVolGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} fill="url(#newsVolGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
