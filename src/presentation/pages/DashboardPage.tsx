import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  Mail,
  Package,
  ShoppingBag,
  Users,
} from 'lucide-react';
import type { DashboardOrder } from '../../domain/entities/analytics';
import { repositories } from '../../data/repositories';
import { useAsync } from '../../application/hooks/useAsync';
import { formatDate } from '../../shared/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { AreaChart } from '../components/charts/AreaChart';

type PeriodDays = 7 | 30 | 90;

const STATUS_TONES: Record<string, BadgeTone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  SHIPPED: 'sage',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  CANCELED: 'danger',
};

const readable = (value: string) => value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const money = (value: number | string, currency: string) => {
  const amount = Number(value);
  return `${currency} ${Number.isFinite(amount) ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}`;
};

function Delta({ value }: { value: number }) {
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={`delta-pill ${value >= 0 ? 'delta-up' : 'delta-down'}`}><Icon size={12} />{Math.abs(value).toFixed(1)}%</span>;
}

function DashboardSkeleton() {
  return <div className="stack"><div className="grid g-stats">{[0, 1, 2, 3].map((i) => <Skeleton key={i} style={{ height: 128 }} />)}</div><div className="grid g-half"><Skeleton style={{ height: 320 }} /><Skeleton style={{ height: 320 }} /></div><Skeleton style={{ height: 280 }} /></div>;
}

function RecentOrders({ orders }: { orders: DashboardOrder[] }) {
  if (orders.length === 0) return <EmptyState title="No recent orders" description="New storefront orders will appear here." />;
  return <div className="top-list">{orders.map((order) => {
    const firstItem = order.items[0];
    return <div key={order.id} className="content-row">
      {firstItem?.product_image?.url ? <img src={firstItem.product_image.url} alt={firstItem.product_image.alt || firstItem.product_name} style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover' }} /> : <span className="stat-icon" style={{ flex: 'none' }}><ShoppingBag size={16} /></span>}
      <div className="cell-stack" style={{ flex: 1, minWidth: 0 }}>
        <span className="cell-main">{order.customer_name || 'Guest'} <span className="cell-sub">· #{order.id.slice(0, 8)}</span></span>
        <span className="cell-sub">{firstItem?.product_name ?? 'No item details'}{order.items.length > 1 ? ` + ${order.items.length - 1} more` : ''} · {formatDate(order.created_at)}</span>
      </div>
      <div className="cell-stack" style={{ alignItems: 'flex-end' }}>
        <span className="cell-main">{money(order.subtotal, order.currency)}</span>
        <Badge tone={STATUS_TONES[order.status] ?? 'neutral'}>{readable(order.status)}</Badge>
      </div>
    </div>;
  })}</div>;
}

export function DashboardPage() {
  const [days, setDays] = useState<PeriodDays>(30);
  const { data, loading, error, reload } = useAsync(() => repositories.analytics.dashboard(days), [days]);
  const dailySales = useMemo(() => (data?.sales.daily ?? []).map((point) => ({
    label: new Date(`${point.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    value: point.revenue,
  })), [data?.sales.daily]);

  return <>
    <PageHeader title="Dashboard" subtitle={data ? `Store performance · ${formatDate(data.period.start_date)} – ${formatDate(data.period.end_date)}` : 'Store performance at a glance.'}>
      <Select aria-label="Sales period" style={{ width: 150 }} value={String(days)} onChange={(event) => setDays(Number(event.target.value) as PeriodDays)} options={[{ value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }]} />
    </PageHeader>

    {loading && !data ? <DashboardSkeleton /> : error ? <Card><CardBody><p className="step-note">Could not load the dashboard: {error}</p><button className="btn btn-secondary btn-sm" onClick={() => void reload()}>Try again</button></CardBody></Card> : data ? <div className="stack">
      <div className="grid g-stats">
        <StatCard label="Revenue" value={data.sales.revenue} format="number" footnote={`${data.sales.currency} · ${data.period.days} day period`} icon={<ShoppingBag size={18} />} />
        <StatCard label="Orders" value={data.sales.orders} format="number" footnote={`${data.orders.today} received today`} icon={<ClipboardList size={18} />} />
        <StatCard label="Average order value" value={data.sales.average_order_value} format="number" footnote={data.sales.currency} icon={<Boxes size={18} />} />
        <StatCard label="Total orders" value={data.orders.total} format="number" footnote="All time" icon={<Package size={18} />} />
      </div>

      <div className="grid g-half">
        <Card>
          <CardHeader title="Sales" subtitle={`Daily revenue · ${data.period.days} days`} />
          <CardBody>
            {dailySales.length === 0 ? <EmptyState title="No sales data" description="Daily revenue will appear when orders are placed." /> : <AreaChart data={dailySales} height={250} formatValue={(amount) => money(amount, data.sales.currency)} />}
            <div className="grid g-half" style={{ marginTop: 14 }}>
              <div className="cell-stack"><span className="cell-sub">Compared with previous period</span><span className="cell-main">Revenue <Delta value={data.sales.revenue_change_percent} /></span></div>
              <div className="cell-stack"><span className="cell-sub">Previous revenue</span><span className="cell-main">{money(data.sales.previous_revenue, data.sales.currency)}</span></div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Orders by status" subtitle={`${data.orders.total} orders total`} />
          <CardBody>
            {Object.keys(data.orders.by_status).length === 0 ? <EmptyState title="No orders yet" description="Order status totals will appear here." /> : <div className="top-list">{Object.entries(data.orders.by_status).map(([status, count]) => <div className="content-row" key={status}><Badge tone={STATUS_TONES[status] ?? 'neutral'}>{readable(status)}</Badge><span className="cell-main" style={{ marginLeft: 'auto' }}>{count}</span></div>)}</div>}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent orders" subtitle="Latest orders placed in your store" actions={<Link to="/orders" className="btn btn-ghost btn-sm">View all <ArrowRight size={13} /></Link>} />
        <CardBody>{<RecentOrders orders={data.orders.recent} />}</CardBody>
      </Card>

      <div className="grid g-half">
        <Card>
          <CardHeader title="Top selling products" subtitle={`By units sold · ${data.period.days} days`} />
          <CardBody>{data.top_products.length === 0 ? <EmptyState title="No products sold" description="Product sales will appear here." /> : <div className="top-list">{data.top_products.map((product, index) => <div className="top-item" key={`${product.sku}-${index}`}><span className="top-rank">{index + 1}</span><div className="top-info"><div className="top-name">{product.product_name}</div><div className="top-cat">SKU: {product.sku} · {product.quantity_sold} sold</div></div><div className="top-revenue">{money(product.revenue, data.sales.currency)}</div></div>)}</div>}</CardBody>
        </Card>
        <Card>
          <CardHeader title="Catalog" subtitle="Products and variants" actions={<Link to="/products" className="btn btn-ghost btn-sm">Manage products <ArrowRight size={13} /></Link>} />
          <CardBody><div className="top-list">
            <div className="content-row"><span className="cell-main">Products</span><span className="cell-sub">{data.catalog.active_products} active</span><strong style={{ marginLeft: 'auto' }}>{data.catalog.products}</strong></div>
            <div className="content-row"><span className="cell-main">Categories</span><span className="cell-sub">{data.catalog.active_categories} active</span><strong style={{ marginLeft: 'auto' }}>{data.catalog.categories}</strong></div>
            <div className="content-row"><span className="cell-main">Variants</span><span className="cell-sub">{data.catalog.active_variants} active</span><strong style={{ marginLeft: 'auto' }}>{data.catalog.variants}</strong></div>
          </div></CardBody>
        </Card>
      </div>

      <div className="grid g-stats">
        <StatCard label="Customers" value={data.customers.total} format="number" icon={<Users size={18} />} />
        <StatCard label="Contact messages" value={data.contact_messages.total} format="number" footnote={`${data.contact_messages.new} new · ${data.contact_messages.unresolved} unresolved`} icon={<Mail size={18} />} />
        <StatCard label="Newsletter subscribers" value={data.newsletter.total_subscribers} format="number" footnote={`${data.newsletter.active_subscribers} active`} icon={<Mail size={18} />} />
      </div>
    </div> : null}
  </>;
}
