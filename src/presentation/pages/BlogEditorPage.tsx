import { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { BlogInput } from '../../domain/entities/blog';
import { repositories } from '../../data/repositories';
import { useAsync } from '../../application/hooks/useAsync';
import { useToast } from '../../application/toast/ToastProvider';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { Skeleton } from '../components/ui/Skeleton';
import { cn, slugify } from '../../shared/format';
import { ImagePicker } from '../components/cms/SectionEditors';
import { RichTextEditor } from '../components/ui/RichTextEditor';
import { sanitizeHtml } from '../../shared/sanitize';

type Tab = 'blog' | 'seo';
const EMPTY_BLOG: BlogInput = { category: '', title: '', slug: '', excerpt: '', content: '', image: '', image_title: '', image_alt: '', image_caption: '', tags: '', is_featured: false, is_published: false, published_at: '', meta_title: '', meta_description: '', meta_keywords: '', canonical_url: '', og_title: '', og_description: '', og_url: '', og_image: '', meta_robots: 'index, follow' };

const META_ROBOTS_OPTIONS = [
  'index, follow',
  'noindex, follow',
  'index, nofollow',
  'noindex, nofollow',
  'max-image-preview:large',
  'index, follow, max-image-preview:large',
  'noindex, follow, max-image-preview:large',
  'index, nofollow, max-image-preview:large',
  'noindex, nofollow, max-image-preview:large',
];

export function BlogEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isNew = !id || id === 'new';
  const categories = useAsync(() => repositories.blogCategories.list(), []);
  const blog = useAsync(async () => {
    if (isNew || !id) return null;
    return repositories.blogs.get(id);
  }, [id]);
  const [tab, setTab] = useState<Tab>('blog');
  const [draft, setDraft] = useState<BlogInput>(EMPTY_BLOG);
  const [saving, setSaving] = useState(false);
  const [seeded, setSeeded] = useState('');

  useEffect(() => {
    if (categories.data && !draft.category) setDraft((current) => ({ ...current, category: categories.data?.[0]?.id ?? '' }));
  }, [categories.data, draft.category]);
  useEffect(() => {
    if (blog.data && seeded !== blog.data.id) {
      setDraft({ ...blog.data });
      setSeeded(blog.data.id);
    }
  }, [blog.data, seeded]);

  const set = (patch: Partial<BlogInput>) => setDraft((current) => ({ ...current, ...patch }));
  const save = async () => {
    const sanitizedContent = sanitizeHtml(draft.content);
    setSaving(true);
    try {
      if (isNew) {
        if (!draft.category || !draft.title.trim() || !draft.image.trim() || !sanitizedContent.trim()) {
          toast.error('Title, category, image, and content are required.');
          setTab('blog');
          return;
        }
        await repositories.blogs.create({
          ...draft,
          title: draft.title.trim(),
          slug: slugify(draft.title),
          excerpt: draft.excerpt.trim(),
          content: sanitizedContent,
        });
        toast.success('Blog created');
      } else if (id && tab === 'seo') {
        await repositories.blogs.update(id, {
          meta_title: draft.meta_title.trim(),
          meta_description: draft.meta_description.trim(),
          meta_keywords: draft.meta_keywords.trim(),
          canonical_url: draft.canonical_url.trim(),
          meta_robots: draft.meta_robots,
          og_title: draft.og_title.trim(),
          og_description: draft.og_description.trim(),
          og_url: draft.og_url.trim(),
          og_image: draft.og_image.trim(),
        });
        toast.success('Blog SEO updated');
      } else if (id) {
        if (!draft.category || !draft.title.trim() || !draft.image.trim() || !sanitizedContent.trim()) {
          toast.error('Title, category, image, and content are required.');
          setTab('blog');
          return;
        }
        await repositories.blogs.update(id, {
          category: draft.category,
          title: draft.title.trim(),
          slug: slugify(draft.title),
          excerpt: draft.excerpt.trim(),
          image: draft.image,
          image_title: draft.image_title.trim(),
          image_alt: draft.image_alt.trim(),
          image_caption: draft.image_caption.trim(),
          content: sanitizedContent,
          tags: (typeof draft.tags === 'string' ? draft.tags : '').trim(),
          is_featured: draft.is_featured,
          is_published: draft.is_published,
        });
        toast.success('Blog updated');
      }
      navigate('/blogs');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save blog');
    } finally {
      setSaving(false);
    }
  };

  if (categories.loading || (!isNew && blog.loading)) return <><PageHeader title={isNew ? 'Add blog' : 'Edit blog'} /><Skeleton style={{ height: 480 }} /></>;
  if (!isNew && !blog.data && !blog.loading) return <><PageHeader title="Blog not found" /><Card><CardBody><p className="step-note">This blog could not be found.</p><Button variant="secondary" onClick={() => navigate('/blogs')}><ArrowLeft size={15} />Back to blogs</Button></CardBody></Card></>;

  return <>
    <PageHeader title={isNew ? 'Add blog' : 'Edit blog'} subtitle="Manage the post content and search metadata.">
      <Button variant="ghost" onClick={() => navigate('/blogs')}><ArrowLeft size={15} />Back to blogs</Button>
      <Button onClick={() => void save()} disabled={saving}><Save size={15} />{saving ? 'Saving…' : isNew ? 'Create blog' : 'Save changes'}</Button>
    </PageHeader>
    <div className="wizard-tabs" role="tablist" style={{ maxWidth: 560 }}>
      <button type="button" role="tab" aria-selected={tab === 'blog'} className={cn('wizard-tab', tab === 'blog' && 'active')} onClick={() => setTab('blog')}><span className="wizard-step-label">Blog</span></button>
      <button type="button" role="tab" aria-selected={tab === 'seo'} className={cn('wizard-tab', tab === 'seo' && 'active')} disabled={isNew} onClick={() => setTab('seo')}><span className="wizard-step-label">Blog SEO</span></button>
    </div>
    <Card><CardBody><div className="stack" style={{ maxWidth: 860 }}>
      {tab === 'blog' ? <>
        <Field label="Category *"><Select required value={draft.category} onChange={(event) => set({ category: event.target.value })} options={[{ value: '', label: 'Select a category' }, ...(categories.data ?? []).map((item) => ({ value: item.id, label: item.name }))]} /></Field>
        <div className="grid g-half"><Field label="Title *"><Input required value={draft.title} onChange={(event) => set({ title: event.target.value, slug: slugify(event.target.value) })} /></Field><Field label="Slug"><Input value={draft.slug || slugify(draft.title)} readOnly /></Field></div>
        <Field label="Excerpt"><textarea className="input" rows={3} value={draft.excerpt} onChange={(event) => set({ excerpt: event.target.value })} /></Field>
        <Field label="Content *"><RichTextEditor value={draft.content} onChange={(content) => set({ content })} placeholder="Write the blog content…" /></Field>
        <Field label="Image *"><ImagePicker value={draft.image} onChange={(image) => set({ image })} previewSize="large" /></Field>
        <div className="grid g-half"><Field label="Image title"><Input value={draft.image_title} onChange={(event) => set({ image_title: event.target.value })} /></Field><Field label="Image alt text"><Input value={draft.image_alt} onChange={(event) => set({ image_alt: event.target.value })} /></Field></div>
        <Field label="Image caption"><Input value={draft.image_caption} onChange={(event) => set({ image_caption: event.target.value })} /></Field>
        <Field label="Tags"><Input value={draft.tags} onChange={(event) => set({ tags: event.target.value })} placeholder="Separate tags with commas" /></Field>
        <div className="grid g-half"><div className="switch-row"><span className="cell-main">Is featured</span><Switch checked={draft.is_featured} onChange={(value) => set({ is_featured: value })} label="Is featured" /></div><div className="switch-row"><span className="cell-main">Is published</span><Switch checked={draft.is_published} onChange={(value) => set({ is_published: value })} label="Is published" /></div></div>
      </> : <>
        <p className="step-note">Search metadata for this blog post.</p>
        <Field label="Meta title"><Input value={draft.meta_title} onChange={(event) => set({ meta_title: event.target.value })} placeholder={draft.title} /></Field>
        <Field label="Meta description"><textarea className="input" rows={3} value={draft.meta_description} onChange={(event) => set({ meta_description: event.target.value })} placeholder={draft.excerpt} /></Field>
        <Field label="Meta keywords"><Input value={draft.meta_keywords} onChange={(event) => set({ meta_keywords: event.target.value })} placeholder="Separate keywords with commas" /></Field>
        <Field label="Canonical URL"><Input value={draft.canonical_url} onChange={(event) => set({ canonical_url: event.target.value })} placeholder="https://…" /></Field>
        <div className="account-divider" />
        <h3 className="card-title">Open Graph</h3>
        <div className="grid g-half"><Field label="OG title"><Input value={draft.og_title} onChange={(event) => set({ og_title: event.target.value })} /></Field><Field label="OG URL"><Input value={draft.og_url} onChange={(event) => set({ og_url: event.target.value })} placeholder="https://…" /></Field></div>
        <Field label="OG description"><textarea className="input" rows={3} value={draft.og_description} onChange={(event) => set({ og_description: event.target.value })} /></Field>
        <Field label="OG image"><ImagePicker value={draft.og_image} onChange={(og_image) => set({ og_image })} previewSize="large" /></Field>
        <Field label="Meta robots"><Select value={draft.meta_robots} onChange={(event) => set({ meta_robots: event.target.value })} options={META_ROBOTS_OPTIONS.map((value) => ({ value, label: value }))} /></Field>
      </>}
      <div className="step-actions"><Button variant="secondary" onClick={() => setTab(tab === 'blog' ? 'seo' : 'blog')}>{tab === 'blog' ? 'Continue to Blog SEO' : 'Back to blog details'}</Button></div>
    </div></CardBody></Card>
  </>;
}
