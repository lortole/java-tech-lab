import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcidComponent } from './tabs/acid/acid.component';
import { CapComponent } from './tabs/cap/cap.component';
import { SagaComponent } from './tabs/saga/saga.component';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';

type Tab = 'acid' | 'cap' | 'saga';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AcidComponent, CapComponent, SagaComponent, ThemeToggleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  activeTab = signal<Tab>('acid');
  readonly tabs: { id: Tab; label: string; color: string }[] = [
    { id: 'acid', label: '🔵 ACID',  color: 'tab-acid' },
    { id: 'cap',  label: '🟡 CAP',   color: 'tab-cap'  },
    { id: 'saga', label: '🔴 SAGA',  color: 'tab-saga' },
  ];
  setTab(tab: Tab) { this.activeTab.set(tab); }
}
