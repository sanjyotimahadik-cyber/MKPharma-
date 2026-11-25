import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

/**
 * Loads GET /api{path} and re-loads when path changes.
 *   const { data, loading, error, reload, setData } = useApi('/products');
 * Pass null as path to skip loading.
 */
export function useApi(path, initial = null) {
  const [state, setState] = useState({ data: initial, loading: path != null, error: null });

  const reload = useCallback(async () => {
    if (path == null) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.get(path);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error }));
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  const setData = useCallback((next) => setState((s) => ({ ...s, data: typeof next === 'function' ? next(s.data) : next })), []);

  return { ...state, reload, setData };
}
