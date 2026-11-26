/** Store dashboard data returned by /api/v1/admin/dashboard/. */

export interface DashboardDailySales {
  date: string;
  revenue: number;
  orders: number;
}

export interface DashboardPeriod {
  days: number;
  start_date: string;
  end_date: string;
  previous_start_date: string;
  previous_end_date: string;
}

export interface DashboardSales {
  revenue: number;
  previous_revenue: number;
  revenue_change_percent: number;
  orders: number;
  previous_orders: number;
  orders_change_percent: number;
  average_order_value: number;
  currency: string;
  daily: DashboardDailySales[];
}

export interface DashboardOrderItem {
  product_name: string;
  product_image: { url: string; title?: string; caption?: string; alt?: string } | null;
  variant_name: string;
  sku: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface DashboardOrder {
  id: string;
  status: string;
  customer_name: string;
  email: string;
  phone: string;
  subtotal: string;
  currency: string;
  items: DashboardOrderItem[];
  created_at: string;
}

export interface DashboardData {
  period: DashboardPeriod;
  sales: DashboardSales;
  orders: {
    total: number;
    by_status: Record<string, number>;
    today: number;
    recent: DashboardOrder[];
  };
  top_products: Array<{
    product_name: string;
    sku: string;
    quantity_sold: number;
    revenue: number;
  }>;
  catalog: {
    products: number;
    active_products: number;
    categories: number;
    active_categories: number;
    variants: number;
    active_variants: number;
  };
  customers: { total: number };
  contact_messages: { total: number; new: number; unresolved: number };
  newsletter: { total_subscribers: number; active_subscribers: number };
}

/** Shared chart inputs used by the catalog chart components. */
export interface SeriesPoint {
  label: string;
  value: number;
}

export interface CategorySlice extends SeriesPoint {}
