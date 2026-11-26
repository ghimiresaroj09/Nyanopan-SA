import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';
import type { CatalogStatus, Model, ModelInput } from '../../domain/entities/catalog';
import { repositories } from '../../data/repositories';
import { useCrud } from '../../application/hooks/useCrud';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, CatalogStatusBadge } from '../components/ui/Badge';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { DataTable, type Column } from '../components/table/DataTable';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

function ModelFormModal({
  open,
  model,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  model: Model | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: ModelInput) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<CatalogStatus>('active');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(model?.name ?? '');
      setDescription(model?.description ?? '');
      setStatus(model?.status ?? 'active');
      setError(null);
    }
  }, [open, model]);

  const submit = async () => {
    if (!name.trim()) {
      setError('Model name is required.');
      return;
    }
    setError(null);
    await onSubmit({ name: name.trim(), description: description.trim(), status });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={model ? 'Edit model' : 'Add model'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : model ? 'Save changes' : 'Create model'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <div className="span-2">
          <Field label="Model name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Classic Slipper" />
          </Field>
        </div>
        <div className="span-2">
          <Field label="Description">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description shown in the storefront"
            />
          </Field>
        </div>
        <div className="span-2">
          <Field label="Status">
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => setStatus(e.target.value as CatalogStatus)}
            />
          </Field>
        </div>
      </div>
      {error && (
        <div className="form-error">
          <AlertTriangle size={15} /> {error}
        </div>
      )}
    </Modal>
  );
}

export function ModelsPage() {
  const { items, loading, create, update, remove, saving } = useCrud<Model, ModelInput>(
    repositories.models,
    'Model',
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Model | null>(null);
  const [deleting, setDeleting] = useState<Model | null>(null);

  const columns = useMemo<Array<Column<Model>>>(
    () => [
      {
        key: 'name',
        header: 'Model',
        sortValue: (m) => m.name.toLowerCase(),
        render: (m) => <span className="cell-main">{m.name}</span>,
      },
      {
        key: 'slug',
        header: 'Slug',
        sortValue: (m) => m.slug,
        render: (m) => <span className="slug-chip">{m.slug}</span>,
      },
      {
        key: 'description',
        header: 'Description',
        render: (m) => <span className="cell-sub">{m.description || '—'}</span>,
      },
      {
        key: 'products',
        header: 'Products',
        align: 'right',
        sortValue: (m) => m.productCount,
        render: (m) => <Badge tone="sage" dot={false}>{m.productCount}</Badge>,
      },
      {
        key: 'status',
        header: 'Status',
        sortValue: (m) => m.status,
        render: (m) => <CatalogStatusBadge status={m.status} />,
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (m) => (
          <div className="row-actions">
            <button
              className="icon-btn"
              title="Edit model"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(m);
                setFormOpen(true);
              }}
            >
              <Pencil size={15} />
            </button>
            <button
              className="icon-btn danger"
              title="Delete model"
              onClick={(e) => {
                e.stopPropagation();
                setDeleting(m);
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader title="Models" subtitle={`${items.length} product models in the live catalog`}>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={15} /> Add model
        </Button>
      </PageHeader>

      <Card>
        <DataTable
          data={items}
          columns={columns}
          getRowId={(m) => m.id}
          getSearchText={(m) => `${m.name} ${m.slug} ${m.description}`}
          searchPlaceholder="Search models…"
          loading={loading}
          pageSize={10}
          emptyTitle="No models yet"
          emptyDescription="Create your first model to start selling."
        />
      </Card>

      <ModelFormModal
        open={formOpen}
        model={editing}
        saving={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={async (input) => {
          if (editing) await update(editing.id, input);
          else await create(input);
          setFormOpen(false);
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        itemName={deleting?.name ?? ''}
        saving={saving}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await remove(deleting.id);
          setDeleting(null);
        }}
      />
    </>
  );
}
