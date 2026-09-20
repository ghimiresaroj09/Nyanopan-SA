import { useEffect, useState } from 'react';
import { Pencil, Plus, Save, Trash2 } from 'lucide-react';
import type {
  ContentPage,
  StoryData,
  SubsectionRow,
  SustainabilityData,
  TeamMember,
  TeamMemberInput,
} from '../../domain/entities/story';
import { repositories } from '../../data/repositories';
import { useAsync } from '../../application/hooks/useAsync';
import { useToast } from '../../application/toast/ToastProvider';
import { sanitizeHtml } from '../../shared/sanitize';
import { cn } from '../../shared/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Switch } from '../components/ui/Switch';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { RichTextEditor } from '../components/ui/RichTextEditor';
import { ImagePicker, RowList, SectionFields } from '../components/cms/SectionEditors';

type Tab = 'story' | 'makers' | 'sustainability';

const TABS: { id: Tab; label: string }[] = [
  { id: 'story', label: 'Our Story' },
  { id: 'makers', label: 'Our Makers' },
  { id: 'sustainability', label: 'Sustainability' },
];

/* ---------------- Shared bits ---------------- */

function TabBar({ tab, onChange }: { tab: Tab; onChange: (next: Tab) => void }) {
  return (
    <div className="wizard-tabs" role="tablist" style={{ maxWidth: 720 }}>
      {TABS.map((entry) => (
        <button
          key={entry.id}
          type="button"
          role="tab"
          aria-selected={tab === entry.id}
          className={cn('wizard-tab', tab === entry.id && 'active')}
          onClick={() => onChange(entry.id)}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Tab: Our Story ---------------- */

function StoryTab() {
  const toast = useToast();
  const load = useAsync(() => repositories.story.get(), []);
  const [draft, setDraft] = useState<StoryData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(null), [load.data]);

  const data = draft ?? load.data;
  const dirty = draft !== null;

  const set = (patch: Partial<StoryData>) => {
    if (!data) return;
    setDraft({ ...data, ...patch });
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await repositories.story.save({ ...data, description: sanitizeHtml(data.description) });
      setDraft(null);
      toast.success('Our Story saved.');
      load.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (load.error) return <p className="step-note">{load.error}</p>;
  if (!data) return <p className="step-note">Loading…</p>;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card>
        <CardHeader
          title="Page header"
          subtitle="Title and introduction shown at the top of the page"
          actions={
            <Button disabled={!dirty || saving} onClick={() => void save()}>
              <Save size={15} /> {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
            </Button>
          }
        />
        <CardBody>
          <div className="form-grid">
            <div className="span-2">
              <Field label="Page title">
                <Input value={data.title} onChange={(e) => set({ title: e.target.value })} />
              </Field>
            </div>
            <div className="span-2">
              <Field label="Introduction">
                <RichTextEditor value={data.description} onChange={(description) => set({ description })} />
              </Field>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Section 1" subtitle="First content block" />
        <CardBody>
          <SectionFields section={data.section1} onChange={(section1) => set({ section1 })} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Section 2" subtitle="Second content block" />
        <CardBody>
          <SectionFields section={data.section2} onChange={(section2) => set({ section2 })} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={data.section3.title || 'Section 3'} subtitle="Timeline / subsections" />
        <CardBody>
          <div className="form-grid">
            <div className="span-2">
              <Field label="Section title">
                <Input
                  value={data.section3.title}
                  onChange={(e) => set({ section3: { ...data.section3, title: e.target.value } })}
                />
              </Field>
            </div>
          </div>
          <RowList
            rows={data.section3.subsections}
            rowLabel="subsection"
            onChange={(subsections: SubsectionRow[]) => set({ section3: { ...data.section3, subsections } })}
          />
        </CardBody>
      </Card>
    </div>
  );
}

/* ---------------- Tab: Sustainability ---------------- */

function SustainabilityTab() {
  const toast = useToast();
  const load = useAsync(() => repositories.sustainability.get(), []);
  const [draft, setDraft] = useState<SustainabilityData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(null), [load.data]);

  const data = draft ?? load.data;
  const dirty = draft !== null;

  const set = (patch: Partial<SustainabilityData>) => {
    if (!data) return;
    setDraft({ ...data, ...patch });
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await repositories.sustainability.save({ ...data, description: sanitizeHtml(data.description) });
      setDraft(null);
      toast.success('Sustainability saved.');
      load.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (load.error) return <p className="step-note">{load.error}</p>;
  if (!data) return <p className="step-note">Loading…</p>;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card>
        <CardHeader
          title="Page header"
          subtitle="Title and introduction for the sustainability page"
          actions={
            <Button disabled={!dirty || saving} onClick={() => void save()}>
              <Save size={15} /> {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
            </Button>
          }
        />
        <CardBody>
          <div className="form-grid">
            <div className="span-2">
              <Field label="Page title">
                <Input value={data.title} onChange={(e) => set({ title: e.target.value })} />
              </Field>
            </div>
            <div className="span-2">
              <Field label="Introduction">
                <RichTextEditor value={data.description} onChange={(description) => set({ description })} />
              </Field>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Sustainability sections" subtitle="Ordered blocks with image and text" />
        <CardBody>
          <RowList rows={data.sections} rowLabel="section" onChange={(sections) => set({ sections })} />
        </CardBody>
      </Card>
    </div>
  );
}

/* ---------------- Tab: Our Makers ---------------- */

function MemberModal({
  open,
  member,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  member: TeamMember | null;
  saving: boolean;
  onClose: () => void;
  onSave: (input: TeamMemberInput) => void;
}) {
  const empty: TeamMemberInput = { name: '', role: '', intro: '', image: '', sort_order: 0, is_active: true };
  const [form, setForm] = useState<TeamMemberInput>(empty);

  useEffect(() => {
    if (!open) return;
    setForm(
      member
        ? {
            name: member.name,
            role: member.role,
            intro: member.intro,
            image: member.image,
            sort_order: member.sort_order,
            is_active: member.is_active,
          }
        : empty,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={member ? 'Edit maker' : 'Add maker'}
      width={620}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving || !form.name.trim() || !form.role.trim() || !form.intro.trim()} onClick={() => onSave(form)}>
            {saving ? 'Saving…' : member ? 'Save changes' : 'Add maker'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Name">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Role">
          <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        </Field>
        <div className="span-2">
          <Field label="Introduction">
            <textarea
              className="input"
              rows={3}
              value={form.intro}
              onChange={(e) => setForm({ ...form, intro: e.target.value })}
            />
          </Field>
        </div>
        <div className="span-2">
          <Field label="Photo">
            <ImagePicker value={form.image ?? ''} onChange={(image) => setForm({ ...form, image })} />
          </Field>
        </div>
        <Field label="Sort order">
          <Input
            type="number"
            value={form.sort_order ?? 0}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
          />
        </Field>
        <Field label="Visible">
          <Switch checked={form.is_active ?? true} onChange={(is_active) => setForm({ ...form, is_active })} />
        </Field>
      </div>
    </Modal>
  );
}

function MakersTab() {
  const toast = useToast();
  const head = useAsync(() => repositories.makers.getHead(), []);
  const members = useAsync(() => repositories.makers.listMembers(), []);

  const [headDraft, setHeadDraft] = useState<ContentPage | null>(null);
  const [savingHead, setSavingHead] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [savingMember, setSavingMember] = useState(false);
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setHeadDraft(null), [head.data]);

  const headData = headDraft ?? head.data;
  const headDirty = headDraft !== null;

  const saveHead = async () => {
    if (!headData) return;
    setSavingHead(true);
    try {
      await repositories.makers.saveHead({ ...headData, description: sanitizeHtml(headData.description) });
      setHeadDraft(null);
      toast.success('Makers page saved.');
      head.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSavingHead(false);
    }
  };

  const saveMember = async (input: TeamMemberInput) => {
    setSavingMember(true);
    try {
      if (editingMember) {
        await repositories.makers.updateMember(editingMember.id, input);
        toast.success('Maker updated.');
      } else {
        await repositories.makers.createMember(input);
        toast.success('Maker added.');
      }
      setModalOpen(false);
      setEditingMember(null);
      members.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSavingMember(false);
    }
  };

  const confirmRemove = async () => {
    if (!removingMember) return;
    setDeleting(true);
    try {
      await repositories.makers.removeMember(removingMember.id);
      toast.success('Maker removed.');
      setRemovingMember(null);
      members.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card>
        <CardHeader
          title="Page header"
          subtitle="Title and introduction for the makers page"
          actions={
            <Button disabled={!headDirty || savingHead || !headData} onClick={() => void saveHead()}>
              <Save size={15} /> {savingHead ? 'Saving…' : headDirty ? 'Save changes' : 'Saved'}
            </Button>
          }
        />
        <CardBody>
          {headData ? (
            <div className="form-grid">
              <div className="span-2">
                <Field label="Page title">
                  <Input value={headData.title} onChange={(e) => setHeadDraft({ ...headData, title: e.target.value })} />
                </Field>
              </div>
              <div className="span-2">
                <Field label="Introduction">
                  <RichTextEditor
                    value={headData.description}
                    onChange={(description) => setHeadDraft({ ...headData, description })}
                  />
                </Field>
              </div>
            </div>
          ) : (
            <p className="step-note">{head.error ?? 'Loading…'}</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Team members"
          subtitle="Shown on the storefront in sort order"
          actions={
            <Button
              size="sm"
              onClick={() => {
                setEditingMember(null);
                setModalOpen(true);
              }}
            >
              <Plus size={15} /> Add maker
            </Button>
          }
        />
        <CardBody>
          {members.error && <p className="step-note">{members.error}</p>}
          {!members.error && (members.data ?? []).length === 0 && (
            <p className="step-note">No makers yet — add the first one.</p>
          )}
          {(members.data ?? []).map((member) => (
            <div key={member.id} className="content-row">
              {member.image ? (
                <span className="img-thumb">
                  <img src={member.image} alt="" />
                </span>
              ) : null}
              <div className="cell-stack">
                <span className="cell-main">{member.name}</span>
                <span className="cell-sub">
                  {member.role} · {member.intro.slice(0, 70)}
                  {member.intro.length > 70 ? '…' : ''}
                </span>
              </div>
              <Badge tone={member.is_active ? 'success' : 'neutral'}>
                {member.is_active ? 'Visible' : 'Hidden'}
              </Badge>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="icon-btn"
                  title="Edit"
                  onClick={() => {
                    setEditingMember(member);
                    setModalOpen(true);
                  }}
                >
                  <Pencil size={15} />
                </button>
                <button className="icon-btn" title="Delete" onClick={() => setRemovingMember(member)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <MemberModal
        open={modalOpen}
        member={editingMember}
        saving={savingMember}
        onClose={() => {
          setModalOpen(false);
          setEditingMember(null);
        }}
        onSave={(input) => void saveMember(input)}
      />
      <ConfirmDeleteModal
        open={removingMember !== null}
        itemName={removingMember?.name ?? ''}
        saving={deleting}
        onCancel={() => setRemovingMember(null)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}

/* ---------------- Page ---------------- */

export function StoryPage() {
  const [tab, setTab] = useState<Tab>('story');

  return (
    <div className="page">
      <PageHeader
        crumb="CMS"
        title="Our Story & Sustainability"
        subtitle="Storefront content for the story, makers and sustainability pages"
      />
      <TabBar tab={tab} onChange={setTab} />
      {tab === 'story' && <StoryTab key="story" />}
      {tab === 'makers' && <MakersTab key="makers" />}
      {tab === 'sustainability' && <SustainabilityTab key="sustainability" />}
    </div>
  );
}
