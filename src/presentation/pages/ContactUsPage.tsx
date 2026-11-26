import { useEffect, useMemo, useState } from 'react';
import { Eye, Mail, Phone, Reply, Save, Send } from 'lucide-react';
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

function MessageDetailsModal({
  id,
  onClose,
  onSaved,
}: {
  id: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const detail = useAsync(() => (id ? repositories.contactMessages.get(id) : Promise.reject(new Error('No message selected'))), [id]);
  const message = detail.data;
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
      await repositories.contactMessages.update(message.id, { status, admin_notes: notes });
      toast.success('Message updated');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update message');
    } finally {
      setSaving(false);
    }
  };

  return <Modal open={Boolean(id)} onClose={onClose} title={message?.subject || 'Message details'} width={680} footer={<>
    <Button variant="ghost" onClick={onClose}>Close</Button>
    {message && <Button disabled={saving} onClick={() => void save()}><Save size={15} />{saving ? 'Saving…' : 'Save changes'}</Button>}
  </>}>
    {detail.loading ? <div className="card-body"><p className="step-note">Loading message details…</p></div> : detail.error ? <div className="card-body"><p className="step-note">Could not load message: {detail.error}</p></div> : message && <div className="stack">
      <div className="cell-stack">
        <span className="cell-main">{message.name}</span>
        <span className="cell-sub" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Mail size={12} />{message.email}</span>
          {message.phone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Phone size={12} />{message.phone}</span>}
        </span>
        <span className="cell-sub">Received {formatDate(message.created_at)}</span>
      </div>
      <div className="account-divider" />
      <div className="cell-stack"><span className="cell-main">Message</span><div className="cell-sub" style={{ whiteSpace: 'pre-wrap' }}>{message.message}</div></div>
      <div className="form-grid">
        <Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value as ContactMessageStatus)} options={CONTACT_STATUSES.map((s) => ({ value: s.value, label: s.label }))} /></Field>
        <div className="span-2"><Field label="Internal notes"><textarea className="input" rows={3} placeholder="Visible to admins only…" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field></div>
      </div>
      <div className="account-divider" />
      <div className="cell-stack"><span className="cell-main">Reply history</span>
        {(message.replies ?? []).length === 0 ? <span className="cell-sub">No replies sent yet.</span> : <div className="top-list">{message.replies!.map((entry) => <div className="content-row" key={entry.id}><div className="cell-stack" style={{ flex: 1 }}><span className="cell-main">{entry.subject}</span><span className="cell-sub">Sent by {entry.sent_by_email} · {formatDate(entry.sent_at)}</span><span className="cell-sub" style={{ whiteSpace: 'pre-wrap' }}>{entry.reply}</span></div></div>)}</div>}
      </div>
    </div>}
  </Modal>;
}

function ReplyModal({ message, onClose, onSent }: { message: ContactMessage | null; onClose: () => void; onSent: () => void }) {
  const toast = useToast();
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  useEffect(() => {
    if (message) setReply(`Hi ${message.name || 'there'},\n\nThank you for contacting Nyanopan. We received your message about “${message.subject || 'your inquiry'}” and will be happy to help.\n\nPlease let us know if you have any other questions.\n\nWarm regards,\nNyanopan Support`);
  }, [message]);
  const send = async () => {
    if (!message || !reply.trim()) return;
    setSending(true);
    try {
      const result = await repositories.contactMessages.reply(message.id, reply.trim());
      toast.success(`Reply sent to ${result.email}`);
      onSent();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send reply');
    } finally {
      setSending(false);
    }
  };
  return <Modal open={Boolean(message)} onClose={onClose} title={message ? `Reply to ${message.name || message.email}` : 'Reply'} width={620} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={sending || !reply.trim()} onClick={() => void send()}><Send size={15} />{sending ? 'Sending…' : 'Send email reply'}</Button></>}>
    {message && <div className="stack"><div className="cell-stack"><span className="cell-sub">To: {message.email}</span><span className="cell-sub">Subject: Re: {message.subject || 'Contact inquiry'}</span></div><Field label="Email reply"><textarea className="input" rows={9} placeholder="Write your reply…" value={reply} onChange={(e) => setReply(e.target.value)} /></Field></div>}
  </Modal>;
}

export function ContactUsPage() {
  const [status, setStatus] = useState<StatusFilter>('');
  const list = useAsync(() => repositories.contactMessages.list(status === '' ? {} : { status }), [status]);
  const items = list.data ?? [];
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [replying, setReplying] = useState<ContactMessage | null>(null);
  const newCount = items.filter((m) => m.status === 'NEW').length;

  const columns = useMemo<Array<Column<ContactMessage>>>(() => [
    { key: 'sender', header: 'From', sortValue: (m) => m.name.toLowerCase(), render: (m) => <div className="cell-stack"><span className="cell-main">{m.name}</span><span className="cell-sub">{m.email}</span></div> },
    { key: 'subject', header: 'Subject', sortValue: (m) => m.subject.toLowerCase(), render: (m) => <span className="cell-sub" style={{ color: 'var(--text, #2c2a24)' }}>{m.subject}</span> },
    { key: 'status', header: 'Status', sortValue: (m) => m.status, render: (m) => <Badge tone={STATUS_TONES[m.status]}>{statusLabel(m.status)}</Badge> },
    { key: 'created_at', header: 'Received', sortValue: (m) => m.created_at, render: (m) => formatDate(m.created_at) },
    { key: 'view', header: 'View', render: (m) => <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); setViewingId(m.id); }}><Eye size={14} />View</Button> },
    { key: 'reply', header: 'Action', align: 'right', render: (m) => <Button size="sm" variant="secondary" onClick={(event) => { event.stopPropagation(); setReplying(m); }}><Reply size={14} />Reply</Button> },
  ], []);

  return <>
    <PageHeader title="Contact Us" subtitle={`${items.length} message${items.length === 1 ? '' : 's'}${status === '' ? ` · ${newCount} new` : ''} — sent from the storefront contact form.`}>
      <Select style={{ width: 150 }} value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} options={[{ value: '', label: 'All statuses' }, ...CONTACT_STATUSES.map((s) => ({ value: s.value, label: s.label }))]} />
    </PageHeader>
    <Card><DataTable data={items} columns={columns} getRowId={(m) => m.id} getSearchText={(m) => `${m.name} ${m.email} ${m.subject} ${m.message}`} searchPlaceholder="Search messages…" loading={list.loading} pageSize={10} emptyTitle="No messages yet" emptyDescription="Inquiries from the storefront contact form will appear here." onRowClick={(m) => setViewingId(m.id)} /></Card>
    <MessageDetailsModal id={viewingId} onClose={() => setViewingId(null)} onSaved={() => list.reload()} />
    <ReplyModal message={replying} onClose={() => setReplying(null)} onSent={() => { list.reload(); if (viewingId) setViewingId(viewingId); }} />
  </>;
}
