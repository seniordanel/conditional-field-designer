import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DesignerStore } from '../../../core/services/designer-store.service';
import { DialogService } from '../../../core/services/dialog.service';
import { SchemaApiService } from '../../../core/services/schema-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import type { SaveSuccess, SaveValidationError } from '../../../core/models';

@Component({
  selector: 'cfd-designer-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, DatePipe],
  template: `
    <div class="brand">
      <span class="mark"><cfd-icon name="bolt" [size]="18" [strokeWidth]="2.5" /></span>
      <span class="name">Conditional Field Designer</span>
    </div>

    <div class="actions">
      @if (lastSaved(); as saved) {
        <span class="status">
          Saved rev {{ saved.revision }} · {{ saved.savedAt | date: 'HH:mm:ss' }}
        </span>
      } @else if (store.isDirty()) {
        <span class="status">Unsaved changes</span>
      }

      <button type="button" class="btn btn-ghost" (click)="viewJson()">
        <cfd-icon name="code" [size]="15" />
        View JSON
      </button>

      <button type="button" class="btn btn-ghost" (click)="confirmReset()">
        <cfd-icon name="reset" [size]="15" />
        Reset
      </button>

      <button type="button" class="btn btn-primary" [disabled]="saving()" (click)="save()">
        <cfd-icon [name]="saving() ? 'spinner' : 'save'" [size]="15" />
        {{ saving() ? 'Saving…' : 'Save Schema' }}
      </button>
    </div>
  `,
  styles: `
    :host {
      background: var(--surface);
      padding: 0 24px;
      height: 56px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 100;
      flex-shrink: 0;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .mark {
      background: linear-gradient(135deg, var(--primary), #818cf8);
      padding: 7px;
      border-radius: 8px;
      color: #fff;
      display: flex;
    }
    .name {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status {
      font-size: 12px;
      color: var(--text-muted);
      margin-right: 4px;
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class DesignerHeaderComponent {
  protected readonly store = inject(DesignerStore);
  private readonly api = inject(SchemaApiService);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);

  protected readonly saving = signal(false);
  protected readonly lastSaved = signal<SaveSuccess | null>(null);

  protected save(): void {
    if (this.saving()) return;
    this.saving.set(true);

    this.api.save(this.store.schema()).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.lastSaved.set(result);
        this.store.markSaved();
        this.toasts.success(
          'Schema saved',
          `Revision ${result.revision} · ${result.bytes} bytes · ${this.store.rules().length} rules`,
        );
      },
      error: (error: SaveValidationError) => {
        this.saving.set(false);
        this.toasts.error(error?.message ?? 'Save failed', error?.issues);
      },
    });
  }

  protected viewJson(): void {
    this.dialogs.open({ kind: 'json' });
  }

  protected confirmReset(): void {
    this.dialogs.confirm({
      title: 'Reset designer',
      message: 'This discards every field, connection and rule and restores the sample design.',
      confirmLabel: 'Reset everything',
      danger: true,
      onConfirm: () => {
        this.store.reset();
        this.lastSaved.set(null);
      },
    });
  }
}
