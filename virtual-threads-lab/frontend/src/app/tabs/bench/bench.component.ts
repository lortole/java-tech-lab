import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BenchService, BenchResult } from '../../services/bench.service';

@Component({
  selector: 'app-bench-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bench.component.html',
  styleUrls: ['./bench.component.scss']
})
export class BenchTabComponent implements OnInit, OnDestroy {

  // ── Bench backend ───────────────────────────────────────────────
  taskCount = 500;
  loading   = false;
  result: BenchResult | null = null;
  error: string | null = null;

  // ── Config simulation restaurant ────────────────────────────────
  nTables  = 16;
  nWaiters = 4;
  speed    = 3;

  readonly THINK = 10;
  readonly SERVE = 2;
  readonly IDLE  = 5;
  readonly SHOW  = 3;

  // ── State simulation ────────────────────────────────────────────
  pTables:  any[] = [];
  pWaiters: any[] = [];
  vTables:  any[] = [];
  vWaiters: any[] = [];
  pServed = 0;
  vServed = 0;
  running = false;
  private ticker: any = null;

  Math = Math;

  // ── Stats ───────────────────────────────────────────────────────
  get pBlocked() { return this.pWaiters.filter(w => w.state === 'blocked').length; }
  get pWaiting() { return this.pTables.filter(t => t.state === 'waiting').length; }
  get vWaiting() { return this.vTables.filter(t => t.state === 'waiting' || t.state === 'ready').length; }
  get vFree()    { return this.vWaiters.filter(w => w.state === 'free').length; }
  get pTpPct()   { return (this.pServed / Math.max(this.vServed, this.pServed, 1)) * 100; }
  get vTpPct()   { return (this.vServed / Math.max(this.vServed, this.pServed, 1)) * 100; }
  get tableCols() {
    const c = this.nTables <= 9 ? 3 : this.nTables <= 16 ? 4 : 5;
    return `repeat(${c}, 1fr)`;
  }
  get pLog() {
    return this.pBlocked > 0
      ? `⚠️ ${this.pBlocked} serveur(s) bloqué(s) — ${this.pWaiting} table(s) sans service`
      : `${this.pServed} tables servies`;
  }
  get vLog() {
    return this.vFree > 0
      ? `🥷 ${this.vFree} carrier(s) libre(s) — ${this.vServed} tables servies`
      : `${this.vServed} tables servies`;
  }

  constructor(private benchService: BenchService) {}

  ngOnInit()    { this.resetSim(); this.run(); }
  ngOnDestroy() { this.stopSim(); }

  // ── Bench ───────────────────────────────────────────────────────
  run() {
    this.loading = true; this.error = null; this.result = null;
    this.benchService.getBenchResult(this.taskCount).subscribe({
      next:  r => { this.result = r; this.loading = false; },
      error: () => { this.error = 'Backend non disponible — lancez le Spring Boot sur :8080'; this.loading = false; }
    });
  }

  // ── Simulation ──────────────────────────────────────────────────
  toggleSim() { this.running ? this.stopSim() : this.startSim(); }

  startSim() {
    this.running = true;
    this.ticker  = setInterval(() => this.step(), Math.max(60, 500 / this.speed));
  }

  stopSim() {
    this.running = false;
    if (this.ticker) { clearInterval(this.ticker); this.ticker = null; }
  }

  onConfigChange() { this.stopSim(); this.resetSim(); }
  onSpeedChange()  { if (this.running) { this.stopSim(); this.startSim(); } }

  resetSim() {
    this.pServed = 0; this.vServed = 0;
    this.pTables  = this.initTables();
    this.pWaiters = this.initWaiters();
    this.vTables  = this.initTables();
    this.vWaiters = this.initWaiters();
  }

  private initTables() {
    return Array.from({length: this.nTables}, () => ({
      state: 'idle', timer: Math.floor(Math.random() * this.IDLE),
      waiterIdx: -1, pendingTimer: 0
    }));
  }

  private initWaiters() {
    return Array.from({length: this.nWaiters}, () => ({ state: 'free', tableIdx: -1, timer: 0 }));
  }

  private step() { this.stepPlatform(); this.stepVirtual(); }

  private stepPlatform() {
    this.pTables.forEach((t: any) => {
      if      (t.state === 'idle')     { if (--t.timer <= 0) t.state = 'waiting'; }
      else if (t.state === 'thinking') { if (--t.timer <= 0) { t.state = 'serving'; t.timer = this.SERVE; } }
      else if (t.state === 'serving')  {
        if (--t.timer <= 0) {
          if (t.waiterIdx >= 0) { this.pWaiters[t.waiterIdx].state = 'free'; this.pWaiters[t.waiterIdx].tableIdx = -1; }
          t.waiterIdx = -1; t.state = 'served'; t.timer = this.SHOW; this.pServed++;
        }
      }
      else if (t.state === 'served')   { if (--t.timer <= 0) { t.state = 'idle'; t.timer = this.IDLE; } }
    });
    this.pWaiters.forEach((w: any, wi: number) => {
      if (w.state === 'free') {
        const idx = this.pTables.findIndex((t: any) => t.state === 'waiting');
        if (idx >= 0) {
          w.state = 'blocked'; w.tableIdx = idx;
          this.pTables[idx].state = 'thinking'; this.pTables[idx].timer = this.THINK; this.pTables[idx].waiterIdx = wi;
        }
      }
    });
  }

  private stepVirtual() {
    this.vTables.forEach((t: any) => {
      if      (t.state === 'idle')       { if (--t.timer <= 0) t.state = 'waiting'; }
      else if (t.state === 'taking')     {
        if (--t.timer <= 0) {
          if (t.waiterIdx >= 0) { this.vWaiters[t.waiterIdx].state = 'free'; this.vWaiters[t.waiterIdx].tableIdx = -1; }
          t.waiterIdx = -1; t.state = 'vthinking'; t.timer = this.THINK;
        }
      }
      else if (t.state === 'vthinking')  { if (--t.timer <= 0) t.state = 'ready'; }
      else if (t.state === 'finalizing') {
        if (--t.timer <= 0) {
          if (t.waiterIdx >= 0) { this.vWaiters[t.waiterIdx].state = 'free'; this.vWaiters[t.waiterIdx].tableIdx = -1; }
          t.waiterIdx = -1; t.state = 'served'; t.timer = this.SHOW; this.vServed++;
        }
      }
      else if (t.state === 'served')     { if (--t.timer <= 0) { t.state = 'idle'; t.timer = this.IDLE; } }
    });
    this.vWaiters.forEach((w: any, wi: number) => {
      if (w.state !== 'free') return;
      const ready = this.vTables.findIndex((t: any) => t.state === 'ready');
      if (ready >= 0) {
        w.state = 'serving'; w.tableIdx = ready;
        this.vTables[ready].state = 'finalizing'; this.vTables[ready].timer = this.SERVE; this.vTables[ready].waiterIdx = wi;
        return;
      }
      const waiting = this.vTables.findIndex((t: any) => t.state === 'waiting');
      if (waiting >= 0) {
        w.state = 'taking'; w.tableIdx = waiting;
        this.vTables[waiting].state = 'taking'; this.vTables[waiting].timer = this.SERVE; this.vTables[waiting].waiterIdx = wi;
      }
    });
  }

  // ── Helpers affichage ───────────────────────────────────────────
  tableIcon(_side: string, state: string): string {
    return ({ idle:'🪑', waiting:'🙋', thinking:'🤔', serving:'📝', taking:'📝', vthinking:'🤔', ready:'🔔', finalizing:'✅', served:'✅' } as any)[state] || '🪑';
  }
  tableLabel(_side: string, state: string, i: number): string {
    return ({ idle:'', waiting:'attend', thinking:'bloqué!', serving:'cmd...', taking:'cmd...', vthinking:'pense', ready:'prêt!', finalizing:'fini!', served:'servi' } as any)[state] || `T${i+1}`;
  }
  pWaiterStatus(state: string): string {
    return ({ free:'LIBRE', blocked:'BLOQUÉ 🔒', serving:'SERT' } as any)[state] || state;
  }
  vWaiterStatus(state: string): string {
    return ({ free:'LIBRE', taking:'CMD →', serving:'FINALISE', busy:'FINALISE' } as any)[state] || state;
  }
  trackById(_: number, item: any): number { return item.id; }
  trackByIndex(i: number): number { return i; }
}