export interface Filing {
  Title: string;
  Ticker: string;
  Link: string;
  PubDate: string;
  Description: string;
  Subject: string;
  Status: string;
  Content: string;
  AI_Topic: string;
  AI_Subtopic: string;
  AI_Confidence: string;
  AI_Topic_2: string;
  AI_Subtopic_2: string;
  AI_Confidence_2: string;
  AI_Summary: string;
  AI_Sentiment: string;
}

export interface ParsedFiling extends Omit<Filing, 'PubDate'> {
  PubDate: Date | null;
  PubDateRaw: string;
  id: string;
}

export type Sentiment = 'Positive' | 'Negative' | 'Neutral';
export type TimeFrame = 'daily' | 'weekly';
export type TabType = 'feed' | 'charts';

export interface FilterState {
  sentiments: Sentiment[];
  topics: string[];
  subtopics: string[];
  search: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  timeframe: TimeFrame;
  selectedDate: Date | null;
}
