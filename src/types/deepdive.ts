export interface DeepDiveCompany {
  NSE_Symbol: string;
  Company_Name: string;
  Company_Added: string;
  Ticker_TJ: string;
  URL_TJ: string;
  Marketcap_Cr: string;
  Size: string;
  Sector: string;
  Supplier: string;
  Customer: string;
  Discussions: string;
  Revenue_Mix: string;
  About: string;
}

export interface ParsedRevenueMix {
  title: string;
  data: { name: string; value: number }[];
}

export interface ParsedDiscussion {
  title: string;
  url: string;
}
