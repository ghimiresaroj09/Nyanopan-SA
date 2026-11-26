import { repositories } from '../../data/repositories';
import { useAsync } from './useAsync';

export function useAnalytics() {
  const { data, loading, error } = useAsync(() => repositories.analytics.dashboard(30), []);
  return { snapshot: data, loading, error };
}
