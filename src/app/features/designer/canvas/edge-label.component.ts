import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { truncateLabel } from '../../../core/services/edge.util';
import type { CanvasEdge } from '../../../core/models';

/** Floating summary chip on a connection — clicking it selects the connection. */
@Component({
  selector: 'cfd-edge-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.selected]': 'selected()',
    '[style.left.px]': 'edge().midX',
    '[style.top.px]': 'edge().midY',
    '[title]': 'edge().label',
    '(click)': 'select.emit()',
  },
  template: `{{ text() }}`,
  styles: `
    :host {
      position: absolute;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 10px;
      font-weight: 600;
      color: var(--text-muted);
      white-space: nowrap;
      pointer-events: auto;
      cursor: pointer;
      box-shadow: var(--shadow);
      transition: all 0.15s;
      transform: translate(-50%, -50%);
      z-index: 4;
    }
    :host(:hover) {
      border-color: var(--primary);
      color: var(--primary);
      box-shadow: 0 0 0 2px var(--primary-light);
    }
    :host(.selected) {
      border-color: var(--primary);
      color: var(--primary);
      background: var(--primary-bg);
    }
  `,
})
export class EdgeLabelComponent {
  readonly edge = input.required<CanvasEdge>();
  readonly selected = input(false);
  readonly select = output<void>();

  protected readonly text = computed(() => truncateLabel(this.edge().label));
}
