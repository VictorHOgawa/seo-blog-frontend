/** Tipos das respostas dos endpoints /admin/analytics do seo-blog-backend. */

export interface AnalyticsWindow {
  sessions: number;
  pageViews: number;
  events: number;
  leads: number;
  conversionRate: number;
}

export interface AnalyticsOverview {
  range: { since: string; days: number };
  current: AnalyticsWindow;
  previous: AnalyticsWindow;
}

export interface TimeseriesPoint {
  day: string;
  sessions: number;
  pageViews: number;
  leads: number;
}

export interface AnalyticsTimeseries {
  since: string;
  days: number;
  series: TimeseriesPoint[];
}

export interface FunnelStep {
  step: string;
  label: string;
  sessions: number;
  /** % em relação ao topo do funil */
  pctOfTop: number;
  /** % de passagem da etapa anterior */
  pctOfPrev: number;
}

export interface AnalyticsFunnel {
  since: string;
  days: number;
  steps: FunnelStep[];
}

export interface AttributionRow {
  source: string;
  sessions: number;
  leads: number;
  conversionRate: number;
}

export interface AnalyticsAttribution {
  since: string;
  days: number;
  bySource: AttributionRow[];
}

export interface AnalyticsLeadRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  status: string;
  createdAt: string;
}

export interface AnalyticsLeads {
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  items: AnalyticsLeadRow[];
}
