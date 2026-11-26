import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Faq, FaqCategory, FaqCategoryInput, FaqInput } from '../../domain/entities/faq';
import { repositories } from '../../data/repositories';
import { useCrud } from '../../application/hooks/useCrud';
import { formatDate } from '../../shared/format';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDeleteModal } from '../components/ui/ConfirmDeleteModal';
import { DataTable, type Column } from '../components/table/DataTable';

type Tab = 'faqs' | 'categories';

function CategoryForm({ open, category, saving, onClose, onSubmit }: {
  open: boolean;
  category: FaqCategory | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: FaqCategoryInput) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? '');
    setError('');
  }, [open, category]);
  const submit = async () => {
    if (!name.trim()) return setError('Category name is required.');
    await onSubmit({ name: name.trim() });
  };
  return <Modal open={open} onClose={onClose} title={category ? 'Edit FAQ category' : 'Add FAQ category'} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={() => void submit()}>{saving ? 'Saving…' : category ? 'Save changes' : 'Create category'}</Button></>}>
    <Field label="Category name"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Shipping" /></Field>
    {error && <div className="form-error"><AlertTriangle size={15} />{error}</div>}
  </Modal>;
}

function FaqForm({ open, faq, categories, saving, onClose, onSubmit }: {
  open: boolean;
  faq: Faq | null;
  categories: FaqCategory[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: FaqInput) => Promise<void>;
}) {
  const [category, setCategory] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open) return;
    setCategory(faq?.category ?? categories[0]?.id ?? '');
    setQuestion(faq?.question ?? '');
    setAnswer(faq?.answer ?? '');
    setError('');
  }, [open, faq, categories]);
  const submit = async () => {
    if (!category || !question.trim() || !answer.trim()) return setError('Category, question, and answer are required.');
    await onSubmit({ category, question: question.trim(), answer: answer.trim() });
  };
  return <Modal open={open} onClose={onClose} title={faq ? 'Edit FAQ' : 'Add FAQ'} width={680} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={saving || categories.length === 0} onClick={() => void submit()}>{saving ? 'Saving…' : faq ? 'Save changes' : 'Create FAQ'}</Button></>}>
    {categories.length === 0 ? <p className="step-note">Create an FAQ category before adding questions.</p> : <div className="stack">
      <Field label="Category"><Select value={category} onChange={(event) => setCategory(event.target.value)} options={categories.map((item) => ({ value: item.id, label: item.name }))} /></Field>
      <Field label="Question"><Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Enter a frequently asked question" /></Field>
      <Field label="Answer"><textarea className="input" rows={7} value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Write the answer" /></Field>
    </div>}
    {error && <div className="form-error"><AlertTriangle size={15} />{error}</div>}
  </Modal>;
}

export function FaqsPage() {
  const categories = useCrud<FaqCategory, FaqCategoryInput>(repositories.faqCategories, 'FAQ category');
  const faqs = useCrud<Faq, FaqInput>(repositories.faqs, 'FAQ');
  const [tab, setTab] = useState<Tab>('faqs');
  const [categoryForm, setCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FaqCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<FaqCategory | null>(null);
  const [faqForm, setFaqForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [deletingFaq, setDeletingFaq] = useState<Faq | null>(null);

  const categoryNames = useMemo(() => new Map(categories.items.map((item) => [item.id, item.name])), [categories.items]);
  const categoryColumns = useMemo<Array<Column<FaqCategory>>>(() => [
    { key: 'name', header: 'Category', sortValue: (item) => item.name.toLowerCase(), render: (item) => <span className="cell-main">{item.name}</span> },
    { key: 'created', header: 'Created', sortValue: (item) => item.created_at, render: (item) => item.created_at ? formatDate(item.created_at) : '—' },
    { key: 'actions', header: '', align: 'right', render: (item) => <div className="row-actions"><button className="icon-btn" title="Edit category" onClick={(event) => { event.stopPropagation(); setEditingCategory(item); setCategoryForm(true); }}><Pencil size={15} /></button><button className="icon-btn danger" title="Delete category" onClick={(event) => { event.stopPropagation(); setDeletingCategory(item); }}><Trash2 size={15} /></button></div> },
  ], []);
  const faqColumns = useMemo<Array<Column<Faq>>>(() => [
    { key: 'question', header: 'Question', sortValue: (item) => item.question.toLowerCase(), render: (item) => <span className="cell-main">{item.question}</span> },
    { key: 'category', header: 'Category', sortValue: (item) => (categoryNames.get(item.category) ?? '').toLowerCase(), render: (item) => categoryNames.get(item.category) ?? 'Unknown category' },
    { key: 'answer', header: 'Answer', render: (item) => <span className="cell-sub">{item.answer}</span> },
    { key: 'updated', header: 'Updated', sortValue: (item) => item.updated_at, render: (item) => item.updated_at ? formatDate(item.updated_at) : '—' },
    { key: 'actions', header: '', align: 'right', render: (item) => <div className="row-actions"><button className="icon-btn" title="Edit FAQ" onClick={(event) => { event.stopPropagation(); setEditingFaq(item); setFaqForm(true); }}><Pencil size={15} /></button><button className="icon-btn danger" title="Delete FAQ" onClick={(event) => { event.stopPropagation(); setDeletingFaq(item); }}><Trash2 size={15} /></button></div> },
  ], [categoryNames]);

  const saveCategory = async (input: FaqCategoryInput) => {
    if (editingCategory) await categories.update(editingCategory.id, input);
    else await categories.create(input);
    setCategoryForm(false);
    setEditingCategory(null);
  };
  const saveFaq = async (input: FaqInput) => {
    if (editingFaq) await faqs.update(editingFaq.id, input);
    else await faqs.create(input);
    setFaqForm(false);
    setEditingFaq(null);
  };

  return <>
    <PageHeader title="FAQs" subtitle={`${faqs.items.length} frequently asked questions · ${categories.items.length} categories`}>
      {tab === 'faqs' ? <Button onClick={() => { setEditingFaq(null); setFaqForm(true); }} disabled={categories.items.length === 0}><Plus size={15} />Add FAQ</Button> : <Button onClick={() => { setEditingCategory(null); setCategoryForm(true); }}><Plus size={15} />Add category</Button>}
    </PageHeader>
    <div className="wizard-tabs" role="tablist" style={{ maxWidth: 520 }}>
      <button type="button" role="tab" aria-selected={tab === 'faqs'} className={`wizard-tab ${tab === 'faqs' ? 'active' : ''}`} onClick={() => setTab('faqs')}><span className="wizard-step-label">FAQs</span></button>
      <button type="button" role="tab" aria-selected={tab === 'categories'} className={`wizard-tab ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}><span className="wizard-step-label">Categories</span></button>
    </div>
    {tab === 'faqs' ? <Card><DataTable data={faqs.items} columns={faqColumns} getRowId={(item) => item.id} getSearchText={(item) => `${item.question} ${item.answer} ${categoryNames.get(item.category) ?? ''}`} searchPlaceholder="Search FAQs…" loading={faqs.loading || categories.loading} emptyTitle="No FAQs yet" emptyDescription="Add questions and answers for your storefront." /></Card> : <Card><DataTable data={categories.items} columns={categoryColumns} getRowId={(item) => item.id} getSearchText={(item) => item.name} searchPlaceholder="Search FAQ categories…" loading={categories.loading} emptyTitle="No FAQ categories yet" emptyDescription="Create a category to organize questions." /></Card>}

    <CategoryForm open={categoryForm} category={editingCategory} saving={categories.saving} onClose={() => setCategoryForm(false)} onSubmit={saveCategory} />
    <FaqForm open={faqForm} faq={editingFaq} categories={categories.items} saving={faqs.saving} onClose={() => setFaqForm(false)} onSubmit={saveFaq} />
    <ConfirmDeleteModal open={Boolean(deletingCategory)} itemName={deletingCategory?.name ?? ''} saving={categories.saving} onCancel={() => setDeletingCategory(null)} onConfirm={() => { if (deletingCategory) { void categories.remove(deletingCategory.id); setDeletingCategory(null); } }} />
    <ConfirmDeleteModal open={Boolean(deletingFaq)} itemName={deletingFaq?.question ?? ''} saving={faqs.saving} onCancel={() => setDeletingFaq(null)} onConfirm={() => { if (deletingFaq) { void faqs.remove(deletingFaq.id); setDeletingFaq(null); } }} />
  </>;
}
