import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Account { id: number; owner: string; balance: number; }
interface TransferResult {
  success: boolean; transferId: number | null;
  fromOwner: string; fromBalance: number;
  toOwner: string; toBalance: number;
  message: string;
}
interface HistoryEntry {
  id: number; from: string; to: string;
  amount: number; status: string; createdAt: string;
}

@Component({
  selector: 'app-acid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './acid.component.html',
  styleUrl: './acid.component.scss'
})
export class AcidComponent implements OnInit {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  accounts = signal<Account[]>([]);
  history = signal<HistoryEntry[]>([]);
  lastResult = signal<TransferResult | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  form = { fromId: '', toId: '', amount: '', forceFailAfterDebit: false };

  ngOnInit() {
    this.loadAccounts();
    this.loadHistory();
  }

  loadAccounts() {
    this.http.get<Account[]>(`${this.api}/api/acid/accounts`)
      .subscribe({ next: a => this.accounts.set(a), error: () => {} });
  }

  loadHistory() {
    this.http.get<HistoryEntry[]>(`${this.api}/api/acid/transfers`)
      .subscribe({ next: h => this.history.set(h), error: () => {} });
  }

  transfer() {
    if (!this.form.fromId || !this.form.toId || !this.form.amount) return;
    this.loading.set(true);
    this.lastResult.set(null);
    this.error.set(null);

    this.http.post<TransferResult>(`${this.api}/api/acid/transfer`, {
      fromAccountId: +this.form.fromId,
      toAccountId: +this.form.toId,
      amount: +this.form.amount,
      forceFailAfterDebit: this.form.forceFailAfterDebit
    }).subscribe({
      next: r => {
        this.lastResult.set(r);
        this.loadAccounts();
        this.loadHistory();
        this.loading.set(false);
      },
      error: () => { this.error.set('Erreur réseau'); this.loading.set(false); }
    });
  }

  reset() {
    this.http.post(`${this.api}/api/acid/reset`, {})
      .subscribe(() => { this.loadAccounts(); this.loadHistory(); this.lastResult.set(null); });
  }
}