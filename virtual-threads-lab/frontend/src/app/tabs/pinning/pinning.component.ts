import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BenchService, PinningResult } from '../../services/bench.service';

@Component({
  selector: 'app-pinning-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pinning.component.html',
  styleUrls: ['./pinning.component.scss']
})
export class PinningTabComponent implements OnInit, OnDestroy {

  // ── Config simulation ───────────────────────────────────────────
  nCaisses  = 4;
  nClients  = 20;
  speed     = 4;

  readonly CARD_TICKS  = 14;
  readonly SCAN_TICKS  = 3;
  readonly SETUP_TICKS = 1;

  // ── State ───────────────────────────────────────────────────────
  pCaisses:  any[] = [];
  pClients:  any[] = [];
  vCaisses:  any[] = [];
  vClients:  any[] = [];
  pDone = 0;
  vDone = 0;

  running = false;
  private ticker: any = null;

  Math = Math;

  // ── Stats ───────────────────────────────────────────────────────
  get pBlocked()    { return this.pCaisses.filter(c => c.state === 'blocked').length; }
  get pWaiting()    { return this.pCaisses.reduce((s: number, c: any) => s + (c.queue || []).filter((id: number) => this.pClients[id]?.state === 'waiting').length, 0); }
  get vFree()       { return this.vCaisses.filter(c => c.state === 'free').length; }
  get vWaiting()    { return this.vCaisses.reduce((s: number, c: any) => s + (c.queue || []).filter((id: number) => ['waiting','searching','ready'].includes(this.vClients[id]?.state)).length, 0); }
  get pTpPct()      { return (this.pDone / Math.max(this.nClients, 1)) * 100; }
  get vTpPct()      { return (this.vDone / Math.max(this.nClients, 1)) * 100; }
  get allBlocked()  { return this.pCaisses.length > 0 && this.pCaisses.every(c => c.state === 'blocked') && this.pDone < this.nClients; }

  get pStatusClass() {
    if (this.pDone >= this.nClients) return 'status-box ok';
    if (this.allBlocked)             return 'status-box freeze';
    if (!this.running && this.pDone === 0) return 'status-box ok';
    return 'status-box warn';
  }
  get pStatusText() {
    if (this.pDone >= this.nClients) return `✅ ${this.nClients} clients servis`;
    if (this.allBlocked)             return `🔥 FREEZE — ${this.nCaisses} caisses bloquées, file gelée !`;
    if (!this.running && this.pDone === 0) return 'Prêt';
    return `${this.pBlocked}/${this.nCaisses} caisse(s) bloquée(s) sur la carte bleue`;
  }
  get vStatusText() {
    if (this.vDone >= this.nClients) return `✅ ${this.nClients} clients servis`;
    if (!this.running && this.vDone === 0) return 'Prêt';
    return `🟢 ${this.vFree}/${this.nCaisses} caissier(s) disponible(s)`;
  }

  // ── Bench backend ───────────────────────────────────────────────
  loading = false;
  result: PinningResult | null = null;
  error: string | null = null;

  constructor(private benchService: BenchService) {}

  ngOnInit()    { this.resetSim(); }
  ngOnDestroy() { this.stopSim(); }

  // ── Lifecycle sim ───────────────────────────────────────────────
  toggleSim() { this.running ? this.stopSim() : this.startSim(); }

  startSim() {
    if (this.pDone >= this.nClients && this.vDone >= this.nClients) this.resetSim();
    this.running = true;
    this.ticker  = setInterval(() => this.step(), Math.max(40, 400 / this.speed));
  }

  stopSim() {
    this.running = false;
    if (this.ticker) { clearInterval(this.ticker); this.ticker = null; }
  }

  onConfigChange() { this.stopSim(); this.resetSim(); }

  onSpeedChange() {
    if (this.running) { this.stopSim(); this.startSim(); }
  }

  resetSim() {
    this.pDone = 0; this.vDone = 0;
    this.pCaisses = this.mkCaisses(); this.pClients = this.mkClients();
    this.vCaisses = this.mkCaisses(); this.vClients = this.mkClients();
    this.pCaisses.forEach((c: any) => c.queue = []);
    this.vCaisses.forEach((c: any) => c.queue = []);
    this.pClients.forEach((_: any, i: number) => this.pCaisses[i % this.nCaisses].queue.push(i));
    this.vClients.forEach((_: any, i: number) => this.vCaisses[i % this.nCaisses].queue.push(i));
  }

  private mkCaisses() {
    return Array.from({length: this.nCaisses}, (_, i) => ({
      id: i, state: 'free', clientId: -1, timer: 0, timerMax: 1, queue: [] as number[]
    }));
  }

  private mkClients() {
    return Array.from({length: this.nClients}, (_, i) => ({
      id: i, state: 'waiting', caisseId: -1, timer: 0, timerMax: 1
    }));
  }

  private step() {
    if (this.pDone < this.nClients) this.stepPlatform();
    if (this.vDone < this.nClients) this.stepVirtual();
    if (this.pDone >= this.nClients && this.vDone >= this.nClients) {
      this.stopSim();
    }
  }

  private stepPlatform() {
    this.pCaisses.forEach((c: any) => {
      if (c.state === 'blocked') {
        if (--c.timer <= 0) { c.state = 'serving'; c.timer = this.SCAN_TICKS; c.timerMax = this.SCAN_TICKS; }
      } else if (c.state === 'serving') {
        if (--c.timer <= 0) {
          if (c.clientId >= 0) { this.pClients[c.clientId].state = 'done'; this.pDone++; }
          c.clientId = -1;
          const next = c.queue.shift();
          if (next !== undefined) {
            c.clientId = next; c.state = 'blocked';
            c.timer = this.CARD_TICKS; c.timerMax = this.CARD_TICKS;
            this.pClients[next].state = 'at-caisse';
          } else { c.state = 'free'; }
        }
      } else if (c.state === 'free') {
        const next = c.queue.shift();
        if (next !== undefined) {
          c.clientId = next; c.state = 'blocked';
          c.timer = this.CARD_TICKS; c.timerMax = this.CARD_TICKS;
          this.pClients[next].state = 'at-caisse';
        }
      }
    });
  }

  private stepVirtual() {
    this.vClients.forEach((cl: any) => {
      if (cl.state === 'searching') { if (--cl.timer <= 0) cl.state = 'ready'; }
    });
    this.vCaisses.forEach((c: any) => {
      if (c.state === 'serving') {
        if (--c.timer <= 0) {
          if (c.clientId >= 0) { this.vClients[c.clientId].state = 'done'; this.vDone++; }
          c.clientId = -1; c.state = 'free';
        }
      } else if (c.state === 'setup') {
        if (--c.timer <= 0) { c.state = 'free'; c.clientId = -1; }
      } else if (c.state === 'free') {
        const readyIdx = c.queue.findIndex((id: number) => this.vClients[id]?.state === 'ready');
        if (readyIdx >= 0) {
          const cid = c.queue.splice(readyIdx, 1)[0];
          c.clientId = cid; c.state = 'serving';
          c.timer = this.SCAN_TICKS; c.timerMax = this.SCAN_TICKS;
          this.vClients[cid].state = 'being-served';
          return;
        }
        const waitIdx = c.queue.findIndex((id: number) => this.vClients[id]?.state === 'waiting');
        if (waitIdx >= 0) {
          const cid = c.queue[waitIdx];
          this.vClients[cid].state = 'searching';
          this.vClients[cid].timer = this.CARD_TICKS;
          this.vClients[cid].timerMax = this.CARD_TICKS;
          c.state = 'setup'; c.timer = this.SETUP_TICKS; c.clientId = cid;
        }
      }
    });
  }

  // ── Helpers affichage ───────────────────────────────────────────
  caissierIcon(state: string, frozen: boolean): string {
    if (frozen) return '😵';
    return ({ free:'😊', blocked:'😤', serving:'⚡', setup:'👋' } as any)[state] || '😊';
  }

  caisseClass(c: any, isSync: boolean): string {
    if (isSync && this.allBlocked) return 'caisse frozen';
    return `caisse ${c.state === 'setup' ? 'setup' : c.state}`;
  }

  caisseStatus(c: any, isSync: boolean): string {
    if (isSync && this.allBlocked)  return '🔥 Bloquée — file gelée';
    if (c.state === 'blocked') {
      const pct = Math.round((1 - c.timer / c.timerMax) * 100);
      return `Attend la carte bleue... (${pct}%)`;
    }
    if (c.state === 'serving') return 'Scan articles ⚡';
    if (c.state === 'setup')   return 'Installe le client...';
    const q = (c.queue || []).filter((id: number) => {
      const clients = isSync ? this.pClients : this.vClients;
      return clients[id]?.state !== 'done';
    });
    return q.length > 0 ? 'Appelle le suivant...' : 'Libre 😊';
  }

  clientIcon(state: string): string {
    return ({ waiting:'🧑', 'at-caisse':'😅', searching:'🔍', ready:'🔔', 'being-served':'😌', done:'✅' } as any)[state] || '🧑';
  }

  clientLabel(state: string): string {
    return ({ waiting:'attend', 'at-caisse':'cherche carte', searching:'cherche...', ready:'carte prête!', 'being-served':'scan...' } as any)[state] || '';
  }

  clientColor(state: string): string {
    return ({ searching:'#BA7517', ready:'#1D9E75', 'being-served':'#0C447C' } as any)[state] || 'var(--text-muted)';
  }

  clientProgress(cl: any): number {
    if (!cl || cl.timerMax <= 0) return 100;
    return Math.round((1 - cl.timer / cl.timerMax) * 100);
  }

  visibleQueue(queue: number[], clients: any[], max = 6): number[] {
    return (queue || []).filter(id => clients[id]?.state !== 'done').slice(0, max);
  }

  moreInQueue(queue: number[], clients: any[], max = 6): number {
    const visible = (queue || []).filter(id => clients[id]?.state !== 'done');
    return Math.max(0, visible.length - max);
  }

  trackById(_: number, item: any): number { return item.id; }
  trackByIndex(i: number): number { return i; }

  // ── Bench ───────────────────────────────────────────────────────
  runBench() {
    this.loading = true; this.error = null; this.result = null;
    this.benchService.getPinningResult().subscribe({
      next:  r => { this.result = r; this.loading = false; },
      error: () => { this.error = 'Backend non disponible — lancez le Spring Boot sur :8082'; this.loading = false; }
    });
  }
}
