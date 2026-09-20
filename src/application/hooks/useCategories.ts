import { useCallback, useState } from 'react';
import { repositories } from '../../data/repositories';
import { useAsync } from './useAsync';
import { useToast } from '../toast/ToastProvider';

/**
 * Category CRUD with multipart/form-data payloads
 * (name, description, optional image file).
 */
export function useCategories() {
  const { data, loading, error, reload } = useAsync(() => repositories.categories.list(), []);
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const create = useCallback(
    async (form: FormData) => {
      setSaving(true);
      try {
        await repositories.categories.create(form);
        toast.success('Category created');
        await reload();
      } catch {
        toast.error('Could not create category');
      } finally {
        setSaving(false);
      }
    },
    [reload, toast],
  );

  const update = useCallback(
    async (id: string, form: FormData) => {
      setSaving(true);
      try {
        await repositories.categories.update(id, form);
        toast.success('Category updated');
        await reload();
      } catch {
        toast.error('Could not update category');
      } finally {
        setSaving(false);
      }
    },
    [reload, toast],
  );

  const remove = useCallback(
    async (id: string) => {
      setSaving(true);
      try {
        await repositories.categories.remove(id);
        toast.success('Category deleted');
        await reload();
      } catch {
        toast.error('Could not delete category');
      } finally {
        setSaving(false);
      }
    },
    [reload, toast],
  );

  return { items: data ?? [], loading, error, reload, create, update, remove, saving };
}
