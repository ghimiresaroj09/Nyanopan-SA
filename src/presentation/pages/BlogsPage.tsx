import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Blog, BlogCategory, BlogInput } from '../../domain/entities/blog';
import { repositories } from '../../data/repositories';
import { useCrud } from '../../application/hooks/useCrud';
import { formatDate } from '../../shared/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { DataTable, type Column } from '../components/table/DataTable';

export function BlogsPage() {
  const navigate = useNavigate();
  const blogs = useCrud<Blog, BlogInput>(repositories.blogs, 'Blog');
  const categories = useCrud<BlogCategory, { name: string }>(repositories.blogCategories, 'Blog category');
  const categoryNames = useMemo(() => new Map(categories.items.map((category) => [category.id, category.name])), [categories.items]);
  const columns = useMemo<Array<Column<Blog>>>(() => [
    { key: 'image', header: 'Image', render: (blog) => blog.image ? <img className="row-thumb" src={blog.image} alt={blog.image_alt || blog.title} title={blog.image_title || blog.title} /> : <span className="row-thumb row-thumb-fallback">—</span> },
    { key: 'title', header: 'Blog', sortValue: (blog) => blog.title.toLowerCase(), render: (blog) => <div className="cell-stack"><span className="cell-main">{blog.title}</span><span className="cell-sub">/{blog.slug}</span></div> },
    { key: 'category', header: 'Category', sortValue: (blog) => (categoryNames.get(blog.category) ?? blog.category_name).toLowerCase(), render: (blog) => categoryNames.get(blog.category) ?? blog.category_name ?? 'Uncategorized' },
    { key: 'featured', header: 'Featured', sortValue: (blog) => Number(blog.is_featured), render: (blog) => blog.is_featured ? 'Yes' : '—' },
    { key: 'status', header: 'Status', sortValue: (blog) => blog.is_published ? 1 : 0, render: (blog) => <span className="cell-sub">{blog.is_published ? 'Published' : 'Draft'}</span> },
    { key: 'views', header: 'Views', align: 'right', sortValue: (blog) => blog.views, render: (blog) => blog.views.toLocaleString() },
    { key: 'updated', header: 'Updated', sortValue: (blog) => blog.updated_at, render: (blog) => blog.updated_at ? formatDate(blog.updated_at) : '—' },
    { key: 'actions', header: '', align: 'right', render: (blog) => <div className="row-actions"><button className="icon-btn" title="Edit blog" onClick={(event) => { event.stopPropagation(); navigate(`/blogs/${blog.id}/edit`); }}><Pencil size={15} /></button><button className="icon-btn danger" title="Delete blog" onClick={(event) => { event.stopPropagation(); setDeleting(blog); }}><Trash2 size={15} /></button></div> },
  ], [categoryNames, navigate]);
  const [deleting, setDeleting] = useState<Blog | null>(null);

  return <>
    <PageHeader title="Blogs" subtitle={`${blogs.items.length} blog posts`}>
      <Button onClick={() => navigate('/blogs/new')} disabled={categories.items.length === 0}><Plus size={15} />Add blog</Button>
    </PageHeader>
    {categories.items.length === 0 && !categories.loading && <p className="step-note">Create a blog category before adding blog posts.</p>}
    <Card><DataTable data={blogs.items} columns={columns} getRowId={(blog) => blog.id} getSearchText={(blog) => `${blog.title} ${blog.slug} ${blog.excerpt} ${blog.tags} ${categoryNames.get(blog.category) ?? blog.category_name}`} searchPlaceholder="Search blogs…" loading={blogs.loading || categories.loading} emptyTitle="No blogs yet" emptyDescription="Create a blog post to publish it on your storefront." onRowClick={(blog) => navigate(`/blogs/${blog.id}/edit`)} /></Card>
    <ConfirmDeleteModal open={Boolean(deleting)} itemName={deleting?.title ?? ''} saving={blogs.saving} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) { void blogs.remove(deleting.id); setDeleting(null); } }} />
  </>;
}
