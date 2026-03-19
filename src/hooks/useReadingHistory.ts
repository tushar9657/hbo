import { useState, useCallback } from 'react';

const STORAGE_KEY = 'hubble-reading-history';

function getHistory(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveHistory(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export function useReadingHistory() {
  const [readIds, setReadIds] = useState<Set<string>>(() => getHistory());

  const markRead = useCallback((id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveHistory(next);
      return next;
    });
  }, []);

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  return { markRead, isRead };
}
