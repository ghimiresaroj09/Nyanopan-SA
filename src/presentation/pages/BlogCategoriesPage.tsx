import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { BlogCategory, BlogCategoryInput } from '../../domain/entities/blog';
import { repositories } from '../../data/repositories';
import { useCrud } from '../../application/hooks/useCrud';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { DataTable, type Column } from '../components/table/DataTable';

function CategoryModal({ open, category, saving, onClose, onSubmit }: {
  open: boolean; category: BlogCategory | null; saving: boolean; onClose: () => void; onSubmit: (input: BlogCategoryInput) => Promise<void>;
}) {
  const [name, setName] = useState('');
  useEffect(() => { if (open) setName(category?.name ?? ''); }, [open, category]);
  return <Modal open={open} onClose={onClose} title={category ? 'Edit blog category' : 'Add blog category'} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={saving || !name.trim()} onClick={() => void onSubmit({ name: name.trim() })}>{saving ? 'Saving…' : category ? 'Save changes' : 'Create category'}</Button></>}>
    <Field label="Category name"><Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Behind the scenes" /></Field>
  </Modal>;
}

export function BlogCategoriesPage() {
  const crud = useCrud<BlogCategory, BlogCategoryInput>(repositories.blogCategories, 'Blog category');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BlogCategory | null>(null);
  const [deleting, setDeleting] = useState<BlogCategory | null>(null);
  const columns = useMemo<Array<Column<BlogCategory>>>(() => [
    { key: 'name', header: 'Category', sortValue: (row) => row.name.toLowerCase(), render: (row) => <span className="cell-main">{row.name}</span> },
    { key: 'blogs_count', header: 'Blogs', align: 'right', sortValue: (row) => row.blogs_count, render: (row) => row.blogs_count },
    { key: 'actions', header: '', align: 'right', render: (row) => <div className="row-actions"><button className="icon-btn" title="Edit category" onClick={(event) => { event.stopPropagation(); setEditing(row); setFormOpen(true); }}><Pencil size={15} /></button><button className="icon-btn danger" title="Delete category" onClick={(event) => { event.stopPropagation(); setDeleting(row); }}><Trash2 size={15} /></button></div> },
  ], []);
  const submit = async (input: BlogCategoryInput) => {
    if (editing) await crud.update(editing.id, input); else await crud.create(input);
    setFormOpen(false); setEditing(null);
  };
  return <>
    <PageHeader title="Blog Categories" subtitle={`${crud.items.length} categories to organize blog posts`}><Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={15} />Add category</Button></PageHeader>
    <Card><DataTable data={crud.items} columns={columns} getRowId={(row) => row.id} getSearchText={(row) => row.name} searchPlaceholder="Search blog categories…" loading={crud.loading} emptyTitle="No blog categories yet" emptyDescription="Create a category to organize blog posts." /></Card>
    <CategoryModal open={formOpen} category={editing} saving={crud.saving} onClose={() => setFormOpen(false)} onSubmit={submit} />
    <ConfirmDeleteModal open={Boolean(deleting)} itemName={deleting?.name ?? ''} saving={crud.saving} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) { void crud.remove(deleting.id); setDeleting(null); } }} />
  </>;
}
