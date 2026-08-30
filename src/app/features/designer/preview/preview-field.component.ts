import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { FieldDefinition, FieldType, FieldValue } from '../../../core/models';

/**
 * One rendered end-user input. Presentational — it never reads the store, so the same
 * component could be reused by a real runtime renderer.
 */
@Component({
  selector: 'cfd-preview-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.autofilled]': 'locked()' },
  template: `
    <label class="label" [attr.for]="inputId()">
      <span>
        {{ field().name }}
        @if (required()) {
          <span class="required" aria-hidden="true">*</span>
        }
      </span>
      @if (autofilled()) {
        <span class="auto">Auto</span>
      } @else if (onlyOption()) {
        <span class="auto sole">Only option</span>
      }
    </label>

    @switch (renderType()) {
      @case ('text') {
        <input
          type="text"
          class="form-control"
          [id]="inputId()"
          [value]="singleValue()"
          [readOnly]="locked()"
          (change)="valueChange.emit($any($event.target).value)"
        />
      }
      @case ('single-select') {
        <select
          class="form-control"
          [id]="inputId()"
          [disabled]="locked()"
          (change)="valueChange.emit($any($event.target).value)"
        >
          <option value="" [selected]="!singleValue()">— Select —</option>
          @for (option of options(); track option) {
            <option [value]="option" [selected]="singleValue() === option">{{ option }}</option>
          }
        </select>
      }
      @default {
        <div class="checks">
          @for (option of options(); track option) {
            <label class="checkbox-row">
              <input
                type="checkbox"
                [disabled]="locked()"
                [checked]="isChecked(option)"
                (change)="optionToggle.emit(option)"
              />
              {{ option }}
            </label>
          } @empty {
            <p class="none">No options available.</p>
          }
        </div>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: 14px;
    }
    :host(.autofilled) {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px;
    }
    .label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-weight: 600;
      font-size: 13px;
      color: var(--text-body);
      margin-bottom: 6px;
    }
    .required {
      color: var(--danger);
    }
    .auto {
      font-size: 10px;
      background: #dbeafe;
      color: #1e40af;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .auto.sole {
      background: #e2e8f0;
      color: #475569;
    }
    .checks {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .none {
      font-size: 12px;
      color: var(--text-muted);
      font-style: italic;
    }
  `,
})
export class PreviewFieldComponent {
  readonly field = input.required<FieldDefinition>();
  readonly value = input<FieldValue>();
  readonly options = input<readonly string[]>([]);
  readonly required = input(false);
  readonly autofilled = input(false);
  readonly onlyOption = input(false);
  /** Overrides how the field renders; `null` falls back to the field's own type. */
  readonly selectionType = input<FieldType | null>(null);

  readonly valueChange = output<string>();
  readonly optionToggle = output<string>();

  protected readonly inputId = computed(() => `preview-${this.field().id}`);
  protected readonly renderType = computed(() => this.selectionType() ?? this.field().type);
  protected readonly locked = computed(() => this.autofilled() || this.onlyOption());

  protected readonly singleValue = computed(() => {
    const value = this.value();
    return Array.isArray(value) ? (value[0] ?? '') : ((value as string) ?? '');
  });

  protected isChecked(option: string): boolean {
    const value = this.value();
    return Array.isArray(value) ? value.includes(option) : value === option;
  }
}
