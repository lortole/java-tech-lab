import { Component } from '@angular/core';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { IncidentCardComponent } from './components/incident-card/incident-card.component';
import { incidents, Incident } from './data/incidents';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SidebarComponent, IncidentCardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  incidents = incidents;
  selectedId = incidents[0].id;

  get selectedIncident(): Incident {
    return this.incidents.find(i => i.id === this.selectedId) ?? this.incidents[0];
  }

  onSelect(id: string): void {
    this.selectedId = id;
  }
}
