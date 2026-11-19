// Basit uygulama durumu. mode: 'exterior' | 'entering' | 'interior' | 'section'
export const state = {
  mode: 'exterior',
  selectedSection: null,
  hour: 12,
  quality: null,
};

const listeners = new Set();

export function setMode(mode, extra = {}) {
  const prev = state.mode;
  state.mode = mode;
  Object.assign(state, extra);
  for (const fn of listeners) fn(mode, prev, state);
}

export function onModeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
