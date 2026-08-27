import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DesignerStore } from '../../../core/services/designer-store.service';
import { DialogService } from '../../../core/services/dialog.service';
import { InventoryItemComponent } from './inventory-item.component';

/** Left rail: the field library, and the entry point for creating new fields. */
@Component({
  selector: 'cfd-field-inventory',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InventoryItemComponent],
  template: `
    <div class="head">
      <div class="title">Fields</div>
      <div class="hint">Drag onto canvas to use</div>
      <button type="button" class="btn btn-primary btn-sm btn-block" (click)="createField()">
        + New Field
      </button>
    </div>

    <div class="list">
      @for (field of store.fields(); track field.id) {
        <cfd-inventory-item [field]="field" [placed]="store.placedFieldIds().has(field.id)" />
      } @empty {
        <p class="empty">No fields yet — create one to get started.</p>
      }
    </div>
  `,
  styles: `
    :host {
      width: 260px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      z-index: 20;
      flex-shrink: 0;
    }
    .head {
      padding: 16px;
      border-bottom: 1px solid var(--border);
    }
    .title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-strong);
      margin-bottom: 4px;
    }
    .hint {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 12px;
    }
    .list {
      padding: 12px;
      overflow-y: auto;
      flex: 1;
    }
    .empty {
      font-size: 12px;
      color: var(--text-muted);
      text-align: center;
      padding: 20px 8px;
      line-height: 1.5;
    }
  `,
})
export class FieldInventoryComponent {
  protected readonly store = inject(DesignerStore);
  private readonly dialogs = inject(DialogService);

  protected createField(): void {
    this.dialogs.open({ kind: 'field' });
  }
}
