import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/**
 * Presentational modal chrome: backdrop, header, scrollable body, footer.
 * Content goes in via `<ng-content>`, so each dialog only writes its own form.
 */
@Component({
  selector: 'cfd-modal-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="backdrop" (mousedown)="onBackdrop($event)">
      <div class="box" role="dialog" aria-modal="true" [attr.aria-label]="title()">
        <header class="top">
          <span class="title">{{ title() }}</span>
          <button type="button" class="btn btn-ghost btn-sm" aria-label="Close" (click)="cancel.emit()">
            <cfd-icon name="close" [size]="20" />
          </button>
        </header>

        <div class="mid">
          <ng-content />
        </div>

        <footer class="bot">
          <button type="button" class="btn btn-outline" (click)="cancel.emit()">
            {{ cancelLabel() }}
          </button>
          @if (confirmLabel()) {
            <button
              type="button"
              class="btn"
              [class.btn-primary]="!danger()"
              [class.btn-danger]="danger()"
              [disabled]="confirmDisabled()"
              (click)="confirm.emit()"
            >
              {{ confirmLabel() }}
            </button>
          }
        </footer>
      </div>
    </div>
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgb(15 23 42 / 0.4);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .box {
      background: #fff;
      border-radius: 14px;
      width: 480px;
      max-width: 92vw;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-lg);
      animation: rise 0.2s ease;
    }
    .top {
      padding: 18px 22px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title {
      font-size: 16px;
      font-weight: 700;
    }
    .mid {
      padding: 22px;
      overflow-y: auto;
      flex: 1;
    }
    .bot {
      padding: 14px 22px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: var(--surface-muted);
      border-radius: 0 0 14px 14px;
    }
    @keyframes rise {
      from {
        transform: translateY(12px);
      }
    }
  `,
})
export class ModalShellComponent {
  readonly title = input.required<string>();
  readonly confirmLabel = input<string | null>('Save');
  readonly cancelLabel = input('Cancel');
  readonly confirmDisabled = input(false);
  readonly danger = input(false);

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel.emit();
  }
}
