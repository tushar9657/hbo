export type EventCategory =
  | "Corporate Actions & Shareholder Returns"
  | "Capital Raising & Securities Issuance"
  | "Ownership, Promoter & Control"
  | "Financial Results & Reporting"
  | "Operating Metrics & Business Updates"
  | "Business Growth, Orders & Operations"
  | "M&A, Investments & Restructuring"
  | "Credit, Debt & Liquidity"
  | "Governance & Leadership"
  | "Legal, Regulatory & Fraud"
  | "Market Surveillance & Trading Signals"
  | "Shareholder Meetings & Investor Communication"
  | "Compliance & Securities Administration"
  | "Macro & Economy"
  | "Others";

export type IndustrySector =
  | "Agriculture & Agri Inputs" | "Chemicals" | "Consumer Discretionary"
  | "Consumer Staples" | "Energy & Utilities" | "Financial Services"
  | "Healthcare & Pharmaceuticals" | "Industrials & Business Services"
  | "Materials" | "Real Estate" | "Technology" | "Telecom & Media"
  | "Textiles & Apparel" | "Transportation & Logistics" | "Others";

export interface NewsArticle {
  Headline: string;
  Summary: string;
  Detailed_Summary: string;
  Impact_to_india: string;
  Event_Category: string;
  Industry_Sector: string;
  Extraction_Date: string;
  _parsedDate: Date | null;
  _id: string;
}

export interface ParsedImpact {
  hasImpact: boolean;
  type: "Supply/Demand" | "Regulatory" | "Macro" | null;
  impact: string | null;
  sectors: string[];
}

export type NewsTab = 'feed' | 'analytics';
