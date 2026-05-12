import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface NodeState {
  value: string;
  status: 'synced' | 'stale' | 'outdated';
}
interface Nodes { a: NodeState; b: NodeState; c: NodeState; }

const makeNodes = (): Nodes => ({
  a: { value: 'v1', status: 'synced' },
  b: { value: 'v1', status: 'synced' },
  c: { value: 'v1', status: 'synced' },
});

@Component({
  selector: 'app-base',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './base.component.html',
  styleUrl: './base.component.scss'
})
export class BaseComponent {
  nodes     = signal<Nodes>(makeNodes());
  writing   = signal(false);
  converged = signal(false);

  write() {
    if (this.writing()) return;
    this.writing.set(true);
    this.converged.set(false);

    this.nodes.set({
      a: { value: 'v2', status: 'synced' },
      b: { value: 'v1', status: 'stale'  },
      c: { value: 'v1', status: 'stale'  },
    });

    setTimeout(() => {
      this.nodes.update(n => ({ ...n, b: { value: 'v2', status: 'synced' } }));
    }, 1200);

    setTimeout(() => {
      this.nodes.update(n => ({ ...n, c: { value: 'v2', status: 'synced' } }));
      this.writing.set(false);
      this.converged.set(true);
    }, 2800);
  }

  reset() {
    this.nodes.set(makeNodes());
    this.writing.set(false);
    this.converged.set(false);
  }

  nodeLabel(n: NodeState): string {
    if (n.status === 'stale')  return n.value + ' (obsolete)';
    if (n.status === 'synced') return n.value + ' (a jour)';
    return n.value;
  }
}
