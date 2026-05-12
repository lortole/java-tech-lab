import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Order {
  id: number; sagaId: string; customerId: string;
  productId: string; quantity: number; amount: number;
  status: string; createdAt: string; updatedAt: string;
}
interface InventoryItem {
  productId: string; productName: string;
  stock: number; reserved: number; available: number;
}
interface SagaStep {
  label: string;
  status: 'idle' | 'running' | 'done' | 'failed' | 'compensating';
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:                  'En attente',
  INVENTORY_RESERVED:       'Stock reserve',
  PAYMENT_PROCESSING:       'Paiement en cours',
  CONFIRMED:                'Confirmee',
  CANCELLED:                'Annulee',
  COMPENSATION_IN_PROGRESS: 'Compensation...',
};

const EMPTY_STEPS: SagaStep[] = [
  { label: 'Commande',     status: 'idle' },
  { label: 'Inventaire',   status: 'idle' },
  { label: 'Paiement',     status: 'idle' },
  { label: 'Notification', status: 'idle' },
];

@Component({
  selector: 'app-saga',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './saga.component.html',
  styleUrl: './saga.component.scss'
})
export class SagaComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private api = environment.apiUrl;
  private eventSource?: EventSource;

  orders    = signal<Order[]>([]);
  inventory = signal<InventoryItem[]>([]);
  loading   = signal(false);
  activeOrderId = signal<number | null>(null);

  form = { productId: 'PROD-001', quantity: 1, amount: 500, forceFailPayment: false };

  readonly products = [
    { id: 'PROD-001', name: 'Laptop Pro 16"',  price: 1499 },
    { id: 'PROD-002', name: 'Casque Bluetooth', price: 89   },
    { id: 'PROD-003', name: 'Webcam 4K',        price: 149  },
  ];

  // ── Local SAGA simulation ─────────────────────────────────
  sagaSteps   = signal<SagaStep[]>([...EMPTY_STEPS]);
  sagaRunning = signal(false);

  statusLabel(s: string) { return STATUS_LABELS[s] ?? s; }
  isTerminal(status: string) { return status === 'CONFIRMED' || status === 'CANCELLED'; }

  ngOnInit() { this.loadOrders(); this.loadInventory(); this.subscribeSSE(); }

  ngOnDestroy() { this.eventSource?.close(); }

  subscribeSSE() {
    this.eventSource = new EventSource(`${this.api}/api/saga/events`);
    this.eventSource.onmessage = () => { this.loadOrders(); this.loadInventory(); };
  }

  loadOrders() {
    this.http.get<Order[]>(`${this.api}/api/saga/orders`)
      .subscribe({ next: o => this.orders.set(o), error: () => {} });
  }

  loadInventory() {
    this.http.get<InventoryItem[]>(`${this.api}/api/saga/inventory`)
      .subscribe({ next: i => this.inventory.set(i), error: () => {} });
  }

  placeOrder() {
    this.loading.set(true);
    const amount = this.form.forceFailPayment ? 99999 : this.form.amount;
    this.http.post<Order>(`${this.api}/api/saga/orders`, {
      customerId: 'demo-user',
      productId:  this.form.productId,
      quantity:   this.form.quantity,
      amount
    }).subscribe({
      next: o => {
        this.activeOrderId.set(o.id);
        this.loadOrders();
        this.loadInventory();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectProduct(productId: string) {
    const p = this.products.find(x => x.id === productId);
    if (p) { this.form.productId = productId; this.form.amount = p.price; }
  }

  private setStep(index: number, status: SagaStep['status']) {
    this.sagaSteps.update(s => s.map((x, i) => i === index ? { ...x, status } : x));
  }

  runSaga() {
    if (this.sagaRunning()) return;
    this.sagaRunning.set(true);
    this.sagaSteps.set([
      { label: 'Commande', status: 'running' },
      { label: 'Inventaire', status: 'idle' },
      { label: 'Paiement', status: 'idle' },
      { label: 'Notification', status: 'idle' },
    ]);
    setTimeout(() => {
      this.setStep(0, 'done'); this.setStep(1, 'running');
      setTimeout(() => {
        this.setStep(1, 'done'); this.setStep(2, 'running');
        setTimeout(() => {
          this.setStep(2, 'done'); this.setStep(3, 'running');
          setTimeout(() => {
            this.setStep(3, 'done');
            this.sagaRunning.set(false);
          }, 800);
        }, 800);
      }, 800);
    }, 800);
  }

  runSagaFail() {
    if (this.sagaRunning()) return;
    this.sagaRunning.set(true);
    this.sagaSteps.set([
      { label: 'Commande', status: 'running' },
      { label: 'Inventaire', status: 'idle' },
      { label: 'Paiement', status: 'idle' },
      { label: 'Notification', status: 'idle' },
    ]);
    setTimeout(() => {
      this.setStep(0, 'done'); this.setStep(1, 'running');
      setTimeout(() => {
        this.setStep(1, 'done'); this.setStep(2, 'running');
        setTimeout(() => {
          this.setStep(2, 'failed');
          setTimeout(() => {
            this.setStep(1, 'compensating');
            setTimeout(() => {
              this.setStep(0, 'compensating');
              this.sagaRunning.set(false);
            }, 800);
          }, 800);
        }, 800);
      }, 800);
    }, 800);
  }

  resetSaga() {
    this.sagaSteps.set([...EMPTY_STEPS]);
    this.sagaRunning.set(false);
  }
}
