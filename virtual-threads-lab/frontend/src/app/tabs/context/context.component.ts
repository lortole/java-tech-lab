import {
  Component,
  signal,
  computed,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  effect,
} from '@angular/core';

export interface Scenario {
  id: number;
  label: string;
  icon: string;
  status: 'bad' | 'warn' | 'ok';
  code: string[];
  verdict: string;
  verdictStatus: 'bad' | 'warn' | 'ok';
}

@Component({
  selector: 'app-context-tab',
  standalone: true,
  imports: [],
  templateUrl: './context.component.html',
})
export class ContextTabComponent implements AfterViewInit, OnDestroy {

  @ViewChild('vizCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  activeIdx = signal(0);
  isFirst   = computed(() => this.activeIdx() === 0);
  isLast    = computed(() => this.activeIdx() === this.scenarios.length - 1);
  current   = computed(() => this.scenarios[this.activeIdx()]);

  scenarios: Scenario[] = [
    {
      id: 0,
      label: 'ThreadLocal seul',
      icon: '\u274C',
      status: 'bad',
      code: [
        'MDC.put(<span class="hi">"traceId"</span>, <span class="hi">"abc-123"</span>);',
        '',
        '<span class="dim">try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {</span>',
        '  exec.submit(() -> {',
        '    MDC.get(<span class="hi">"traceId"</span>); <span class="err">// null \u2014 PERDU !</span>',
        '  });',
        '<span class="dim">}</span>',
      ],
      verdict: 'traceId perdu au fork \u2014 ThreadLocal est isol\u00e9 par thread',
      verdictStatus: 'bad',
    },
    {
      id: 1,
      label: 'MDC copie manuelle',
      icon: '\u26A0\uFE0F',
      status: 'warn',
      code: [
        'var captured = MDC.getCopyOfContextMap();',
        '',
        'exec.submit(() -> {',
        '  MDC.setContextMap(<span class="warn">captured</span>);',
        '  MDC.get(<span class="hi">"traceId"</span>); <span class="hi">// "abc-123" \u2705</span>',
        '  MDC.clear(); <span class="warn">// \u26A0\uFE0F oublier = fuite m\u00e9moire</span>',
        '});',
      ],
      verdict: 'Fonctionne \u2014 copie manuelle \u00e0 r\u00e9p\u00e9ter partout, risque d\'oubli du MDC.clear()',
      verdictStatus: 'warn',
    },
    {
      id: 2,
      label: 'ScopedValue',
      icon: '\u2705',
      status: 'ok',
      code: [
        '<span class="dim">static final</span> ScopedValue&lt;String&gt; TRACE_ID',
        '    = ScopedValue.newInstance();',
        '',
        'ScopedValue.where(TRACE_ID, <span class="hi">"abc-123"</span>).run(() -> {',
        '  <span class="dim">try (var scope = new StructuredTaskScope&lt;&gt;()) {</span>',
        '    scope.fork(() -> {',
        '      TRACE_ID.get(); <span class="hi">// "abc-123" \u2705 automatique</span>',
        '      <span class="dim">return null;</span>',
        '    });',
        '    <span class="dim">scope.join();</span>',
        '  <span class="dim">}</span>',
        '});',
      ],
      verdict: 'Propagation automatique \u2014 immuable, z\u00e9ro risque de mutation entre threads',
      verdictStatus: 'ok',
    },
    {
      id: 3,
      label: 'Spring Boot 3.2+',
      icon: '\u2705',
      status: 'ok',
      code: [
        '<span class="dim"># application.properties</span>',
        'spring.threads.virtual.enabled=<span class="hi">true</span>',
        '',
        '<span class="dim"># pom.xml</span>',
        '<span class="warn">io.micrometer:micrometer-context-propagation</span>',
        '',
        '<span class="dim">// MDC propag\u00e9 automatiquement dans tous les VTs Spring.</span>',
        '<span class="hi">// Aucun changement de code n\u00e9cessaire. \u2705</span>',
      ],
      verdict: 'Solution transparente pour tout projet Spring Boot 3.2+ existant',
      verdictStatus: 'ok',
    },
  ];

  tableRows = [
    { label: 'ThreadLocal seul',    prop: '\u274C Perdu',      verbose: '\u2014',    java: 'Tous',             cls: 'bad-row'  },
    { label: 'MDC copie manuelle',  prop: '\u2705 OK',          verbose: 'Elev\u00e9e', java: 'Tous',           cls: 'warn-row' },
    { label: 'ScopedValue',         prop: '\u2705 Auto',        verbose: 'Faible',  java: '21+',              cls: 'good-row' },
    { label: 'micrometer-ctx-prop', prop: '\u2705 Transparent', verbose: 'Z\u00e9ro', java: 'Spring Boot 3.2+', cls: 'good-row' },
  ];

  private rafId: number | null = null;
  private t = 0;
  private viewReady = false;
  private ro: ResizeObserver | null = null;

  constructor() {
    effect(() => {
      const idx = this.activeIdx();
      void idx;
      if (!this.viewReady) return;
      this.t = 0;
      this.stopAnim();
      this.startAnim();
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    this.ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          this.stopAnim();
          this.startAnim();
        }
      }
    });
    this.ro.observe(canvas);
  }

  ngOnDestroy(): void {
    this.stopAnim();
    this.ro?.disconnect();
  }

  prev(): void { if (!this.isFirst()) this.activeIdx.update(i => i - 1); }
  next(): void { if (!this.isLast())  this.activeIdx.update(i => i + 1); }
  goTo(i: number): void { this.activeIdx.set(i); }

  private stopAnim(): void {
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  }

  private startAnim(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;
    const idx = this.activeIdx();
    const draw = () => {
      if (this.rafId === null) return;
      ctx.clearRect(0, 0, W, H);
      this.t += 0.012;
      switch (idx) {
        case 0: this.scene0(ctx, W, H, this.t); break;
        case 1: this.scene1(ctx, W, H, this.t); break;
        case 2: this.scene2(ctx, W, H, this.t); break;
        case 3: this.scene3(ctx, W, H, this.t); break;
      }
      this.rafId = requestAnimationFrame(draw);
    };
    this.rafId = requestAnimationFrame(draw);
  }

  private thread(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, lbl: string, a = 1): void {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = fill;
    ctx.beginPath(); (ctx as any).roundRect(x, y, w, h, 5); ctx.fill();
    ctx.globalAlpha = a * 0.75;
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace'; ctx.textBaseline = 'middle';
    ctx.fillText(lbl, x + 10, y + h / 2);
    ctx.restore();
  }

  private dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, lbl: string, a = 1): void {
    ctx.save(); ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
    if (lbl) {
      ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#fff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lbl, x, y);
    }
    ctx.restore();
  }

  private arr(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, col: string, a = 0.6): void {
    ctx.save(); ctx.globalAlpha = a;
    ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 8 * Math.cos(ang - 0.4), y2 - 8 * Math.sin(ang - 0.4));
    ctx.lineTo(x2 - 8 * Math.cos(ang + 0.4), y2 - 8 * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  private txt(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, col: string, align: CanvasTextAlign = 'left', a = 0.8): void {
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = '10px monospace'; ctx.fillStyle = col;
    ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y); ctx.restore();
  }

  private scene0(ctx: CanvasRenderingContext2D, W: number, H: number, t: number): void {
    const py = H * 0.22, vy = H * 0.64, tw = W * 0.52, th = 26;
    this.thread(ctx, 20, py, tw, th, '#4a2020', 'Parent Thread', 0.9);
    this.thread(ctx, 60, vy, tw * 0.68, th, '#1a2840', 'Virtual Thread', 0.85);
    this.dot(ctx, 145, py + th / 2, 14, '#BA7517', 'tid', 1);
    this.arr(ctx, 80, py + th, 100, vy, '#6b6b80', 0.5);
    this.txt(ctx, 'fork()', 55, (py + th + vy) / 2, '#6b6b80');
    const na = 0.4 + 0.4 * Math.abs(Math.sin(t * 2));
    ctx.save(); ctx.globalAlpha = na;
    ctx.beginPath(); ctx.arc(165, vy + th / 2, 13, 0, Math.PI * 2);
    ctx.strokeStyle = '#E24B4A'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#E24B4A';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('null', 165, vy + th / 2); ctx.restore();
    this.txt(ctx, 'ThreadLocal non copie \u2192', W - 16, vy + th / 2, '#E24B4A', 'right', 0.75);
  }

  private scene1(ctx: CanvasRenderingContext2D, W: number, H: number, t: number): void {
    const py = H * 0.18, vy = H * 0.60, tw = W * 0.48, th = 26;
    this.thread(ctx, 20, py, tw, th, '#4a2020', 'Parent Thread', 0.9);
    this.thread(ctx, 60, vy, tw * 0.72, th, '#1a2840', 'Virtual Thread', 0.85);
    this.dot(ctx, 125, py + th / 2, 14, '#BA7517', 'tid', 1);
    const cx = 175 + Math.sin(t * 1.5) * 3, cy = py + th + 10;
    ctx.save(); ctx.globalAlpha = 0.82;
    ctx.fillStyle = '#2a1a08'; ctx.strokeStyle = '#BA7517'; ctx.lineWidth = 0.8;
    ctx.beginPath(); (ctx as any).roundRect(cx, cy, 100, 22, 4); ctx.fill(); ctx.stroke();
    ctx.font = '9px monospace'; ctx.fillStyle = '#F59e0b';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('captured copy', cx + 50, cy + 11); ctx.restore();
    this.arr(ctx, cx + 50, cy + 22, 162, vy, '#BA7517', 0.6);
    this.dot(ctx, 162, vy + th / 2, 14, '#1D9E75', 'tid', 0.85 + 0.12 * Math.sin(t * 3));
    this.arr(ctx, 60, py + th, 80, vy, '#6b6b80', 0.35);
    this.txt(ctx, 'MDC.clear() requis', W - 16, vy + th / 2, '#BA7517', 'right', 0.5 + 0.4 * Math.abs(Math.sin(t * 1.8)));
  }

  private scene2(ctx: CanvasRenderingContext2D, W: number, H: number, t: number): void {
    const py = H * 0.16, vy = H * 0.58, tw = W * 0.48, th = 26;
    ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = '#1D9E75';
    ctx.beginPath(); (ctx as any).roundRect(12, py - 12, W - 24, H * 0.56, 10); ctx.fill(); ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.28; ctx.strokeStyle = '#1D9E75'; ctx.lineWidth = 0.8;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); (ctx as any).roundRect(12, py - 12, W - 24, H * 0.56, 10); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '9px monospace'; ctx.fillStyle = '#1D9E75';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.globalAlpha = 0.65;
    ctx.fillText('ScopedValue.where(TRACE_ID, "abc-123").run { ... }', 20, py - 9); ctx.restore();
    this.thread(ctx, 28, py + 4, tw, th, '#0f4a30', 'Parent Thread', 0.9);
    const vtW = Math.min(140, (W - 80) / 3 - 10);
    for (let i = 0; i < 3; i++) {
      const vx = 28 + i * (vtW + 12);
      this.thread(ctx, vx, vy, vtW, th, '#0a2a18', 'VT ' + (i + 1), 0.85);
      this.dot(ctx, vx + vtW / 2, vy + th / 2, 12, '#1D9E75', 'tid', 0.8 + 0.15 * Math.sin(t * 2 + i * 0.9));
      this.arr(ctx, 28 + tw / 2, py + 4 + th, vx + vtW / 2, vy, '#1D9E75', 0.35);
    }
    this.txt(ctx, 'propage automatiquement', W - 16, vy + th + 16, '#1D9E75', 'right', 0.85);
  }

  private scene3(ctx: CanvasRenderingContext2D, W: number, H: number, t: number): void {
    const rX = 16, rY = H * 0.22, rW = 110, rH = 28;
    const sX = 158, sY = H * 0.18, sW = 145, sH = 38;
    const vY = H * 0.65;
    ctx.save(); ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#0d1a3a'; ctx.strokeStyle = '#4695eb'; ctx.lineWidth = 0.8;
    ctx.beginPath(); (ctx as any).roundRect(rX, rY, rW, rH, 5); ctx.fill(); ctx.stroke();
    ctx.font = '10px monospace'; ctx.fillStyle = '#4695eb';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('HTTP Request', rX + rW / 2, rY + rH / 2); ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.88;
    ctx.fillStyle = '#0a2010'; ctx.strokeStyle = '#6db33f'; ctx.lineWidth = 1;
    ctx.beginPath(); (ctx as any).roundRect(sX, sY, sW, sH, 6); ctx.fill(); ctx.stroke();
    ctx.font = 'bold 10px monospace'; ctx.fillStyle = '#6db33f';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Spring Boot 3.2+', sX + sW / 2, sY + 14);
    ctx.font = '9px monospace'; ctx.globalAlpha = 0.55;
    ctx.fillText('ContextExecutorService', sX + sW / 2, sY + 29); ctx.restore();
    this.arr(ctx, rX + rW, rY + rH / 2, sX, sY + sH / 2, '#4695eb', 0.5);
    const prog = (Math.sin(t * 2) + 1) / 2;
    this.dot(ctx, rX + rW + (sX - rX - rW) * prog, rY + rH / 2 + (sY + sH / 2 - rY - rH / 2) * prog, 10, '#BA7517', 'tid', 0.9);
    const vtW = Math.min(148, (W - 60) / 3 - 10);
    for (let i = 0; i < 3; i++) {
      const vx = 20 + i * (vtW + 12);
      this.thread(ctx, vx, vY, vtW, 26, '#0a2010', 'VT ' + (i + 1), 0.82);
      this.dot(ctx, vx + vtW / 2, vY + 13, 12, '#1D9E75', 'tid', 0.85 + 0.12 * Math.sin(t * 2 + i * 1.1));
      this.arr(ctx, sX + sW / 2, sY + sH, vx + vtW / 2, vY, '#1D9E75', 0.3);
    }
  }
}