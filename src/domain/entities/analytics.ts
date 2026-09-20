/**
 * Dashboard snapshot derived from the live backend — catalog listings plus
 * the CMS singletons, so the super admin sees the whole system at a glance.
 */

export interface MetricSummary {
  key: string;
  label: string;
  value: number;
  format: 'currency' | 'number';
  footnote?: string;
}

export interface CategorySlice {
  label: string;
  value: number;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface ModelSummary {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

/** One CMS block with a quick "is there content?" status. */
export interface CmsStatusRow {
  key: 'configuration' | 'policies' | 'story' | 'makers' | 'sustainability' | 'homepage' | 'collections';
  label: string;
  to: string;
  configured: boolean;
  detail: string;
}

export interface DashboardSnapshot {
  metrics: MetricSummary[];
  /** Product counts per category (donut). */
  productsByCategory: CategorySlice[];
  /** Product counts per gender (bars). */
  productsByGender: SeriesPoint[];
  /** Value counts per attribute (bars). */
  valuesByAttribute: SeriesPoint[];
  /** Models ordered by product count. */
  models: ModelSummary[];
  /** CMS blocks with content status. */
  cms: CmsStatusRow[];
}
