import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class BenchService {

  private readonly api = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getBenchResult(tasks = 500): Observable<BenchResult> {
    return this.http.get<BenchResult>(`${this.api}/bench?tasks=${tasks}`);
  }

  getPinningResult(): Observable<PinningResult> {
    return this.http.get<PinningResult>(`${this.api}/pinning`);
  }

  getJvmInfo(): Observable<JvmInfo> {
    return this.http.get<JvmInfo>(`${this.api}/info`);
  }
}
