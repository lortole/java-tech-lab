import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface NodeState { nodeId: string; data: Record<string,string>; version: number; available: boolean; message: string; }
interface ClusterState { nodeA: NodeState; nodeB: NodeState; partitionActive: boolean; modeCp: boolean; explanation: string; }

@Component({
  selector: 'app-cap',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cap.component.html',
  styleUrl: './cap.component.scss'
})
export class CapComponent implements OnInit {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  state = signal<ClusterState | null>(null);
  readResult = signal<NodeState | null>(null);
  loading = signal(false);
  writeValue = '';

  ngOnInit() { this.loadState(); }

  loadState() {
    this.http.get<ClusterState>(`${this.api}/api/cap/state`)
      .subscribe({ next: s => this.state.set(s), error: () => {} });
  }

  write() {
    if (!this.writeValue.trim()) return;
    this.loading.set(true);
    this.http.post<ClusterState>(`${this.api}/api/cap/write?key=valeur&value=${encodeURIComponent(this.writeValue)}`, {})
      .subscribe({ next: s => { this.state.set(s); this.loading.set(false); this.writeValue = ''; }, error: () => this.loading.set(false) });
  }

  readB() {
    this.http.get<NodeState>(`${this.api}/api/cap/read-b?key=valeur`)
      .subscribe({ next: r => this.readResult.set(r), error: () => {} });
  }

  togglePartition(active: boolean) {
    this.http.post<ClusterState>(`${this.api}/api/cap/partition?active=${active}`, {})
      .subscribe({ next: s => { this.state.set(s); this.readResult.set(null); }, error: () => {} });
  }

  setMode(cp: boolean) {
    this.http.post<ClusterState>(`${this.api}/api/cap/mode?cp=${cp}`, {})
      .subscribe({ next: s => { this.state.set(s); this.readResult.set(null); }, error: () => {} });
  }

  reset() {
    this.http.post<ClusterState>(`${this.api}/api/cap/reset`, {})
      .subscribe({ next: s => { this.state.set(s); this.readResult.set(null); }, error: () => {} });
  }
}