import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';
// ✅ Version finale — aligned Netflix Java Lab

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="theme-switcher">

      <!-- Bouton toggle dark ↔ light -->
      <button
        class="theme-btn"
        (click)="toggle()"
        [title]="isDark() ? 'Passer en mode clair' : 'Passer en mode sombre'">
        {{ isDark() ? '☀️' : '🌙' }}
      </button>

      <!-- Bouton auto / manuel -->
      <button
        class="auto-btn"
        [class.active]="isAuto()"
        (click)="onAutoClick()"
        [title]="isAuto() ? 'Auto actif — suit le système' : 'Revenir en auto'">
        ⏱ {{ isAuto() ? 'auto' : 'manuel' }}
      </button>

    </div>
  `
})
export class ThemeToggleComponent {

  isDark   = computed(() => this.themeService.resolvedTheme() === 'dark');
  isAuto   = computed(() => this.themeService.theme() === 'auto');

  constructor(public themeService: ThemeService) {}

  /** Bascule dark ↔ light (sort du mode auto) */
  toggle(): void {
    const next = this.isDark() ? 'light' : 'dark';
    this.themeService.setTheme(next);
  }

  /** Si déjà auto : rien. Sinon : repasse en auto. */
  onAutoClick(): void {
    if (!this.isAuto()) {
      this.themeService.setTheme('auto');
    }
  }
}