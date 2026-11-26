import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Eye, Mail, MapPin, Phone } from 'lucide-react';
import type { Order, OrderStatus, OrderStatusTimelineEntry } from '../../domain/repositories';
import { repositories } from '../../data/repositories';
import { useAsync } from '../../application/hooks/useAsync';
import { formatDate } from '../../shared/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { DataTable, type Column } from '../components/table/DataTable';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { useToast } from '../../application/toast/ToastProvider';

const ORDER_STATUSES: Array<{ value: OrderStatus; label: string }> = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_TONES: Record<string, BadgeTone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  SHIPPED: 'sage',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  CANCELED: 'danger',
};

const money = (value: string, currency: string) => {
  const amount = Number(value);
  return `${currency || 'NPR'} ${Number.isFinite(amount) ? amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}`;
};

const readableStatus = (status: string) => status.replace(/_/g, ' ');

function OrderDetailsModal({ order, timeline, timelineError, loading, error, savingStatus, onClose, onUpdateStatus }: { order: Order | null; timeline: OrderStatusTimelineEntry[]; timelineError: string | null; loading: boolean; error: string | null; savingStatus: boolean; onClose: () => void; onUpdateStatus: (status: OrderStatus) => void }) {
  const [nextStatus, setNextStatus] = useState<OrderStatus>('PENDING');

  useEffect(() => {
    if (order) setNextStatus(order.status as OrderStatus);
  }, [order]);

  if (!order && !loading && !error) return null;
  return (
    <Modal open onClose={onClose} title={order ? `Order ${order.id.slice(0, 8)}` : 'Order details'} width={760} footer={<>
      {order && <div style={{ display: 'flex', gap: 8, marginRight: 'auto', alignItems: 'center' }}>
        <Select
          aria-label="Order status"
          style={{ width: 155 }}
          value={nextStatus}
          onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
          options={ORDER_STATUSES}
        />
        <Button disabled={savingStatus || nextStatus === order.status} onClick={() => onUpdateStatus(nextStatus)}>
          {savingStatus ? 'Updating…' : 'Update status'}
        </Button>
      </div>}
      <Button variant="ghost" onClick={onClose}>Close</Button>
    </>}>
      {loading ? <div className="card-body"><p className="step-note">Loading order details…</p></div> : error ? <div className="card-body"><p className="step-note">Could not load order details: {error}</p></div> : !order ? null :
      <div className="stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div className="cell-stack">
            <span className="cell-main">{order.customer_name}</span>
            <span className="cell-sub">Placed {formatDate(order.created_at)}</span>
          </div>
          <Badge tone={STATUS_TONES[order.status] ?? 'neutral'}>{readableStatus(order.status)}</Badge>
        </div>

        <div className="account-divider" />
        <div className="grid g-half">
          <div className="cell-stack">
            <strong>Contact</strong>
            <span className="cell-sub" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Mail size={13} /> {order.email || '—'}</span>
            <span className="cell-sub" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Phone size={13} /> {order.phone || '—'}</span>
            {order.alternate_phone && <span className="cell-sub">Alternate: {order.alternate_phone}</span>}
          </div>
          <div className="cell-stack">
            <strong>Delivery address</strong>
            <span className="cell-sub" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><MapPin size={13} /> {order.address || '—'}</span>
            {order.landmark && <span className="cell-sub">Landmark: {order.landmark}</span>}
            <span className="cell-sub">{[order.city_district, order.delivery_location_name].filter(Boolean).join(' · ')}</span>
          </div>
        </div>
        {(order.company_name || order.pan_vat_number || order.notes) && <>
          <div className="account-divider" />
          <div className="cell-stack">
            {order.company_name && <span><strong>Company:</strong> {order.company_name}</span>}
            {order.pan_vat_number && <span><strong>PAN/VAT:</strong> {order.pan_vat_number}</span>}
            {order.notes && <span><strong>Customer notes:</strong> {order.notes}</span>}
          </div>
        </>}

        <div className="account-divider" />
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Item</th><th>Variant / SKU</th><th>Unit price</th><th>Qty</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
            <tbody>
              {order.items.map((item, index) => <tr key={`${item.sku}-${index}`}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
                    {item.product_image?.url && <img
                      src={item.product_image.url}
                      alt={item.product_image.alt || item.product_image.title || item.product_name}
                      title={item.product_image.caption || undefined}
                      loading="lazy"
                      style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, flex: 'none', background: 'var(--surface-soft)' }}
                    />}
                    <span className="cell-main">{item.product_name}</span>
                  </div>
                </td>
                <td><div className="cell-stack"><span>{item.variant_name}</span><span className="cell-sub">{item.sku}</span></div></td>
                <td>{money(item.unit_price, order.currency)}</td>
                <td>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{money(item.line_total, order.currency)}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <div className="cell-stack" style={{ alignSelf: 'flex-end', minWidth: 220, width: 'min(100%, 300px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><span>Products</span><span>{money(order.product_subtotal, order.currency)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><span>Delivery</span><span>{money(order.delivery_charge, order.currency)}</span></div>
          <div className="account-divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><strong>Total</strong><strong>{money(order.subtotal, order.currency)}</strong></div>
        </div>

        {(timeline.length > 0 || timelineError || loading) && <>
          <div className="account-divider" />
          <div className="order-history">
            <div className="order-history-heading">
              <div>
                <h4 className="card-title">Status timeline</h4>
                <p className="card-subtitle">{timeline.length} update{timeline.length === 1 ? '' : 's'} for this order</p>
              </div>
              {timeline.length > 0 && <Badge tone="neutral">{readableStatus(timeline[timeline.length - 1].to_status)}</Badge>}
            </div>
            {timelineError && <span className="cell-sub">Could not load status history: {timelineError}</span>}
            {loading && timeline.length === 0 && !timelineError && <span className="cell-sub">Loading status history…</span>}
            <div className="order-timeline">
              {[...timeline].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((entry, index, entries) => (
                <div key={entry.id} className="order-timeline-item">
                  <div className={`order-timeline-rail ${index === entries.length - 1 ? 'last' : ''}`}>
                    <span className={`order-timeline-dot ${STATUS_TONES[entry.to_status] ?? 'neutral'}`} />
                  </div>
                  <div className="order-timeline-card">
                    <div className="order-timeline-top">
                      <div className="order-timeline-transition">
                        {entry.from_status ? <Badge tone={STATUS_TONES[entry.from_status] ?? 'neutral'}>{readableStatus(entry.from_status)}</Badge> : <span className="cell-sub">Order created</span>}
                        <ArrowRight size={14} className="cell-sub" />
                        <Badge tone={STATUS_TONES[entry.to_status] ?? 'neutral'}>{readableStatus(entry.to_status)}</Badge>
                      </div>
                      <time className="order-timeline-date" dateTime={entry.created_at}>
                        {new Date(entry.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </time>
                    </div>
                    <p className="order-timeline-note">{entry.note.trim() || 'No note provided.'}</p>
                    <span className="order-timeline-actor">{entry.changed_by_name || 'Storefront checkout'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>}
      </div>}
    </Modal>
  );
}

export function OrdersPage() {
  const toast = useToast();
  const ordersQuery = useAsync(() => repositories.orders.list(), []);
  const orders = ordersQuery.data ?? [];
  const [status, setStatus] = useState('');
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<OrderStatusTimelineEntry[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);

  const updateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setSavingOrderId(orderId);
    try {
      await repositories.orders.updateStatus(orderId, nextStatus);
      await ordersQuery.reload();
      if (viewingId === orderId) {
        const [refreshedOrder, refreshedTimeline] = await Promise.all([
          repositories.orders.get(orderId),
          repositories.orders.timeline(orderId),
        ]);
        setViewing(refreshedOrder);
        setTimeline(refreshedTimeline);
      }
      toast.success('Order status updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update order status.');
    } finally {
      setSavingOrderId(null);
    }
  };

  useEffect(() => {
    if (!viewingId) {
      setViewing(null);
      setDetailError(null);
      setTimeline([]);
      setTimelineError(null);
      setDetailLoading(false);
      return;
    }
    let current = true;
    setViewing(null);
    setDetailError(null);
    setDetailLoading(true);
    Promise.all([repositories.orders.get(viewingId), repositories.orders.timeline(viewingId)])
      .then(([order, history]) => { if (current) { setViewing(order); setTimeline(history); } })
      .catch(async (error: unknown) => {
        if (!current) return;
        // Keep the order details usable even if the timeline endpoint fails.
        try {
          const order = await repositories.orders.get(viewingId);
          if (current) setViewing(order);
        } catch (detailError) {
          if (current) setDetailError(detailError instanceof Error ? detailError.message : 'Request failed');
        }
        if (current) setTimelineError(error instanceof Error ? error.message : 'Request failed');
      })
      .finally(() => { if (current) setDetailLoading(false); });
    return () => { current = false; };
  }, [viewingId]);

  const statuses = useMemo(() => [...new Set(orders.map((order) => order.status))].sort(), [orders]);
  const visibleOrders = status ? orders.filter((order) => order.status === status) : orders;
  const columns = useMemo<Array<Column<Order>>>(() => [
    {
      key: 'order',
      header: 'Order',
      sortValue: (order) => order.created_at,
      render: (order) => <div className="cell-stack"><span className="cell-main">#{order.id.slice(0, 8)}</span><span className="cell-sub">{formatDate(order.created_at)}</span></div>,
    },
    {
      key: 'customer',
      header: 'Customer',
      sortValue: (order) => order.customer_name.toLowerCase(),
      render: (order) => <div className="cell-stack"><span className="cell-main">{order.customer_name}</span><span className="cell-sub">{order.email}</span></div>,
    },
    {
      key: 'delivery',
      header: 'Delivery location',
      sortValue: (order) => order.delivery_location_name.toLowerCase(),
      render: (order) => order.delivery_location_name || order.city_district || '—',
    },
    {
      key: 'total',
      header: 'Total',
      sortValue: (order) => Number(order.subtotal),
      render: (order) => money(order.subtotal, order.currency),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (order) => order.status,
      render: (order) => <Badge tone={STATUS_TONES[order.status] ?? 'neutral'}>{readableStatus(order.status)}</Badge>,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (order) => <button className="icon-btn" title="View order" aria-label={`View order ${order.id}`} onClick={(event) => { event.stopPropagation(); setViewingId(order.id); }}><Eye size={15} /></button>,
    },
  ], []);

  return <>
    <PageHeader title="Orders" subtitle={`${orders.length} order${orders.length === 1 ? '' : 's'} received.`}>
      <Select
        style={{ width: 170 }}
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        options={[{ value: '', label: 'All statuses' }, ...statuses.map((value) => ({ value, label: readableStatus(value) }))]}
      />
    </PageHeader>
    {ordersQuery.error ? <Card><div className="card-body"><p className="step-note">Could not load orders: {ordersQuery.error}</p></div></Card> : <Card>
      <DataTable
        data={visibleOrders}
        columns={columns}
        getRowId={(order) => order.id}
        getSearchText={(order) => `${order.id} ${order.customer_name} ${order.email} ${order.phone} ${order.delivery_location_name}`}
        searchPlaceholder="Search orders…"
        loading={ordersQuery.loading}
        pageSize={10}
        emptyTitle="No orders yet"
        emptyDescription="Orders from checkout will appear here."
        onRowClick={(order) => setViewingId(order.id)}
      />
    </Card>}
    <OrderDetailsModal order={viewing} timeline={timeline} timelineError={timelineError} loading={detailLoading} error={detailError} savingStatus={savingOrderId === viewingId} onClose={() => setViewingId(null)} onUpdateStatus={(nextStatus) => { if (viewingId) void updateStatus(viewingId, nextStatus); }} />
  </>;
}
