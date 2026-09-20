import { useCallback, useState } from 'react';
import type { CrudRepository } from '../../domain/repositories';
import { ApiError } from '../../data/api/client';
import { useAsync } from './useAsync';
import { useToast } from '../toast/ToastProvider';

/** Backend message when available, generic fallback otherwise. */
function feedback(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/**
 * Generic create/read/update/delete hook over any CrudRepository,
 * with saving state and toast feedback baked in.
 */
export function useCrud<T extends { id: string }, I extends object>(
  repo: CrudRepository<T, I>,
  label: string,
) {
  const { data, loading, error, reload } = useAsync(() => repo.list(), []);
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const create = useCallback(
    async (input: I) => {
      setSaving(true);
      try {
        await repo.create(input);
        toast.success(`${label} created`);
        await reload();
      } catch (err) {
        toast.error(feedback(err, `Could not create ${label.toLowerCase()}`));
      } finally {
        setSaving(false);
      }
    },
    [repo, label, reload, toast],
  );

  const update = useCallback(
    async (id: string, patch: Partial<I>) => {
      setSaving(true);
      try {
        await repo.update(id, patch);
        toast.success(`${label} updated`);
        await reload();
      } catch (err) {
        toast.error(feedback(err, `Could not update ${label.toLowerCase()}`));
      } finally {
        setSaving(false);
      }
    },
    [repo, label, reload, toast],
  );

  const remove = useCallback(
    async (id: string) => {
      setSaving(true);
      try {
        await repo.remove(id);
        toast.success(`${label} deleted`);
        await reload();
      } catch (err) {
        toast.error(feedback(err, `Could not delete ${label.toLowerCase()}`));
      } finally {
        setSaving(false);
      }
    },
    [repo, label, reload, toast],
  );

  return { items: data ?? [], loading, error, reload, create, update, remove, saving };
}
