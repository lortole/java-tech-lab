import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme } from './services/theme.service';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';
import { BenchTabComponent } from './tabs/bench/bench.component';
import { PinningTabComponent } from './tabs/pinning/pinning.component';
import { ContextTabComponent } from './tabs/context/context.component';

type Tab = 'bench' | 'pinning' | 'context';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ThemeToggleComponent, BenchTabComponent, PinningTabComponent, ContextTabComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  activeTab: Tab = 'bench';
  constructor(public themeService: ThemeService) {}

  tabs = [
    { id: 'bench'   as Tab, label: 'Platform vs Virtual', icon: '📊' },
    { id: 'pinning' as Tab, label: 'Pinning',             icon: '📌' },
    { id: 'context' as Tab, label: 'Context Propagation', icon: '🔗' },
  ];
}