import { useEffect, useState } from 'react';
import { Pencil, Plus, Save, Trash2 } from 'lucide-react';
import type {
  CollectionRow,
  FeatureRow,
  HeroSectionData,
  HeroSectionImage,
  HomepageCollectionsData,
  HomepageData,
} from '../../domain/entities/homepage';
import { repositories } from '../../data/repositories';
import { useAsync } from '../../application/hooks/useAsync';
import { useToast } from '../../application/toast/ToastProvider';
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
import { ImagePicker } from '../components/cms/SectionEditors';

type Tab = 'hero' | 'homepage' | 'collections';

const TABS: { id: Tab; label: string }[] = [
  { id: 'hero', label: 'Hero Section' },
  { id: 'homepage', label: 'Homepage' },
  { id: 'collections', label: 'Collections' },
];

/* ---------------- Tab: Hero Section ---------------- */

const newHeroImage = (sortOrder: number): HeroSectionImage => ({
  image: '',
  image_caption: '',
  sort_order: sortOrder,
  is_active: true,
});

function HeroSectionTab() {
  const toast = useToast();
  const load = useAsync(() => repositories.heroSection.get(), []);
  const [draft, setDraft] = useState<HeroSectionData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(null), [load.data]);

  const data = draft ?? load.data;
  const dirty = draft !== null;

  const set = (patch: Partial<HeroSectionData>) => {
    if (!data) return;
    setDraft({ ...data, ...patch });
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await repositories.heroSection.save(data);
      setDraft(null);
      toast.success('Hero section saved.');
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
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button disabled={!dirty || saving} onClick={() => void save()}>
          <Save size={15} /> {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </Button>
      </div>

      <Card>
        <CardHeader title="Hero copy" subtitle="Main headline, description and supporting text" />
        <CardBody>
          <div className="form-grid">
            <Field label="Title one">
              <Input value={data.title_one} onChange={(e) => set({ title_one: e.target.value })} />
            </Field>
            <Field label="Title two">
              <Input value={data.title_two} onChange={(e) => set({ title_two: e.target.value })} />
            </Field>
            <div className="span-2">
              <Field label="Short description">
                <textarea
                  className="input"
                  rows={3}
                  value={data.short_desc}
                  onChange={(e) => set({ short_desc: e.target.value })}
                />
              </Field>
            </div>
            {data.texts.map((text, index) => (
              <Field key={`hero-text-${index}`} label={`Text ${index + 1}`}>
                <Input
                  value={text}
                  onChange={(e) =>
                    set({ texts: data.texts.map((item, i) => (i === index ? e.target.value : item)) })
                  }
                />
              </Field>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Hero images" subtitle="Images shown in the hero section, ordered by sort value" />
        <CardBody>
          {data.images.length === 0 && <p className="step-note">No hero images yet — add the first one.</p>}
          {data.images.map((image, index) => (
            <div key={`hero-image-${index}`} className="content-row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="form-grid">
                  <div className="span-2">
                    <Field label={`Image ${index + 1}`}>
                      <ImagePicker
                        value={image.image}
                        onChange={(value) =>
                          set({
                            images: data.images.map((item, i) =>
                              i === index ? { ...item, image: value } : item,
                            ),
                          })
                        }
                      />
                    </Field>
                  </div>
                  <Field label="Image caption">
                    <Input
                      value={image.image_caption}
                      onChange={(e) =>
                        set({
                          images: data.images.map((item, i) =>
                            i === index ? { ...item, image_caption: e.target.value } : item,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label="Sort order">
                    <Input
                      type="number"
                      value={image.sort_order}
                      onChange={(e) =>
                        set({
                          images: data.images.map((item, i) =>
                            i === index ? { ...item, sort_order: Number(e.target.value) } : item,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label="Visible">
                    <Switch
                      checked={image.is_active}
                      onChange={(is_active) =>
                        set({
                          images: data.images.map((item, i) =>
                            i === index ? { ...item, is_active } : item,
                          ),
                        })
                      }
                    />
                  </Field>
                </div>
              </div>
              <button
                type="button"
                className="icon-btn"
                title="Remove image"
                aria-label={`Remove image ${index + 1}`}
                onClick={() => set({ images: data.images.filter((_, i) => i !== index) })}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => set({ images: [...data.images, newHeroImage(data.images.length)] })}
          >
            <Plus size={15} /> Add image
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

/* ---------------- Tab: Homepage ---------------- */

function FeatureModal({
  open,
  row,
  onClose,
  onSave,
}: {
  open: boolean;
  row: FeatureRow | null;
  onClose: () => void;
  onSave: (row: FeatureRow) => void;
}) {
  const [form, setForm] = useState<FeatureRow>({ title: '', intro: '' });
  useEffect(() => {
    if (open) setForm(row ?? { title: '', intro: '' });
  }, [open, row]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={row ? 'Edit feature' : 'Add feature'}
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!form.title.trim() || !form.intro.trim()} onClick={() => onSave(form)}>
            {row ? 'Save changes' : 'Add feature'}
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
          <Field label="Intro">
            <textarea
              className="input"
              rows={3}
              value={form.intro}
              onChange={(e) => setForm({ ...form, intro: e.target.value })}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function FeatureList({
  rows,
  onChange,
}: {
  rows: FeatureRow[];
  onChange: (next: FeatureRow[]) => void;
}) {
  const [editing, setEditing] = useState<{ index: number | null; row: FeatureRow | null } | null>(null);

  const save = (row: FeatureRow) => {
    if (!editing) return;
    const next = [...rows];
    if (editing.index === null) next.push(row);
    else next[editing.index] = row;
    onChange(next);
    setEditing(null);
  };

  return (
    <div>
      {rows.length === 0 && <p className="step-note">No features yet — add the first one.</p>}
      {rows.map((row, index) => (
        <div key={`feature-${index}`} className="content-row">
          <div className="cell-stack">
            <span className="cell-main">{row.title}</span>
            <span className="cell-sub">
              {row.intro.slice(0, 90)}
              {row.intro.length > 90 ? '…' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="icon-btn" title="Edit" onClick={() => setEditing({ index, row })}>
              <Pencil size={15} />
            </button>
            <button
              className="icon-btn"
              title="Remove"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => setEditing({ index: null, row: null })}>
        <Plus size={15} /> Add feature
      </Button>
      <FeatureModal
        open={editing !== null}
        row={editing?.row ?? null}
        onClose={() => setEditing(null)}
        onSave={save}
      />
    </div>
  );
}

function HomepageTab() {
  const toast = useToast();
  const load = useAsync(() => repositories.homepage.get(), []);
  const [draft, setDraft] = useState<HomepageData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(null), [load.data]);

  const data = draft ?? load.data;
  const dirty = draft !== null;

  const set = (patch: Partial<HomepageData>) => {
    if (!data) return;
    setDraft({ ...data, ...patch });
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await repositories.homepage.save(data);
      setDraft(null);
      toast.success('Homepage saved.');
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
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button disabled={!dirty || saving} onClick={() => void save()}>
          <Save size={15} /> {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </Button>
      </div>

      <Card>
        <CardHeader title="Section 1" subtitle="Hero block" />
        <CardBody>
          <div className="form-grid">
            <Field label="Tag">
              <Input
                value={data.section1.tag}
                onChange={(e) => set({ section1: { ...data.section1, tag: e.target.value } })}
              />
            </Field>
            <Field label="Title">
              <Input
                value={data.section1.title}
                onChange={(e) => set({ section1: { ...data.section1, title: e.target.value } })}
              />
            </Field>
            <div className="span-2">
              <Field label="Description">
                <textarea
                  className="input"
                  rows={3}
                  value={data.section1.description}
                  onChange={(e) => set({ section1: { ...data.section1, description: e.target.value } })}
                />
              </Field>
            </div>
            <div className="span-2">
              <Field label="Quote">
                <textarea
                  className="input"
                  rows={2}
                  value={data.section1.quote}
                  onChange={(e) => set({ section1: { ...data.section1, quote: e.target.value } })}
                />
              </Field>
            </div>
            <div className="span-2">
              <Field label="Image">
                <ImagePicker
                  value={data.section1.image}
                  onChange={(image) => set({ section1: { ...data.section1, image } })}
                />
              </Field>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Section 2" subtitle="Content block with features" />
        <CardBody>
          <div className="form-grid">
            <Field label="Tag">
              <Input
                value={data.section2.tag}
                onChange={(e) => set({ section2: { ...data.section2, tag: e.target.value } })}
              />
            </Field>
            <Field label="Title">
              <Input
                value={data.section2.title}
                onChange={(e) => set({ section2: { ...data.section2, title: e.target.value } })}
              />
            </Field>
            <div className="span-2">
              <Field label="Description">
                <textarea
                  className="input"
                  rows={3}
                  value={data.section2.description}
                  onChange={(e) => set({ section2: { ...data.section2, description: e.target.value } })}
                />
              </Field>
            </div>
            <div className="span-2">
              <Field label="Image">
                <ImagePicker
                  value={data.section2.image}
                  onChange={(image) => set({ section2: { ...data.section2, image } })}
                />
              </Field>
            </div>
          </div>
          <FeatureList
            rows={data.section2.feature}
            onChange={(feature) => set({ section2: { ...data.section2, feature } })}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Section 3" subtitle="Closing block" />
        <CardBody>
          <div className="form-grid">
            <Field label="Tag">
              <Input
                value={data.section3.tag}
                onChange={(e) => set({ section3: { ...data.section3, tag: e.target.value } })}
              />
            </Field>
            <Field label="Title">
              <Input
                value={data.section3.title}
                onChange={(e) => set({ section3: { ...data.section3, title: e.target.value } })}
              />
            </Field>
            <div className="span-2">
              <Field label="Description">
                <textarea
                  className="input"
                  rows={3}
                  value={data.section3.description}
                  onChange={(e) => set({ section3: { ...data.section3, description: e.target.value } })}
                />
              </Field>
            </div>
            <div className="span-2">
              <Field label="Image">
                <ImagePicker
                  value={data.section3.image}
                  onChange={(image) => set({ section3: { ...data.section3, image } })}
                />
              </Field>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/* ---------------- Tab: Collections ---------------- */

const newCollection = (sortOrder: number): CollectionRow => ({
  name: '',
  intro: '',
  link: '',
  image: '',
  sort_order: sortOrder,
  is_active: true,
});

function CollectionModal({
  open,
  row,
  onClose,
  onSave,
}: {
  open: boolean;
  row: CollectionRow | null;
  onClose: () => void;
  onSave: (row: CollectionRow) => void;
}) {
  const [form, setForm] = useState<CollectionRow>(row ?? newCollection(0));
  useEffect(() => {
    if (open) setForm(row ?? newCollection(0));
  }, [open, row]);

  const valid = form.name.trim() && form.intro.trim() && form.link.trim();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={row?.id ? 'Edit collection' : 'Add collection'}
      width={620}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={() => onSave(form)}>
            {row?.id ? 'Save changes' : 'Add collection'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Name">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Link (internal path)">
          <Input
            value={form.link}
            placeholder="/inside"
            onChange={(e) => setForm({ ...form, link: e.target.value })}
          />
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

function CollectionsTab() {
  const toast = useToast();
  const load = useAsync(() => repositories.homepageCollections.get(), []);
  const [draft, setDraft] = useState<HomepageCollectionsData | null>(null);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<{ index: number | null; row: CollectionRow } | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  useEffect(() => setDraft(null), [load.data]);

  const data = draft ?? load.data;
  const dirty = draft !== null;

  const set = (patch: Partial<HomepageCollectionsData>) => {
    if (!data) return;
    setDraft({ ...data, ...patch });
  };

  const saveRow = (row: CollectionRow) => {
    if (!editing || !data) return;
    const next = [...data.collections];
    if (editing.index === null) next.push(row);
    else next[editing.index] = row;
    set({ collections: next });
    setEditing(null);
  };

  const removeRow = () => {
    if (removing === null || !data) return;
    set({ collections: data.collections.filter((_, i) => i !== removing) });
    setRemoving(null);
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await repositories.homepageCollections.save(data);
      setDraft(null);
      toast.success('Collections saved.');
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
          title="Section header"
          subtitle="Tag, title and description above the collections grid"
          actions={
            <Button disabled={!dirty || saving} onClick={() => void save()}>
              <Save size={15} /> {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
            </Button>
          }
        />
        <CardBody>
          <div className="form-grid">
            <Field label="Tag / label">
              <Input value={data.tag} placeholder="Collections" onChange={(e) => set({ tag: e.target.value })} />
            </Field>
            <Field label="Title">
              <Input value={data.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <div className="span-2">
              <Field label="Description">
                <textarea
                  className="input"
                  rows={3}
                  value={data.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </Field>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Collections" subtitle="Shown on the home page in sort order" />
        <CardBody>
          {data.collections.length === 0 && (
            <p className="step-note">No collections yet — add the first one.</p>
          )}
          {data.collections.map((row, index) => (
            <div key={row.id ?? `new-${index}`} className="content-row">
              {row.image ? (
                <span className="img-thumb">
                  <img src={row.image} alt="" />
                </span>
              ) : null}
              <div className="cell-stack">
                <span className="cell-main">{row.name || '(unnamed)'}</span>
                <span className="cell-sub">
                  {row.link || 'no link'} · {row.intro.slice(0, 70)}
                  {row.intro.length > 70 ? '…' : ''}
                </span>
              </div>
              <Badge tone={row.is_active ? 'success' : 'neutral'}>
                {row.is_active ? 'Visible' : 'Hidden'}
              </Badge>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing({ index: null, row: newCollection(data.collections.length) })}
          >
            <Plus size={15} /> Add collection
          </Button>
        </CardBody>
      </Card>

      <CollectionModal
        open={editing !== null}
        row={editing?.row ?? null}
        onClose={() => setEditing(null)}
        onSave={saveRow}
      />
      <ConfirmDeleteModal
        open={removing !== null}
        itemName={removing !== null ? data.collections[removing]?.name || `collection ${removing + 1}` : ''}
        saving={false}
        onCancel={() => setRemoving(null)}
        onConfirm={removeRow}
      />
    </div>
  );
}

/* ---------------- Page ---------------- */

export function HomePage() {
  const [tab, setTab] = useState<Tab>('homepage');

  return (
    <div className="page">
      <PageHeader
        crumb="CMS"
        title="Home Page"
        subtitle="Storefront home page sections and collections"
      />
      <div className="wizard-tabs" role="tablist" style={{ maxWidth: 720 }}>
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={cn('wizard-tab', tab === entry.id && 'active')}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      {tab === 'hero' && <HeroSectionTab key="hero" />}
      {tab === 'homepage' && <HomepageTab key="homepage" />}
      {tab === 'collections' && <CollectionsTab key="collections" />}
    </div>
  );
}
