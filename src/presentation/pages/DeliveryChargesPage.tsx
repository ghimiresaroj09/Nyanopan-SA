import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { DeliveryLocation, DeliveryLocationInput } from '../../domain/repositories';
import { repositories } from '../../data/repositories';
import { useAsync } from '../../application/hooks/useAsync';
import { useToast } from '../../application/toast/ToastProvider';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { DataTable, type Column } from '../components/table/DataTable';

const emptyForm: DeliveryLocationInput = {
  name: '',
  delivery_charge: '',
  is_free: false,
  is_active: true,
};

function LocationFormModal({
  open,
  location,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  location: DeliveryLocation | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: DeliveryLocationInput) => Promise<void>;
}) {
  const [form, setForm] = useState<DeliveryLocationInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(location ? {
      name: location.name,
      delivery_charge: location.delivery_charge,
      is_free: location.is_free,
      is_active: location.is_active,
    } : emptyForm);
    setError(null);
  }, [open, location]);

  const set = <K extends keyof DeliveryLocationInput>(key: K, value: DeliveryLocationInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Location name is required.');
      return;
    }
    if (!form.is_free && (!form.delivery_charge || !Number.isFinite(Number(form.delivery_charge)) || Number(form.delivery_charge) < 0)) {
      setError('Enter a valid delivery charge.');
      return;
    }
    setError(null);
    await onSubmit({
      ...form,
      name: form.name.trim(),
      delivery_charge: form.is_free ? '0' : form.delivery_charge,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={location ? 'Edit delivery location' : 'Add delivery location'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="delivery-location-form" disabled={saving}>
            {saving ? 'Saving…' : location ? 'Save changes' : 'Add location'}
          </Button>
        </>
      }
    >
      <form id="delivery-location-form" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Location name">
            <Input value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="e.g. Kathmandu" required />
          </Field>
          <Field label="Delivery charge" hint={form.is_free ? 'No charge will be applied.' : 'Amount in rupees.'}>
            <Input type="number" min="0" step="0.01" value={form.delivery_charge} onChange={(event) => set('delivery_charge', event.target.value)} placeholder="100" disabled={form.is_free} required={!form.is_free} />
          </Field>
          <Field label="Free delivery">
            <Switch checked={form.is_free} onChange={(value) => set('is_free', value)} label="Free delivery" />
          </Field>
          <Field label="Active">
            <Switch checked={form.is_active} onChange={(value) => set('is_active', value)} label="Location active" />
          </Field>
        </div>
        {error && <div className="form-error">{error}</div>}
      </form>
    </Modal>
  );
}

export function DeliveryChargesPage() {
  const toast = useToast();
  const { data, loading, reload } = useAsync(() => repositories.deliveryLocations.list(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryLocation | null>(null);
  const [deleting, setDeleting] = useState<DeliveryLocation | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (location: DeliveryLocation) => {
    setEditing(location);
    setFormOpen(true);
  };

  const submit = async (input: DeliveryLocationInput) => {
    setSaving(true);
    try {
      if (editing) {
        await repositories.deliveryLocations.update(editing.id, input);
        toast.success('Delivery location updated.');
      } else {
        await repositories.deliveryLocations.create(input);
        toast.success('Delivery location created.');
      }
      setFormOpen(false);
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save delivery location.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await repositories.deliveryLocations.remove(deleting.id);
      toast.success('Delivery location deleted.');
      setDeleting(null);
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete delivery location.');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<Array<Column<DeliveryLocation>>>(() => [
    {
      key: 'name',
      header: 'Location',
      sortValue: (location) => location.name.toLowerCase(),
      render: (location) => <span className="cell-main">{location.name}</span>,
    },
    {
      key: 'charge',
      header: 'Delivery charge',
      sortValue: (location) => Number(location.delivery_charge),
      render: (location) => location.is_free ? 'Free' : `Rs. ${location.delivery_charge}`,
    },
    {
      key: 'active',
      header: 'Status',
      sortValue: (location) => location.is_active ? 1 : 0,
      render: (location) => <Badge tone={location.is_active ? 'success' : 'neutral'}>{location.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (location) => (
        <div className="row-actions">
          <button className="icon-btn" title="Edit delivery location" aria-label={`Edit ${location.name}`} onClick={(event) => { event.stopPropagation(); openEdit(location); }}>
            <Pencil size={15} />
          </button>
          <button className="icon-btn danger" title="Delete delivery location" aria-label={`Delete ${location.name}`} onClick={(event) => { event.stopPropagation(); setDeleting(location); }}>
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ], []);

  return (
    <>
      <PageHeader title="Delivery Charges" subtitle="Configure delivery charges by location.">
        <Button onClick={openCreate}><Plus size={15} /> Add location</Button>
      </PageHeader>
      <Card className="delivery-charges-card">
        <DataTable
          data={data ?? []}
          columns={columns}
          getRowId={(location) => location.id}
          getSearchText={(location) => location.name}
          searchPlaceholder="Search locations…"
          loading={loading}
          emptyTitle="No delivery locations yet"
          emptyDescription="Add a location to configure its delivery charge."
        />
      </Card>
      <LocationFormModal
        open={formOpen}
        location={editing}
        saving={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={submit}
      />
      <ConfirmDeleteModal
        open={Boolean(deleting)}
        itemName={deleting?.name ?? ''}
        saving={saving}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
