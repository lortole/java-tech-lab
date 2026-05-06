import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

export interface BenchResult {
  taskCount: number;
  platformMs: number;
  virtualMs: number;
  speedup: number;
  platformLabel: string;
  virtualLabel: string;
}

export interface PinningResult {
  taskCount: number;
  delayMs: number;
  noLockMs: number;
  synchronizedMs: number;
  reentrantMs: number;
  javaVersion: number;
  pinningFixed: boolean;
  note: string;
}

export interface JvmInfo {
  javaVersion: number;
  javaVersionFull: string;
  availableProcessors: number;
  virtualThreads: string;
  springBootVersion: string;
}

export type BackendMode = 'simulation' | 'local';

// Simulation : reproduit fidelement le comportement Java
// Platform threads : n taches en batches de cpu_count -> n * delayMs / cpu_count
// Virtual threads  : toutes en parallele -> 1 * delayMs
function simulateBench(tasks: number): BenchResult {
  const cpus = navigator.hardwareConcurrency || 4;
  const delayMs = 100; // simule 100ms d'I/O par tache
  const platformMs = Math.round((tasks / cpus) * delayMs * (0.95 + Math.random() * 0.1));
  const virtualMs  = Math.round(delayMs * 1.05 + Math.random() * 20);
  return {
    taskCount: tasks,
    platformMs,
    virtualMs,
    speedup: Math.round((platformMs / virtualMs) * 10) / 10,
    platformLabel: `${tasks} taches, ${cpus} threads`,
    virtualLabel:  `${tasks} VTs, 1 batch`,
  };
}

function simulatePinning(): PinningResult {
  const base = 200;
  return {
    taskCount: 100,
    delayMs: base,
    noLockMs:       Math.round(base * 1.02 + Math.random() * 10),
    synchronizedMs: Math.round(base * 8.5  + Math.random() * 200),
    reentrantMs:    Math.round(base * 1.08 + Math.random() * 15),
    javaVersion: 21,
    pinningFixed: false,
    note: 'Simulation — synchronizedMs simule le pinning du carrier thread',
  };
}

function simulateJvmInfo(): JvmInfo {
  return {
    javaVersion: 21,
    javaVersionFull: '21 (simulation)',
    availableProcessors: navigator.hardwareConcurrency || 4,
    virtualThreads: 'enabled',
    springBootVersion: '3.3.0',
  };
}

@Injectable({ providedIn: 'root' })
export class BenchService {

  private readonly api = 'http://localhost:8080/api';

  // Signal global : 'simulation' par defaut, 'local' si backend detecte
  mode = signal<BackendMode>('simulation');
  backendError = signal<string | null>(null);

  constructor(private http: HttpClient) {
    this.detectBackend();
  }

  // Tente un ping au backend — passe en mode local si repond
  private detectBackend(): void {
    this.http.get<JvmInfo>(`${this.api}/info`)
      .pipe(timeout(1500), catchError(() => of(null)))
      .subscribe(res => {
        if (res) {
          this.mode.set('local');
          this.backendError.set(null);
        }
      });
  }

  // Peut etre appele manuellement depuis l'UI
  retryBackend(): void {
    this.backendError.set(null);
    this.detectBackend();
  }

  forceMode(m: BackendMode): void {
    this.mode.set(m);
    if (m === 'local') this.detectBackend();
  }

  getBenchResult(tasks = 500): Observable<BenchResult> {
    if (this.mode() === 'simulation') {
      return of(simulateBench(tasks));
    }
    return this.http.get<BenchResult>(`${this.api}/bench?tasks=${tasks}`)
      .pipe(
        timeout(30000),
        catchError(err => {
          this.backendError.set('Backend injoignable — repassage en simulation');
          this.mode.set('simulation');
          return of(simulateBench(tasks));
        })
      );
  }

  getPinningResult(): Observable<PinningResult> {
    if (this.mode() === 'simulation') {
      return of(simulatePinning());
    }
    return this.http.get<PinningResult>(`${this.api}/pinning`)
      .pipe(
        timeout(30000),
        catchError(() => {
          this.mode.set('simulation');
          return of(simulatePinning());
        })
      );
  }

  getJvmInfo(): Observable<JvmInfo> {
    if (this.mode() === 'simulation') {
      return of(simulateJvmInfo());
    }
    return this.http.get<JvmInfo>(`${this.api}/info`)
      .pipe(
        timeout(5000),
        catchError(() => {
          this.mode.set('simulation');
          return of(simulateJvmInfo());
        })
      );
  }
}