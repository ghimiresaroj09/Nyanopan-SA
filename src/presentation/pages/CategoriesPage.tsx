import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Image as ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import type { CatalogStatus, Category } from '../../domain/entities/catalog';
import { useCategories } from '../../application/hooks/useCategories';
import { cn, formatDate } from '../../shared/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CatalogStatusBadge } from '../components/ui/Badge';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { DataTable, type Column } from '../components/table/DataTable';

type StatusFilter = 'all' | CatalogStatus;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

function CategoryFormModal({
  open,
  category,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  category: Category | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (form: FormData) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<CatalogStatus>('active');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(category?.name ?? '');
      setDescription(category?.description ?? '');
      setStatus(category?.status ?? 'active');
      setFile(null);
      setPreview(category?.image || null);
      setError(null);
    }
  }, [open, category]);

  const onFileChange = (next: File | null) => {
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : category?.image || null);
  };

  const submit = async () => {
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }
    setError(null);
    const form = new FormData();
    form.append('name', name.trim());
    form.append('description', description.trim());
    form.append('status', status);
    if (file) form.append('image', file, file.name);
    await onSubmit(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? 'Edit category' : 'Add category'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : category ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      <form
        className="form-grid"
        encType="multipart/form-data"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="span-2">
          <Field label="Name">
            <Input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apparel"
            />
          </Field>
        </div>
        <div className="span-2">
          <Field label="Description">
            <Input
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description shown in the storefront"
            />
          </Field>
        </div>
        <Field label="Status">
          <Select
            name="status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value as CatalogStatus)}
          />
        </Field>
        <div className="span-2">
          <Field label="Image" hint="PNG or JPG — shown next to the category in the storefront.">
            <label className="file-drop">
              {preview ? (
                <img src={preview} alt="" />
              ) : (
                <span className="file-drop-placeholder">
                  <ImageIcon size={18} />
                </span>
              )}
              <span className="file-drop-text">
                <strong>{file ? file.name : 'Upload image'}</strong>
                <span> Click to choose a file</span>
              </span>
              <input
                name="image"
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              />
            </label>
          </Field>
        </div>
      </form>
      {error && (
        <div className="form-error">
          <AlertTriangle size={15} /> {error}
        </div>
      )}
    </Modal>
  );
}

export function CategoriesPage() {
  const { items, loading, create, update, remove, saving } = useCategories();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const counts = useMemo(
    () => ({
      all: items.length,
      active: items.filter((c) => c.status === 'active').length,
      inactive: items.filter((c) => c.status === 'inactive').length,
    }),
    [items],
  );

  const filterFn = useCallback(
    (category: Category) => statusFilter === 'all' || category.status === statusFilter,
    [statusFilter],
  );

  const columns = useMemo<Array<Column<Category>>>(
    () => [
      {
        key: 'image',
        header: 'Image',
        render: (c) =>
          c.image ? (
            <img className="cat-thumb" src={c.image} alt="" />
          ) : (
            <span className="cat-thumb cat-thumb-empty">{c.name.charAt(0)}</span>
          ),
      },
      {
        key: 'name',
        header: 'Name',
        sortValue: (c) => c.name.toLowerCase(),
        render: (c) => <span className="cell-main">{c.name}</span>,
      },
      {
        key: 'slug',
        header: 'Slug',
        sortValue: (c) => c.slug,
        render: (c) => <span className="slug-chip">{c.slug}</span>,
      },
      {
        key: 'description',
        header: 'Description',
        render: (c) => <span className="cell-sub">{c.description || '—'}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        sortValue: (c) => c.status,
        render: (c) => <CatalogStatusBadge status={c.status} />,
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (c) => (
          <div className="row-actions">
            <button
              className="icon-btn"
              title="Edit category"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(c);
                setFormOpen(true);
              }}
            >
              <Pencil size={15} />
            </button>
            <button
              className="icon-btn danger"
              title="Delete category"
              onClick={(e) => {
                e.stopPropagation();
                setDeleting(c);
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
      <PageHeader title="Categories" subtitle={`${counts.all} categories organizing the catalog`}>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={15} /> Add category
        </Button>
      </PageHeader>

      <div className="chip-row">
        {(['all', 'active', 'inactive'] as const).map((value) => (
          <button
            key={value}
            className={cn('chip', statusFilter === value && 'active')}
            onClick={() => setStatusFilter(value)}
          >
            {value === 'all' ? 'All' : value === 'active' ? 'Active' : 'Inactive'}
            <span className="chip-count">{counts[value]}</span>
          </button>
        ))}
      </div>

      <Card>
        <DataTable
          data={items}
          columns={columns}
          getRowId={(c) => c.id}
          getSearchText={(c) => `${c.name} ${c.slug} ${c.description}`}
          searchPlaceholder="Search categories…"
          filterFn={filterFn}
          loading={loading}
          pageSize={10}
          emptyTitle="No categories found"
          emptyDescription="Try a different search term or status filter."
        />
      </Card>

      <CategoryFormModal
        open={formOpen}
        category={editing}
        saving={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={async (form) => {
          if (editing) await update(editing.id, form);
          else await create(form);
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
