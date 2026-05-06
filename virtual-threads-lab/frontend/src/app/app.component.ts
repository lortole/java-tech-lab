import { Component } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { BenchService } from './services/bench.service';
import { ThemeToggleComponent } from './theme-toggle/theme-toggle.component';
import { BenchTabComponent } from './tabs/bench/bench.component';
import { PinningTabComponent } from './tabs/pinning/pinning.component';
import { ContextTabComponent } from './tabs/context/context.component';

type Tab = 'bench' | 'pinning' | 'context';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ThemeToggleComponent, BenchTabComponent, PinningTabComponent, ContextTabComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  activeTab: Tab = 'bench';

  tabs = [
    { id: 'bench'   as Tab, label: 'Platform vs Virtual', icon: '\uD83D\uDCCA' },
    { id: 'pinning' as Tab, label: 'Pinning',             icon: '\uD83D\uDCCE' },
    { id: 'context' as Tab, label: 'Context Propagation', icon: '\uD83D\uDD17' },
  ];

  constructor(
    public themeService: ThemeService,
    public benchService: BenchService,
  ) {}
}