'use client';
import { useSyncExternalStore } from 'react';

interface T {
  id: number;
  msg: string;
}
let items: T[] = [];
let n = 0;
const ls = new Set<() => void>();
const emit = () => ls.forEach((l) => l());

export function toast(msg: string, ms = 3200) {
  const id = ++n;
  items = [...items, { id, msg }];
  emit();
  setTimeout(() => {
    items = items.filter((i) => i.id !== id);
    emit();
  }, ms);
}

const EMPTY: T[] = [];
export function useToasts() {
  return useSyncExternalStore(
    (cb) => {
      ls.add(cb);
      return () => ls.delete(cb);
    },
    () => items,
    () => EMPTY,
  );
}
