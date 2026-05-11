import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="theme-pill" (click)="toggle()" [attr.aria-label]="isDark() ? 'Passer en mode clair' : 'Passer en mode sombre'">
      <span class="theme-icon">{{ isDark() ? '☀️' : '🌙' }}</span>
      <span class="theme-label">{{ isDark() ? 'Clair' : 'Sombre' }}</span>
    </button>
  `
})
export class ThemeToggleComponent implements OnInit {
  isDark = signal(false);

  ngOnInit() {
    const saved = localStorage.getItem('txlab-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved ? saved === 'dark' : prefersDark;
    this.isDark.set(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }

  toggle() {
    const next = !this.isDark();
    this.isDark.set(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('txlab-theme', next ? 'dark' : 'light');
  }
}