import type { App } from '../app.ts';
import type { LockedView } from '../camera/views.ts';

/**
 * Bottom bar listing the locked views. Selecting one hands the view to the
 * `go` callback (instant in STEP 02, a cinematic flight from STEP 03 on).
 */
export function mountViewsBar(app: App, go: (v: LockedView) => void): HTMLElement {
  const bar = document.createElement('nav');
  bar.className = 'views-bar';
  bar.setAttribute('aria-label', 'Görünümler');
  const caption = document.createElement('div');
  caption.className = 'views-caption';
  const list = document.createElement('div');
  list.className = 'views-list';
  for (const v of app.views) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'view-btn';
    b.dataset.view = v.id;
    b.textContent = v.label;
    b.addEventListener('click', () => go(v));
    list.appendChild(b);
  }
  bar.append(caption, list);
  document.body.appendChild(bar);
  const sync = () => {
    const cur = app.director.current;
    caption.textContent = cur ? cur.caption : 'Serbest gezinti · sürükle, yakınlaş';
    for (const el of list.querySelectorAll<HTMLButtonElement>('.view-btn')) el.classList.toggle('active', el.dataset.view === cur?.id);
  };
  app.director.onChange(sync);
  sync();
  return bar;
}
