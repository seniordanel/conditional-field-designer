import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';

/** Bottom-right notification stack. Rendered once, at the app root. */
@Component({
  selector: 'cfd-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="stack" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class]="toast.kind">
          <span class="glyph">
            <cfd-icon [name]="toast.kind === 'error' ? 'alert' : 'check'" [size]="18" />
          </span>
          <div class="body">
            <div class="title">{{ toast.title }}</div>
            @if (toast.detail) {
              <div class="detail">{{ toast.detail }}</div>
            }
            @if (toast.lines?.length) {
              <ul class="lines">
                @for (line of toast.lines; track line) {
                  <li>{{ line }}</li>
                }
              </ul>
            }
          </div>
          <button type="button" class="btn btn-ghost btn-xs" aria-label="Dismiss" (click)="toasts.dismiss(toast.id)">
            <cfd-icon name="close" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .stack {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 1200;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      width: 360px;
      max-width: calc(100vw - 40px);
      padding: 12px 14px;
      background: #fff;
      border: 1px solid var(--border);
      border-left: 3px solid var(--success);
      border-radius: 10px;
      box-shadow: var(--shadow-md);
      animation: slide-in 0.18s ease;
    }
    .toast.error {
      border-left-color: var(--danger);
    }
    .toast.info {
      border-left-color: var(--primary);
    }
    .glyph {
      color: var(--success);
      margin-top: 1px;
    }
    .toast.error .glyph {
      color: var(--danger);
    }
    .toast.info .glyph {
      color: var(--primary);
    }
    .body {
      flex: 1;
      min-width: 0;
    }
    .title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-strong);
    }
    .detail {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
      font-variant-numeric: tabular-nums;
    }
    .lines {
      margin: 6px 0 0 16px;
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.5;
    }
    @keyframes slide-in {
      from {
        transform: translateY(8px);
      }
    }
  `,
})
export class ToastHostComponent {
  protected readonly toasts = inject(ToastService);
}
