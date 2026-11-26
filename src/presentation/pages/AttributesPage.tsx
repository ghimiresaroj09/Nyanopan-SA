import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Attribute, AttributeInput } from '../../domain/entities/catalog';
import { repositories } from '../../data/repositories';
import { useCrud } from '../../application/hooks/useCrud';
import { formatDate } from '../../shared/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { DataTable, type Column } from '../components/table/DataTable';

function AttributeFormModal({
  open,
  attribute,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  attribute: Attribute | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: AttributeInput) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [values, setValues] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(attribute?.name ?? '');
      setValues(attribute?.value.length ? [...attribute.value] : ['']);
      setError(null);
    }
  }, [open, attribute]);

  const setValueAt = (index: number, next: string) =>
    setValues((prev) => prev.map((v, i) => (i === index ? next : v)));

  const removeValueAt = (index: number) =>
    setValues((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : ['']));

  const submit = async () => {
    const clean = [...new Set(values.map((v) => v.trim()).filter(Boolean))];
    if (!name.trim()) {
      setError('Attribute name is required.');
      return;
    }
    if (clean.length === 0) {
      setError('Add at least one value.');
      return;
    }
    setError(null);
    await onSubmit({ name: name.trim(), value: clean });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={attribute ? 'Edit attribute' : 'Add attribute'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : attribute ? 'Save changes' : 'Create attribute'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <div className="span-2">
          <Field label="Name" hint="e.g. Color, Size, Material">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Attribute name" />
          </Field>
        </div>

        <div className="span-2">
          <Field label="Values" hint="The selectable options for this attribute.">
            <div className="value-editor">
              {values.map((value, index) => (
                <div key={index} className="value-editor-row">
                  <Input
                    value={value}
                    placeholder={`Value ${index + 1}`}
                    onChange={(e) => setValueAt(index, e.target.value)}
                  />
                  <button
                    type="button"
                    className="icon-btn danger"
                    aria-label={`Remove value ${index + 1}`}
                    onClick={() => removeValueAt(index)}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setValues((prev) => [...prev, ''])}
              >
                <Plus size={14} /> Add value
              </Button>
            </div>
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

export function AttributesPage() {
  const { items, loading, create, update, remove, saving } = useCrud<Attribute, AttributeInput>(
    repositories.attributes,
    'Attribute',
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Attribute | null>(null);
  const [deleting, setDeleting] = useState<Attribute | null>(null);

  const columns = useMemo<Array<Column<Attribute>>>(
    () => [
      {
        key: 'name',
        header: 'Attribute',
        sortValue: (a) => a.name.toLowerCase(),
        render: (a) => <span className="cell-main">{a.name}</span>,
      },
      {
        key: 'values',
        header: 'Values',
        sortValue: (a) => a.value.length,
        render: (a) => (
          <div className="value-chips">
            {a.value.map((v) => (
              <span key={v} className="value-chip">
                {v}
              </span>
            ))}
          </div>
        ),
      },
      {
        key: 'created',
        header: 'Created',
        sortValue: (a) => a.createdAt,
        render: (a) => formatDate(a.createdAt),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (a) => (
          <div className="row-actions">
            <button
              className="icon-btn"
              title="Edit attribute"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(a);
                setFormOpen(true);
              }}
            >
              <Pencil size={15} />
            </button>
            <button
              className="icon-btn danger"
              title="Delete attribute"
              onClick={(e) => {
                e.stopPropagation();
                setDeleting(a);
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
      <PageHeader
        title="Attributes"
        subtitle={`${items.length} attributes — dimensions shoppers can choose`}
      >
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={15} /> Add attribute
        </Button>
      </PageHeader>

      <Card>
        <DataTable
          data={items}
          columns={columns}
          getRowId={(a) => a.id}
          getSearchText={(a) => `${a.name} ${a.value.join(' ')}`}
          searchPlaceholder="Search attributes or values…"
          loading={loading}
          pageSize={10}
          emptyTitle="No attributes yet"
          emptyDescription="Attributes like Color or Size live here."
        />
      </Card>

      <AttributeFormModal
        open={formOpen}
        attribute={editing}
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
