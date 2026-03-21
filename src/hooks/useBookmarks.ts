import { useState, useCallback } from 'react';

const COMPANY_KEY = 'hubble-bookmarked-companies';
const NEWS_KEY = 'hubble-bookmarked-news';

function load(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function save(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

export function useCompanyBookmarks() {
  const [ids, setIds] = useState<Set<string>>(() => load(COMPANY_KEY));

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      save(COMPANY_KEY, next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback((id: string) => ids.has(id), [ids]);

  return { toggle, isBookmarked, bookmarkedIds: ids };
}

export function useNewsBookmarks() {
  const [ids, setIds] = useState<Set<string>>(() => load(NEWS_KEY));

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      save(NEWS_KEY, next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback((id: string) => ids.has(id), [ids]);

  return { toggle, isBookmarked, bookmarkedIds: ids };
}
