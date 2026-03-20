import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, ArrowRight, ExternalLink, Loader2, X, Building2, Users, Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDeepDiveData } from '@/hooks/useDeepDiveData';
import { parseRevenueMix, parseDiscussions, parseSupplierCustomer } from '@/utils/deepdiveUtils';
import type { DeepDiveCompany } from '@/types/deepdive';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const DONUT_COLORS = [
  'hsl(217, 91%, 53%)', 'hsl(142, 72%, 42%)', 'hsl(32, 95%, 50%)',
  'hsl(271, 81%, 56%)', 'hsl(0, 72%, 55%)', 'hsl(190, 80%, 45%)',
  'hsl(340, 75%, 55%)', 'hsl(160, 60%, 45%)', 'hsl(45, 90%, 50%)',
  'hsl(210, 50%, 60%)', 'hsl(100, 60%, 45%)', 'hsl(280, 60%, 50%)',
];

interface DeepDiveSectionProps {
  onLoadingChange?: (loading: boolean) => void;
  onRefreshRef?: (fn: () => void) => void;
}

export function DeepDiveSection({ onLoadingChange, onRefreshRef }: DeepDiveSectionProps) {
  const { companies, loading, error, refetch } = useDeepDiveData();
  const [companySearch, setCompanySearch] = useState('');
  const [thematicSearch, setThematicSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<DeepDiveCompany | null>(null);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const companyRef = useRef<HTMLDivElement>(null);

  useEffect(() => { onLoadingChange?.(loading); }, [loading, onLoadingChange]);
  useEffect(() => { onRefreshRef?.(refetch); }, [refetch, onRefreshRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) setShowCompanySuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const companySuggestions = useMemo(() => {
    if (!companySearch || companySearch.length < 1) return [];
    const q = companySearch.toLowerCase();
    return companies.filter(c =>
      c.Company_Name.toLowerCase().includes(q) || c.NSE_Symbol.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [companySearch, companies]);

  const thematicResults = useMemo(() => {
    if (!thematicSearch || thematicSearch.length < 2) return [];
    const q = thematicSearch.toLowerCase();
    return companies.filter(c =>
      c.Sector.toLowerCase().includes(q) ||
      c.Supplier.toLowerCase().includes(q) ||
      c.Customer.toLowerCase().includes(q) ||
      c.Revenue_Mix.toLowerCase().includes(q) ||
      c.About.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [thematicSearch, companies]);

  const handleSelectCompany = useCallback((c: DeepDiveCompany) => {
    setSelectedCompany(c);
    setCompanySearch('');
    setThematicSearch('');
    setShowCompanySuggestions(false);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-3" />
        <p className="text-[13px] text-muted-foreground">Loading DeepDive data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="rounded-lg border border-border bg-card p-8 text-center max-w-md">
          <p className="text-[13px] font-medium text-foreground mb-2">Failed to load DeepDive data</p>
          <p className="text-[12px] text-muted-foreground mb-4">{error}</p>
          <Button onClick={refetch} size="sm" className="gap-2 text-[12px]">↺ Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-5">
      {/* Search bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {/* Company search */}
        <div className="relative" ref={companyRef}>
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search company or ticker..."
            value={companySearch}
            onChange={e => { setCompanySearch(e.target.value); setShowCompanySuggestions(true); }}
            onFocus={() => companySearch && setShowCompanySuggestions(true)}
            className="h-10 pl-9 text-[13px] bg-card border-border"
          />
          {showCompanySuggestions && companySuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-[300px] overflow-y-auto">
              {companySuggestions.map(c => (
                <button
                  key={c.NSE_Symbol}
                  onClick={() => handleSelectCompany(c)}
                  className="flex w-full items-center justify-between px-3 py-2 text-[13px] hover:bg-accent transition-colors text-left"
                >
                  <span className="text-foreground">{c.Company_Name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{c.NSE_Symbol}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Thematic search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Thematic search (e.g. Copper, EV, Ethanol)..."
            value={thematicSearch}
            onChange={e => { setThematicSearch(e.target.value); setSelectedCompany(null); }}
            className="h-10 pl-9 text-[13px] bg-card border-border"
          />
        </div>
      </div>

      {/* Selected company back button */}
      {selectedCompany && (
        <button
          onClick={() => setSelectedCompany(null)}
          className="text-[12px] text-primary hover:underline mb-4 flex items-center gap-1"
        >
          <X className="h-3 w-3" /> Back to search
        </button>
      )}

      {/* Company Dashboard */}
      {selectedCompany && <CompanyDashboard company={selectedCompany} />}

      {/* Thematic results */}
      {!selectedCompany && thematicSearch.length >= 2 && (
        <div className="min-h-[600px]">
          {thematicResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <p className="text-[14px] text-muted-foreground">No companies matching "{thematicSearch}"</p>
            </div>
          ) : (
            <>
              <p className="text-[13px] text-muted-foreground mb-3">{thematicResults.length} companies found</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {thematicResults.map(c => (
                  <ThematicCard key={c.NSE_Symbol} company={c} query={thematicSearch} onClick={() => handleSelectCompany(c)} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Default state */}
      {!selectedCompany && thematicSearch.length < 2 && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <p className="text-[15px] font-medium text-foreground mb-1">DeepDive Research</p>
          <p className="text-[13px] text-muted-foreground max-w-md">
            Search for a specific company by name or ticker, or use thematic search to discover companies across sectors, supply chains, and revenue profiles.
          </p>
          <p className="text-[12px] text-muted-foreground mt-2">{companies.length} companies available</p>
        </div>
      )}
    </div>
  );
}

function ThematicCard({ company, query, onClick }: { company: DeepDiveCompany; query: string; onClick: () => void }) {
  const q = query.toLowerCase();
  const matchField = [
    company.Sector.toLowerCase().includes(q) ? 'Sector' : null,
    company.Supplier.toLowerCase().includes(q) ? 'Supplier' : null,
    company.Customer.toLowerCase().includes(q) ? 'Customer' : null,
    company.Revenue_Mix.toLowerCase().includes(q) ? 'Revenue Mix' : null,
    company.About.toLowerCase().includes(q) ? 'About' : null,
  ].filter(Boolean);

  const highlightText = (text: string) => {
    if (!text) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text.slice(0, 120) + (text.length > 120 ? '…' : '');
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + q.length + 60);
    const snippet = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
    const before = snippet.slice(0, idx - start + (start > 0 ? 1 : 0));
    const match = snippet.slice(idx - start + (start > 0 ? 1 : 0), idx - start + (start > 0 ? 1 : 0) + q.length);
    const after = snippet.slice(idx - start + (start > 0 ? 1 : 0) + q.length);
    return <>{before}<mark className="bg-primary/20 text-primary px-0.5 rounded">{match}</mark>{after}</>;
  };

  const contextText = company.About || company.Revenue_Mix || company.Sector;

  return (
    <div
      onClick={onClick}
      className="rounded-lg border border-border bg-card p-4 cursor-pointer card-hover-border transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[14px] font-semibold text-foreground">{company.Company_Name}</span>
        <span className="font-mono text-[11px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">{company.NSE_Symbol}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] text-muted-foreground">{company.Sector}</span>
        <span className="text-[11px] text-muted-foreground">•</span>
        <span className="text-[11px] text-muted-foreground">{company.Size}</span>
        {company.Marketcap_Cr && (
          <>
            <span className="text-[11px] text-muted-foreground">•</span>
            <span className="font-mono text-[11px] text-muted-foreground">₹{Number(company.Marketcap_Cr).toLocaleString()} Cr</span>
          </>
        )}
      </div>
      <p className="text-[12px] text-muted-foreground leading-relaxed">{highlightText(contextText)}</p>
      <div className="flex gap-1 mt-2">
        {matchField.map(f => (
          <span key={f} className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{f}</span>
        ))}
      </div>
    </div>
  );
}

function CompanyDashboard({ company }: { company: DeepDiveCompany }) {
  const suppliers = parseSupplierCustomer(company.Supplier);
  const customers = parseSupplierCustomer(company.Customer);
  const revenueMixes = parseRevenueMix(company.Revenue_Mix);
  const discussions = parseDiscussions(company.Discussions);

  return (
    <div className="space-y-6">
      {/* Section A: Header */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          <h1 className="text-[22px] font-semibold text-foreground">{company.Company_Name}</h1>
          <span className="font-mono text-[12px] text-primary bg-primary/10 px-2 py-1 rounded">{company.NSE_Symbol}</span>
          {company.Size && (
            <span className="text-[11px] text-muted-foreground bg-muted px-2 py-1 rounded">{company.Size}</span>
          )}
          {company.Sector && (
            <span className="text-[11px] text-muted-foreground bg-muted px-2 py-1 rounded">{company.Sector}</span>
          )}
        </div>
        {company.Marketcap_Cr && (
          <p className="font-mono text-[13px] text-foreground mb-3">
            Market Cap: <span className="font-semibold">₹{Number(company.Marketcap_Cr).toLocaleString()} Cr</span>
          </p>
        )}
        {company.About && (
          <p className="text-[13px] leading-relaxed text-muted-foreground">{company.About}</p>
        )}
        {company.URL_TJ && (
          <a
            href={company.URL_TJ}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline mt-2"
          >
            View on Tijori Finance <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Section B: Value Chain */}
      {(suppliers.length > 0 || customers.length > 0) && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-[14px] font-semibold text-foreground mb-4">Value Chain</h2>
          <div className="flex flex-col md:flex-row items-stretch gap-3">
            {/* Suppliers */}
            <div className="flex-1 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Suppliers</span>
              </div>
              {suppliers.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {suppliers.map(s => (
                    <span key={s} className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-[12px] text-foreground">{s}</span>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground">No supplier data</p>
              )}
            </div>

            {/* Center company */}
            <div className="flex items-center justify-center px-4">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:block" />
                <span className="font-semibold text-[14px] text-primary bg-primary/10 px-3 py-2 rounded-lg whitespace-nowrap">{company.Company_Name}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:block" />
              </div>
            </div>

            {/* Customers */}
            <div className="flex-1 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Customers</span>
              </div>
              {customers.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {customers.map(c => (
                    <span key={c} className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-[12px] text-foreground">{c}</span>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-muted-foreground">No customer data</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section C: Revenue Mix */}
      {revenueMixes.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-[14px] font-semibold text-foreground mb-4">Revenue & Business Mix</h2>
          <div className={cn(
            'grid gap-4',
            revenueMixes.length === 1 ? 'grid-cols-1' :
            revenueMixes.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          )}>
            {revenueMixes.map((mix, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/20 p-4">
                <h3 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-3">{mix.title}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={mix.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {mix.data.map((_, idx) => (
                        <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `${value.toFixed(2)}%`}
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {mix.data.slice(0, 6).map((d, idx) => (
                    <div key={d.name} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }} />
                      <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{d.name}</span>
                      <span className="text-[10px] font-mono text-foreground">{d.value}%</span>
                    </div>
                  ))}
                  {mix.data.length > 6 && (
                    <span className="text-[10px] text-muted-foreground">+{mix.data.length - 6} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section D: Discussions */}
      {discussions.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-[14px] font-semibold text-foreground mb-4">Research & Discussions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {discussions.map((d, i) => (
              <a
                key={i}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-3 hover:bg-accent transition-colors group"
              >
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                <span className="text-[12px] text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">{d.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
