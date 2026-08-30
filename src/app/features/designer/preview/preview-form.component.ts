import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import type { FieldDefinition, FieldValue } from '../../../core/models';
import { DesignerStore } from '../../../core/services/designer-store.service';
import { PreviewFieldComponent } from './preview-field.component';

interface PreviewRow {
  readonly field: FieldDefinition;
  readonly value: FieldValue | undefined;
  readonly options: readonly string[];
  readonly required: boolean;
  readonly autofilled: boolean;
  /** Locked because the constraints left exactly one legal answer, not because of an auto-fill. */
  readonly onlyOption: boolean;
}

/** The form an end user would actually see, rebuilt on every rule evaluation. */
@Component({
  selector: 'cfd-preview-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PreviewFieldComponent],
  template: `
    @if (store.evaluation().errors.length) {
      <div class="errors" role="alert">
        @for (error of store.evaluation().errors; track error) {
          <div>{{ error }}</div>
        }
      </div>
    }

    @for (row of rows(); track row.field.id) {
      <cfd-preview-field
        [field]="row.field"
        [value]="row.value"
        [options]="row.options"
        [required]="row.required"
        [autofilled]="row.autofilled"
        [onlyOption]="row.onlyOption"
        (valueChange)="store.setPreviewValue(row.field.id, $event)"
        (optionToggle)="store.togglePreviewValue(row.field.id, $event)"
      />
    } @empty {
      <p class="empty">No active fields on canvas.</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .errors {
      background: var(--danger-light);
      border: 1px solid #fca5a5;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 12px;
      font-size: 13px;
      color: #991b1b;
      font-weight: 600;
    }
    .empty {
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
      padding: 20px;
    }
  `,
})
export class PreviewFormComponent {
  protected readonly store = inject(DesignerStore);

  /**
   * Turns the raw evaluation result into rows the field component can render, resolving
   * which value wins (auto-filled beats typed) and which options survive the constraints.
   */
  protected readonly rows = computed<PreviewRow[]>(() => {
    const evaluation = this.store.evaluation();
    const inputs = this.store.previewInputs();
    const rows: PreviewRow[] = [];

    for (const fieldId of evaluation.visible) {
      const field = this.store.field(fieldId);
      if (!field) continue;

      const autofill = evaluation.autofills[fieldId];
      const resolved = evaluation.resolved[fieldId];
      const constraint = evaluation.constraints[fieldId];
      const allowed = constraint?.allowed ?? [];

      rows.push({
        field,
        value: autofill ?? resolved ?? inputs[fieldId],
        options: allowed.length ? allowed : field.values,
        required: constraint?.required ?? false,
        autofilled: autofill !== undefined,
        onlyOption: autofill === undefined && resolved !== undefined,
      });
    }
    return rows;
  });
}
