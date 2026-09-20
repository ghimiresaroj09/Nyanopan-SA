/**
 * Shared CMS section editors — used by Our Story & Sustainability and the
 * Home page. All image pickers are file-only: picks upload immediately to
 * Cloudinary via /admin/images/upload/ and the returned URL is stored.
 */
import { useEffect, useRef, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import type { SimpleSection, SubsectionRow } from '../../../domain/entities/story';
import { repositories } from '../../../data/repositories';
import { useToast } from '../../../application/toast/ToastProvider';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Switch } from '../ui/Switch';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal';

export function ImagePicker({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await repositories.imageUpload.upload(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="img-picker">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => void pick(e.target.files?.[0] ?? null)}
      />
      {value ? (
        <span className="img-thumb img-thumb-lg">
          <img src={value} alt="" />
        </span>
      ) : (
        <button type="button" className="file-drop file-drop-sm" onClick={() => inputRef.current?.click()}>
          <span className="file-drop-placeholder">
            <Upload size={16} />
          </span>
          <span className="file-drop-text">
            {uploading ? 'Uploading…' : <><strong>Pick an image</strong> — uploads to Cloudinary</>}
          </span>
        </button>
      )}
      {value && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? 'Uploading…' : 'Replace'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onChange('')}>
            Remove
          </Button>
        </div>
      )}
      {uploading && <Loader2 size={16} className="spin" style={{ color: 'var(--secondary)' }} />}
    </div>
  );
}

export function SectionFields({
  section,
  onChange,
}: {
  section: SimpleSection;
  onChange: (next: SimpleSection) => void;
}) {
  return (
    <div className="form-grid">
      <div className="span-2">
        <Field label="Section title">
          <Input value={section.title} onChange={(e) => onChange({ ...section, title: e.target.value })} />
        </Field>
      </div>
      <div className="span-2">
        <Field label="Section text">
          <textarea
            className="input"
            rows={3}
            value={section.description}
            onChange={(e) => onChange({ ...section, description: e.target.value })}
          />
        </Field>
      </div>
      <div className="span-2">
        <Field label="Image (optional)">
          <ImagePicker value={section.image} onChange={(image) => onChange({ ...section, image })} />
        </Field>
      </div>
    </div>
  );
}

export const newRow = (sortOrder: number): SubsectionRow => ({
  title: '',
  description: '',
  image: '',
  sort_order: sortOrder,
  is_active: true,
});

/** Add/edit modal shared by story subsections and similar ordered rows. */
export function RowModal({
  open,
  row,
  onClose,
  onSave,
}: {
  open: boolean;
  row: SubsectionRow | null;
  onClose: () => void;
  onSave: (row: SubsectionRow) => void;
}) {
  const [form, setForm] = useState<SubsectionRow>(row ?? newRow(0));
  useEffect(() => {
    if (open) setForm(row ?? newRow(0));
  }, [open, row]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={row?.id ? 'Edit row' : 'Add row'}
      width={620}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!form.title.trim()} onClick={() => onSave(form)}>
            {row?.id ? 'Save changes' : 'Add row'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <div className="span-2">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
        </div>
        <div className="span-2">
          <Field label="Description">
            <textarea
              className="input"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
        </div>
        <div className="span-2">
          <Field label="Image (optional)">
            <ImagePicker value={form.image} onChange={(image) => setForm({ ...form, image })} />
          </Field>
        </div>
        <Field label="Sort order">
          <Input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
          />
        </Field>
        <Field label="Visible">
          <Switch checked={form.is_active} onChange={(is_active) => setForm({ ...form, is_active })} />
        </Field>
      </div>
    </Modal>
  );
}

export function RowList({
  rows,
  onChange,
  rowLabel,
}: {
  rows: SubsectionRow[];
  onChange: (next: SubsectionRow[]) => void;
  rowLabel: string;
}) {
  const [editing, setEditing] = useState<{ index: number | null; row: SubsectionRow } | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const save = (row: SubsectionRow) => {
    if (!editing) return;
    const next = [...rows];
    if (editing.index === null) next.push(row);
    else next[editing.index] = row;
    onChange(next);
    setEditing(null);
  };

  const confirmRemove = () => {
    if (removing === null) return;
    onChange(rows.filter((_, i) => i !== removing));
    setRemoving(null);
  };

  return (
    <div>
      {rows.length === 0 && <p className="step-note">No rows yet — add the first one.</p>}
      {rows.map((row, index) => (
        <div key={row.id ?? `new-${index}`} className="content-row">
          {row.image ? (
            <span className="img-thumb">
              <img src={row.image} alt="" />
            </span>
          ) : null}
          <div className="cell-stack">
            <span className="cell-main">{row.title || '(untitled)'}</span>
            <span className="cell-sub">
              Order {row.sort_order} · {row.description.slice(0, 80)}
              {row.description.length > 80 ? '…' : ''}
            </span>
          </div>
          <Badge tone={row.is_active ? 'success' : 'neutral'}>{row.is_active ? 'Visible' : 'Hidden'}</Badge>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="icon-btn" title="Edit" onClick={() => setEditing({ index, row })}>
              <Pencil size={15} />
            </button>
            <button className="icon-btn" title="Remove" onClick={() => setRemoving(index)}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => setEditing({ index: null, row: newRow(rows.length) })}>
        <Plus size={15} /> Add {rowLabel}
      </Button>

      <RowModal
        open={editing !== null}
        row={editing?.row ?? null}
        onClose={() => setEditing(null)}
        onSave={save}
      />
      <ConfirmDeleteModal
        open={removing !== null}
        itemName={removing !== null ? rows[removing]?.title || `row ${removing + 1}` : ''}
        saving={deleting}
        onCancel={() => setRemoving(null)}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
