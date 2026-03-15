import type { ParsedImpact } from '@/types/news';

export function parseImpact(raw: string): ParsedImpact {
  if (!raw || raw.trim() === "No direct India impact." || raw.trim() === "") {
    return { hasImpact: false, type: null, impact: null, sectors: [] };
  }
  const typeMatch = raw.match(/Type:\s*([^;]+)/);
  const impactMatch = raw.match(/Impact:\s*([^;]+)/);
  const sectorsMatch = raw.match(/Sectors:\s*(.+)$/);

  let type: ParsedImpact['type'] = null;
  if (typeMatch) {
    const t = typeMatch[1].trim().toLowerCase();
    if (t.includes('supply') || t.includes('demand')) type = 'Supply/Demand';
    else if (t.includes('regulat')) type = 'Regulatory';
    else if (t.includes('macro')) type = 'Macro';
  }

  return {
    hasImpact: true,
    type,
    impact: impactMatch?.[1]?.trim() || null,
    sectors: sectorsMatch?.[1]?.split('|').map(s => s.trim()).filter(Boolean) || [],
  };
}

export function getImpactBadgeColor(type: ParsedImpact['type']): string {
  switch (type) {
    case 'Supply/Demand': return 'text-primary border-primary/30 bg-primary/10';
    case 'Regulatory': return 'text-sentiment-neu border-sentiment-neu/30 bg-sentiment-neu/10';
    case 'Macro': return 'text-impact-macro border-impact-macro/30 bg-impact-macro/10';
    default: return 'text-muted-foreground border-border bg-muted';
  }
}
