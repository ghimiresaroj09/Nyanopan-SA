import { repositories } from '../../data/repositories';
import { useAsync } from './useAsync';

export function useAnalytics() {
  const { data, loading, error } = useAsync(() => repositories.analytics.snapshot(), []);
  return { snapshot: data, loading, error };
}
