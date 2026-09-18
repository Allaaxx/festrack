import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router';

import { getStoredFiltersKey } from '@/constants/local-storage';
import { useAuthContext } from '@/contexts/auth';

/**
 * Custom hook to synchronize and persist URL search parameters with localStorage per user.
 *
 * @param {string} storageKey - Identifier for the feature filters (e.g. 'finance_filters')
 * @param {Object | (() => Object)} defaultParamsInput - Default parameter values or getter function
 * @param {Object} [options]
 * @param {string[]} [options.requiredKeys] - Keys that must be present in URL. If any are missing, restore from storage.
 * @param {(params: Object) => boolean} [options.validate] - Optional validation function for stored/url values
 * @returns {[Object, (updates: Object | ((prev: Object) => Object), navOptions?: Object) => void]}
 */
export const useStoredSearchParams = (
  storageKey,
  defaultParamsInput,
  options = {}
) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthContext();
  const syncedKeyRef = useRef(null);

  // Evaluate default params once per storageKey
  const defaultParams = useMemo(() => {
    return typeof defaultParamsInput === 'function'
      ? defaultParamsInput()
      : defaultParamsInput;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const paramKeys = useMemo(() => Object.keys(defaultParams), [defaultParams]);

  const fullStorageKey = useMemo(
    () => getStoredFiltersKey(user?.id, storageKey),
    [user?.id, storageKey]
  );

  // 1. Read current parameter values from URL
  const currentUrlParams = useMemo(() => {
    const result = {};
    for (const key of paramKeys) {
      const val = searchParams.get(key);
      if (val !== null) {
        result[key] = val;
      }
    }
    return result;
  }, [searchParams, paramKeys]);

  // Check if URL has active parameters
  const hasUrlParams = useMemo(() => {
    if (options.requiredKeys?.length) {
      return options.requiredKeys.every(
        (key) => searchParams.has(key) && Boolean(searchParams.get(key))
      );
    }
    return paramKeys.some((key) => searchParams.has(key));
  }, [searchParams, paramKeys, options.requiredKeys]);

  // Read saved params from localStorage
  const getStoredParams = useCallback(() => {
    try {
      const raw = localStorage.getItem(fullStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (options.validate && !options.validate(parsed)) {
          return null;
        }
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  }, [fullStorageKey, options]);

  // Save to localStorage
  const saveToStorage = useCallback(
    (paramsToSave) => {
      try {
        localStorage.setItem(fullStorageKey, JSON.stringify(paramsToSave));
      } catch (err) {
        console.error('Falha ao salvar preferências no localStorage', err);
      }
    },
    [fullStorageKey]
  );

  // Initial restoration / synchronization
  useEffect(() => {
    if (syncedKeyRef.current === fullStorageKey) return;

    if (hasUrlParams) {
      // URL already has parameters -> update localStorage
      const merged = { ...defaultParams, ...currentUrlParams };
      saveToStorage(merged);
      syncedKeyRef.current = fullStorageKey;
    } else {
      // URL has no parameters -> restore from localStorage or defaults
      const stored = getStoredParams();
      const resolved = stored ? { ...defaultParams, ...stored } : defaultParams;

      const nextSearchParams = new URLSearchParams(searchParams);
      Object.entries(resolved).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          nextSearchParams.set(key, String(value));
        } else {
          nextSearchParams.delete(key);
        }
      });

      saveToStorage(resolved);
      setSearchParams(nextSearchParams, { replace: true });
      syncedKeyRef.current = fullStorageKey;
    }
  }, [
    fullStorageKey,
    hasUrlParams,
    currentUrlParams,
    defaultParams,
    getStoredParams,
    saveToStorage,
    searchParams,
    setSearchParams,
  ]);

  // Helper to update parameters and URL
  const setParams = useCallback(
    (newParamsOrUpdater, navOptions = { replace: true }) => {
      const current = { ...defaultParams, ...currentUrlParams };
      const updates =
        typeof newParamsOrUpdater === 'function'
          ? newParamsOrUpdater(current)
          : newParamsOrUpdater;

      const merged = { ...current, ...updates };

      const nextSearchParams = new URLSearchParams(searchParams);
      Object.entries(merged).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          nextSearchParams.set(key, String(value));
        } else {
          nextSearchParams.delete(key);
        }
      });

      saveToStorage(merged);
      setSearchParams(nextSearchParams, navOptions);
    },
    [
      defaultParams,
      currentUrlParams,
      searchParams,
      setSearchParams,
      saveToStorage,
    ]
  );

  const activeParams = useMemo(() => {
    return { ...defaultParams, ...currentUrlParams };
  }, [defaultParams, currentUrlParams]);

  return [activeParams, setParams];
};

export default useStoredSearchParams;
