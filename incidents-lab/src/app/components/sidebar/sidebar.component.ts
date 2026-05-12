import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Incident } from '../../data/incidents';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() incidents: Incident[] = [];
  @Input() selectedId = '';
  @Output() selectIncident = new EventEmitter<string>();

  select(id: string): void {
    this.selectIncident.emit(id);
  }

  severityClass(severity: string): string {
    return `severity-badge severity-${severity.toLowerCase()}`;
  }
}
