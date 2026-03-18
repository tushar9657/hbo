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
      return 'border-sentiment-pos/30 text-sentiment-pos bg-sentiment-pos/10';
    case 'Negative':
      return 'border-sentiment-neg/30 text-sentiment-neg bg-sentiment-neg/10';
    default:
      return 'border-sentiment-neu/30 text-sentiment-neu bg-sentiment-neu/10';
  }
}

export function getSentimentLabel(sentiment: Sentiment): string {
  switch (sentiment) {
    case 'Positive': return 'Positive';
    case 'Negative': return 'Negative';
    default: return 'Neutral';
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
  positive: '#16a34a',
  negative: '#dc2626',
  neutral: '#d97706',
};

export const TOPIC_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6',
  '#eab308', '#6366f1', '#22d3ee', '#f43f5e', '#84cc16',
];
