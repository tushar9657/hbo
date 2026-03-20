import type { ParsedRevenueMix, ParsedDiscussion } from '@/types/deepdive';

export function parseRevenueMix(raw: string): ParsedRevenueMix[] {
  if (!raw || !raw.trim()) return [];
  const categories = raw.split(' | ').filter(Boolean);
  return categories.map(cat => {
    const titleMatch = cat.match(/\[(.+?)\s*->\s*/);
    const title = titleMatch?.[1]?.trim() || 'Unknown';
    const dataStr = cat.replace(/\[.*?->\s*/, '').replace(/\]$/, '');
    const items = dataStr.split(',').map(item => {
      const match = item.trim().match(/(.+?):\s*([\d.]+)%/);
      if (!match) return null;
      return { name: match[1].trim(), value: parseFloat(match[2]) };
    }).filter(Boolean) as { name: string; value: number }[];
    return { title, data: items };
  }).filter(m => m.data.length > 0);
}

export function parseDiscussions(raw: string): ParsedDiscussion[] {
  if (!raw || !raw.trim()) return [];
  const entries = raw.split('<||>').map(e => e.trim()).filter(Boolean);
  return entries.map(entry => {
    const match = entry.match(/(.+?)\s*\((https?:\/\/[^\)]+)\)/);
    if (!match) return null;
    return { title: match[1].trim(), url: match[2].trim() };
  }).filter(Boolean) as ParsedDiscussion[];
}

export function parseSupplierCustomer(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  return raw.split('|').map(s => s.trim()).filter(Boolean);
}
