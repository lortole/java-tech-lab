import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './tabs/home/home.component';
import { AcidComponent } from './tabs/acid/acid.component';
import { CapComponent } from './tabs/cap/cap.component';
import { SagaComponent } from './tabs/saga/saga.component';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';

type Tab = 'home' | 'acid' | 'cap' | 'saga';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HomeComponent, AcidComponent, CapComponent, SagaComponent, ThemeToggleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  activeTab = signal<Tab>('home');
  readonly tabs: { id: Tab; label: string; color: string }[] = [
    { id: 'home', label: '\u{1F3E0} Accueil', color: 'tab-home' },
    { id: 'acid', label: '\u{1F535} ACID',   color: 'tab-acid' },
    { id: 'cap',  label: '\u{1F7E1} CAP',    color: 'tab-cap'  },
    { id: 'saga', label: '\u{1F534} SAGA',   color: 'tab-saga' },
  ];
  setTab(tab: Tab) { this.activeTab.set(tab); }
}
