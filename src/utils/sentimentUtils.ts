import type { Sentiment } from '@/types/filing';

export function normalizeSentiment(raw: string): Sentiment {
  const s = raw?.trim().toLowerCase();
  if (s === 'positive') return 'Positive';
  if (s === 'negative') return 'Negative';
  return 'Neutral';
}

export function getSentimentRailClass(sentiment: Sentiment): string {
  switch (sentiment) {
    case 'Positive': return 'sentiment-rail-pos';
    case 'Negative': return 'sentiment-rail-neg';
    default: return 'sentiment-rail-neu';
  }
}

export function getSentimentBadgeClasses(sentiment: Sentiment): string {
  switch (sentiment) {
    case 'Positive':
      return 'bg-sentiment-pos-bg border-sentiment-pos-border text-sentiment-pos';
    case 'Negative':
      return 'bg-sentiment-neg-bg border-sentiment-neg-border text-sentiment-neg';
    default:
      return 'bg-sentiment-neu-bg border-sentiment-neu-border text-sentiment-neu';
  }
}

export function getSentimentLabel(sentiment: Sentiment): string {
  switch (sentiment) {
    case 'Positive': return 'POS';
    case 'Negative': return 'NEG';
    default: return 'NEU';
  }
}

export function getSentimentIcon(sentiment: Sentiment): string {
  switch (sentiment) {
    case 'Positive': return '▲';
    case 'Negative': return '▼';
    default: return '●';
  }
}

export const CHART_COLORS = {
  positive: '#4ade80',
  negative: '#f87171',
  neutral: '#fbbf24',
};

export const TOPIC_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6',
  '#eab308', '#6366f1', '#22d3ee', '#f43f5e', '#84cc16',
];
