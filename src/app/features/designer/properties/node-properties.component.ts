import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FIELD_TYPE_DESCRIPTIONS, type FieldDefinition } from '../../../core/models';
import { DesignerStore } from '../../../core/services/designer-store.service';
import { DialogService } from '../../../core/services/dialog.service';

/** Properties for a single field node. */
@Component({
  selector: 'cfd-node-properties',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="head">
      <div class="name">{{ field().name }}</div>
      <div class="type">{{ description() }}</div>
    </header>

    <section class="section">
      <button type="button" class="btn btn-primary btn-sm btn-block" (click)="edit()">
        Edit Field
      </button>
      <button type="button" class="btn btn-danger-ghost btn-sm btn-block remove" (click)="remove()">
        Remove from Canvas
      </button>
    </section>

    @if (field().values.length) {
      <section class="section">
        <h3 class="section-title">Defined Values</h3>
        <ul class="values">
          @for (value of field().values; track value) {
            <li>{{ value }}</li>
          }
        </ul>
      </section>
    }
  `,
  styles: `
    .head {
      padding: 20px;
      border-bottom: 1px solid var(--border);
      background: var(--surface-muted);
    }
    .name {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-strong);
      margin-bottom: 4px;
    }
    .type {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .section {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }
    .remove {
      margin-top: 8px;
    }
    .section-title {
      margin-bottom: 8px;
    }
    .values {
      list-style: none;
    }
    .values li {
      padding: 5px 0;
      font-size: 13px;
      color: var(--text-body);
      border-bottom: 1px solid #f1f5f9;
    }
    .values li:last-child {
      border-bottom: none;
    }
  `,
})
export class NodePropertiesComponent {
  readonly field = input.required<FieldDefinition>();

  private readonly store = inject(DesignerStore);
  private readonly dialogs = inject(DialogService);

  protected readonly description = computed(() => FIELD_TYPE_DESCRIPTIONS[this.field().type]);

  protected edit(): void {
    this.dialogs.open({ kind: 'field', fieldId: this.field().id });
  }

  protected remove(): void {
    const fieldId = this.field().id;
    if (!this.store.hasConnectedRules(fieldId)) {
      this.store.removeNode(fieldId);
      return;
    }
    this.dialogs.confirm({
      title: 'Remove from canvas',
      message: `"${this.field().name}" is used by existing rules. Removing it deletes those rules too.`,
      confirmLabel: 'Remove field',
      danger: true,
      onConfirm: () => this.store.removeNode(fieldId),
    });
  }
}
