import type { KeyboardEvent } from 'react';

/**
 * role="radiogroup" için klavye gezinmesi: ok tuşları, Home ve End seçimi taşır ve odağı yeni seçeneğe verir.
 * Seçili (ya da ilk) seçenek tabIndex=0, diğerleri -1 olmalıdır (tek Tab durağı).
 */
export function radioNav(e: KeyboardEvent<HTMLElement>, count: number, index: number, pick: (i: number) => void): void {
  let n = index;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (index + 1) % count;
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (index - 1 + count) % count;
  else if (e.key === 'Home') n = 0;
  else if (e.key === 'End') n = count - 1;
  else return;
  e.preventDefault();
  pick(n);
  const group = e.currentTarget.closest('[role="radiogroup"]');
  group?.querySelectorAll<HTMLElement>('[role="radio"]')[n]?.focus();
}
