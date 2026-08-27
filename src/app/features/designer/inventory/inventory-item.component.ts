import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FIELD_TYPE_LABELS, type FieldDefinition } from '../../../core/models';

/** One draggable field chip in the left rail. */
@Component({
  selector: 'cfd-inventory-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.on-canvas]': 'placed()',
    '[attr.draggable]': '!placed()',
    '(dragstart)': 'onDragStart($event)',
  },
  template: `
    <div class="row">
      <span class="name">{{ field().name }}</span>
      <span class="tag">{{ placed() ? 'on canvas' : 'drag me' }}</span>
    </div>
    <div class="meta">{{ meta() }}</div>
  `,
  styles: `
    :host {
      display: block;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 8px;
      background: #fff;
      cursor: grab;
      transition: all 0.15s;
    }
    :host(:hover) {
      border-color: var(--primary);
      box-shadow: 0 2px 8px rgb(79 70 229 / 0.1);
    }
    :host(:active) {
      cursor: grabbing;
      opacity: 0.7;
    }
    :host(.on-canvas) {
      opacity: 0.4;
      cursor: default;
      border-style: dashed;
    }
    :host(.on-canvas:hover) {
      border-color: var(--border);
      box-shadow: none;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
      gap: 8px;
    }
    .name {
      font-weight: 600;
      font-size: 13px;
      color: var(--text-strong);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tag {
      font-size: 10px;
      font-weight: 600;
      color: var(--primary);
      text-transform: uppercase;
      flex-shrink: 0;
    }
    :host(.on-canvas) .tag {
      color: var(--text-muted);
    }
    .meta {
      font-size: 11px;
      color: var(--text-muted);
    }
  `,
})
export class InventoryItemComponent {
  readonly field = input.required<FieldDefinition>();
  readonly placed = input(false);

  protected readonly meta = computed(() => {
    const field = this.field();
    const label = FIELD_TYPE_LABELS[field.type];
    return field.values.length ? `${label} · ${field.values.length} options` : label;
  });

  protected onDragStart(event: DragEvent): void {
    if (this.placed()) {
      event.preventDefault();
      return;
    }
    event.dataTransfer?.setData('text/plain', this.field().id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
  }
}
