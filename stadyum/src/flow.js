import { setMode, state } from './state.js';

// Adım 2 bu fonksiyonu gerçek kamera animasyonuyla değiştirecek.
export function onBuyTicket() {
  if (state.mode !== 'exterior') return;
  console.log('[Arena Bilet] Bilet Al tıklandı -> mode = entering');
  setMode('entering');
}
