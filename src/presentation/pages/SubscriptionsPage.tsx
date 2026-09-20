import { useMemo, useState } from 'react';
import type { Subscription } from '../../domain/entities/subscription';
import { repositories } from '../../data/repositories';
import { useAsync } from '../../application/hooks/useAsync';
import { formatDate } from '../../shared/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { DataTable, type Column } from '../components/table/DataTable';

type StatusFilter = '' | 'true' | 'false';

export function SubscriptionsPage() {
  const [status, setStatus] = useState<StatusFilter>('');
  const filterKey = status;
  const list = useAsync(
    () => repositories.subscriptions.list(status === '' ? {} : { is_active: status === 'true' }),
    [filterKey],
  );
  const items = list.data ?? [];

  const columns = useMemo<Array<Column<Subscription>>>(
    () => [
      {
        key: 'email',
        header: 'Email',
        sortValue: (s) => s.email.toLowerCase(),
        render: (s) => (
          <div className="cell-stack">
            <span className="cell-main">{s.email}</span>
            <span className="cell-sub">subscribed {formatDate(s.subscribed_at)}</span>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortValue: (s) => (s.is_active ? 1 : 0),
        render: (s) => (
          <Badge tone={s.is_active ? 'success' : 'neutral'}>
            {s.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        key: 'subscribed_at',
        header: 'Subscribed at',
        sortValue: (s) => s.subscribed_at,
        render: (s) => formatDate(s.subscribed_at),
      },
      {
        key: 'created_at',
        header: 'Created',
        sortValue: (s) => s.created_at,
        render: (s) => formatDate(s.created_at),
      },
    ],
    [],
  );

  const activeCount = items.filter((s) => s.is_active).length;

  return (
    <>
      <PageHeader
        title="Subscriptions"
        subtitle={`${items.length} subscriber${items.length === 1 ? '' : 's'}${status === '' ? ` · ${activeCount} active` : ''} — collected by the storefront newsletter form.`}
      >
        <Select
          style={{ width: 140 }}
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
        />
      </PageHeader>

      <Card>
        <DataTable
          data={items}
          columns={columns}
          getRowId={(s) => s.id}
          getSearchText={(s) => s.email}
          searchPlaceholder="Search by email…"
          loading={list.loading}
          pageSize={10}
          emptyTitle="No subscribers yet"
          emptyDescription="Newsletter sign-ups from the storefront will appear here."
        />
      </Card>
    </>
  );
}
