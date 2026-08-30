import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  FIELD_TYPE_BADGES,
  FIELD_TYPE_DESCRIPTIONS,
  NODE_WIDTH,
  SELECTION_MODE_LABELS,
  type CanvasNode,
  type FieldDefinition,
  type FieldType,
  type SelectionMode,
} from '../../../core/models';

const TYPE_COLORS: Record<FieldType, { bg: string; fg: string }> = {
  text: { bg: '#fef3c7', fg: '#92400e' },
  'single-select': { bg: '#dbeafe', fg: '#1e40af' },
  'multi-select': { bg: '#ede9fe', fg: '#5b21b6' },
};

/**
 * A field placed on the design surface. Purely presentational: it reports pointer intent
 * upward and lets the canvas own the document-level drag listeners.
 */
@Component({
  selector: 'cfd-field-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-node-id]': 'node().fieldId',
    '[class.selected]': 'selected()',
    '[class.drop-target]': 'dropTarget()',
    '[style.left.px]': 'node().x',
    '[style.top.px]': 'node().y',
    '[style.width.px]': 'width',
    '(pointerdown)': 'onSelect($event)',
  },
  template: `
    <header class="head" (pointerdown)="onHeadPointerDown($event)">
      <span class="head-name">{{ field().name }}</span>
      <span
        class="badge"
        [style.background]="colors().bg"
        [style.color]="colors().fg"
        [title]="badgeTitle()"
      >
        {{ badge() }}
        @if (overrideBadge(); as mode) {
          <span class="badge-override">{{ mode }}</span>
        }
      </span>
    </header>

    <div class="body">
      @if (field().type === 'text') {
        <p class="placeholder">Free text input</p>
      } @else if (!field().values.length) {
        <p class="placeholder">No options defined</p>
      } @else {
        @for (value of field().values; track value) {
          <div class="value">
            <span class="dot" [style.background]="colors().fg"></span>{{ value }}
          </div>
        }
      }
    </div>

    <span class="port port-in" aria-hidden="true"></span>
    <button
      type="button"
      class="port port-out"
      title="Drag to connect"
      aria-label="Draw a connection from {{ field().name }}"
      (pointerdown)="onPortPointerDown($event)"
    ></button>
  `,
  styleUrl: './field-node.component.css',
})
export class FieldNodeComponent {
  readonly node = input.required<CanvasNode>();
  readonly field = input.required<FieldDefinition>();
  readonly selected = input(false);
  /** Set when some reveal presents this field as the opposite selection mode. */
  readonly selectionOverride = input<{ mode: SelectionMode; count: number } | null>(null);
  readonly dropTarget = input(false);

  readonly select = output<void>();
  readonly headPointerDown = output<PointerEvent>();
  readonly portPointerDown = output<PointerEvent>();

  protected readonly width = NODE_WIDTH;
  protected readonly badge = computed(() => FIELD_TYPE_BADGES[this.field().type]);

  /** Short label for the mode this field is revealed as, or null when nothing overrides it. */
  protected readonly overrideBadge = computed(() => {
    const override = this.selectionOverride();
    return override ? (override.mode === 'single' ? 'SINGLE' : 'MULTI') : null;
  });

  protected readonly badgeTitle = computed(() => {
    const field = this.field();
    const declared = FIELD_TYPE_DESCRIPTIONS[field.type];
    const override = this.selectionOverride();
    if (!override) return declared;

    const rules = override.count === 1 ? '1 rule reveals' : `${override.count} rules reveal`;
    return `${declared}. ${rules} it as ${SELECTION_MODE_LABELS[override.mode].toLowerCase()}.`;
  });
  protected readonly colors = computed(() => TYPE_COLORS[this.field().type]);

  protected onSelect(event: PointerEvent): void {
    event.stopPropagation();
    this.select.emit();
  }

  protected onHeadPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    event.stopPropagation();
    this.headPointerDown.emit(event);
  }

  protected onPortPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    this.portPointerDown.emit(event);
  }
}
