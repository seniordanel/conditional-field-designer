import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CANVAS_SIZE } from '../../../core/models';
import { DesignerStore } from '../../../core/services/designer-store.service';
import { bezierPath } from '../../../core/services/edge.util';

/**
 * SVG layer beneath the nodes. Each connection is drawn twice: a fat transparent
 * "hit" stroke that is easy to click, and the visible hairline on top.
 */
@Component({
  selector: 'cfd-graph-edge-layer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size" [attr.height]="size" [attr.viewBox]="viewBox" overflow="visible">
      <defs>
        <marker id="cfd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L10 5 L0 10z" fill="#94a3b8" />
        </marker>
        <marker id="cfd-arrow-sel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L10 5 L0 10z" fill="#4f46e5" />
        </marker>
      </defs>

      @for (edge of store.edges(); track edge.src + '>' + edge.target) {
        @let active = isSelected(edge.src, edge.target);
        <path class="hit" [attr.d]="edge.path" (click)="store.selectEdge(edge.src, edge.target)" />
        <path
          class="line"
          [attr.d]="edge.path"
          [attr.stroke]="active ? '#4f46e5' : '#94a3b8'"
          [attr.stroke-width]="active ? 3 : 2"
          [attr.marker-end]="active ? 'url(#cfd-arrow-sel)' : 'url(#cfd-arrow)'"
        />
      }

      @if (draftPath(); as path) {
        <path class="draft" [attr.d]="path" />
      }
    </svg>
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    svg {
      position: absolute;
      top: 0;
      left: 0;
    }
    .hit {
      fill: none;
      stroke: transparent;
      stroke-width: 18;
      pointer-events: stroke;
      cursor: pointer;
    }
    .line {
      fill: none;
      pointer-events: none;
      transition: stroke 0.15s;
    }
    .draft {
      fill: none;
      stroke: var(--primary);
      stroke-width: 2;
      stroke-dasharray: 6 4;
      pointer-events: none;
    }
  `,
})
export class GraphEdgeLayerComponent {
  protected readonly store = inject(DesignerStore);
  protected readonly size = CANVAS_SIZE;
  protected readonly viewBox = `0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`;

  protected readonly draftPath = computed(() => {
    const draft = this.store.edgeDraft();
    return draft ? bezierPath(draft.x1, draft.y1, draft.x2, draft.y2) : null;
  });

  protected isSelected(src: string, target: string): boolean {
    const selection = this.store.selection();
    return selection?.kind === 'edge' && selection.src === src && selection.target === target;
  }
}
