import { Component, Input } from '@angular/core';
import { Incident } from '../../data/incidents';

@Component({
  selector: 'app-incident-card',
  standalone: true,
  imports: [],
  templateUrl: './incident-card.component.html',
  styleUrl: './incident-card.component.scss'
})
export class IncidentCardComponent {
  @Input() incident!: Incident;

  severityClass(severity: string): string {
    return `severity-badge severity-${severity.toLowerCase()}`;
  }
}
