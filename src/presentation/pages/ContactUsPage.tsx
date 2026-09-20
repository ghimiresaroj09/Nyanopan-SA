import { useEffect, useMemo, useState } from 'react';
import { Mail, Phone, Save } from 'lucide-react';
import type { ContactMessage, ContactMessageStatus } from '../../domain/entities/contact';
import { CONTACT_STATUSES } from '../../domain/entities/contact';
import { repositories } from '../../data/repositories';
import { useAsync } from '../../application/hooks/useAsync';
import { useToast } from '../../application/toast/ToastProvider';
import { formatDate } from '../../shared/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { Field } from '../components/ui/Field';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { DataTable, type Column } from '../components/table/DataTable';

type StatusFilter = '' | ContactMessageStatus;

const STATUS_TONES: Record<ContactMessageStatus, BadgeTone> = {
  NEW: 'info',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

const statusLabel = (status: ContactMessageStatus) =>
  CONTACT_STATUSES.find((s) => s.value === status)?.label ?? status;

function MessageModal({
  message,
  onClose,
  onSaved,
}: {
  message: ContactMessage | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [status, setStatus] = useState<ContactMessageStatus>('NEW');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (message) {
      setStatus(message.status);
      setNotes(message.admin_notes);
    }
  }, [message]);

  const save = async () => {
    if (!message) return;
    setSaving(true);
    try {
      await repositories.contactMessages.update(message.id, {
        status,
        admin_notes: notes,
      });
      toast.success('Message updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update message');
    } finally {
      setSaving(false);
    }
  };

  if (!message) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title={message.subject || 'Contact message'}
      width={640}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button disabled={saving} onClick={() => void save()}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <div className="stack">
        <div className="cell-stack">
          <span className="cell-main">{message.name}</span>
          <span className="cell-sub" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Mail size={12} /> {message.email}
            </span>
            {message.phone && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Phone size={12} /> {message.phone}
              </span>
            )}
          </span>
          <span className="cell-sub">Received {formatDate(message.created_at)}</span>
        </div>

        <div className="account-divider" />

        <div className="cell-sub" style={{ whiteSpace: 'pre-wrap' }}>
          {message.message}
        </div>

        <div className="account-divider" />

        <div className="form-grid">
          <Field label="Status">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContactMessageStatus)}
              options={CONTACT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            />
          </Field>
          <div className="span-2">
            <Field label="Internal notes">
              <textarea
                className="input"
                rows={3}
                placeholder="Visible to admins only…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function ContactUsPage() {
  const [status, setStatus] = useState<StatusFilter>('');
  const filterKey = status;
  const list = useAsync(
    () => repositories.contactMessages.list(status === '' ? {} : { status }),
    [filterKey],
  );
  const items = list.data ?? [];

  const [viewing, setViewing] = useState<ContactMessage | null>(null);

  const newCount = items.filter((m) => m.status === 'NEW').length;

  const columns = useMemo<Array<Column<ContactMessage>>>(
    () => [
      {
        key: 'sender',
        header: 'From',
        sortValue: (m) => m.name.toLowerCase(),
        render: (m) => (
          <div className="cell-stack">
            <span className="cell-main">{m.name}</span>
            <span className="cell-sub">{m.email}</span>
          </div>
        ),
      },
      {
        key: 'subject',
        header: 'Subject',
        sortValue: (m) => m.subject.toLowerCase(),
        render: (m) => (
          <span className="cell-sub" style={{ color: 'var(--text, #2c2a24)' }}>
            {m.subject}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortValue: (m) => m.status,
        render: (m) => <Badge tone={STATUS_TONES[m.status]}>{statusLabel(m.status)}</Badge>,
      },
      {
        key: 'created_at',
        header: 'Received',
        sortValue: (m) => m.created_at,
        render: (m) => formatDate(m.created_at),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Contact Us"
        subtitle={`${items.length} message${items.length === 1 ? '' : 's'}${status === '' ? ` · ${newCount} new` : ''} — sent from the storefront contact form.`}
      >
        <Select
          style={{ width: 150 }}
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          options={[
            { value: '', label: 'All statuses' },
            ...CONTACT_STATUSES.map((s) => ({ value: s.value, label: s.label })),
          ]}
        />
      </PageHeader>

      <Card>
        <DataTable
          data={items}
          columns={columns}
          getRowId={(m) => m.id}
          getSearchText={(m) => `${m.name} ${m.email} ${m.subject} ${m.message}`}
          searchPlaceholder="Search messages…"
          loading={list.loading}
          pageSize={10}
          emptyTitle="No messages yet"
          emptyDescription="Inquiries from the storefront contact form will appear here."
          onRowClick={(m) => setViewing(m)}
        />
      </Card>

      <MessageModal
        message={viewing}
        onClose={() => setViewing(null)}
        onSaved={() => list.reload()}
      />
    </>
  );
}
