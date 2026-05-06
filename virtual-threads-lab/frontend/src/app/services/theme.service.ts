import { Injectable, signal, computed, effect } from '@angular/core';

export type Theme = 'dark' | 'light' | 'auto';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private readonly STORAGE_KEY = 'vt-lab-theme';

  // Thème choisi par l'utilisateur (dark | light | auto)
  theme = signal<Theme>(this.loadTheme());

  // Thème effectif résolu (jamais 'auto' — toujours 'dark' ou 'light')
  resolvedTheme = computed<'dark' | 'light'>(() => {
    const t = this.theme();
    if (t !== 'auto') return t;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  constructor() {
    // Applique le thème à chaque changement
    effect(() => {
      this.applyTheme(this.theme());
      localStorage.setItem(this.STORAGE_KEY, this.theme());
    });

    // Réagit aux changements système quand on est en mode auto
    window.matchMedia('(prefers-color-scheme: light)')
      .addEventListener('change', () => {
        if (this.theme() === 'auto') {
          // Force la réévaluation du computed en re-settant 'auto'
          this.theme.set('auto');
        }
      });
  }

  setTheme(t: Theme) {
    this.theme.set(t);
  }

  private loadTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    return stored ?? 'dark';
  }

  private applyTheme(t: Theme) {
    const root = document.documentElement;
    root.removeAttribute('data-theme');
    if (t === 'auto') return; // prefers-color-scheme prend le relai via _tokens.scss
    root.setAttribute('data-theme', t);
  }
}