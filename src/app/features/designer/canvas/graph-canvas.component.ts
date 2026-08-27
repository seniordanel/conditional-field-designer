import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { CANVAS_SIZE, NODE_PORT_OFFSET_Y, NODE_WIDTH } from '../../../core/models';
import { DesignerStore } from '../../../core/services/designer-store.service';
import { EdgeLabelComponent } from './edge-label.component';
import { FieldNodeComponent } from './field-node.component';
import { GraphEdgeLayerComponent } from './graph-edge-layer.component';

/** Wheel notch → zoom factor. Small enough that a trackpad feels smooth. */
const ZOOM_SENSITIVITY = 0.0015;

/**
 * The pan/zoom design surface, and the one place that owns document-level pointer
 * listeners. Child components stay declarative and just report intent.
 */
@Component({
  selector: 'cfd-graph-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FieldNodeComponent, GraphEdgeLayerComponent, EdgeLabelComponent],
  host: {
    '(pointerdown)': 'onBackgroundPointerDown($event)',
    '(dragover)': 'onDragOver($event)',
    '(drop)': 'onDrop($event)',
    '(wheel)': 'onWheel($event)',
    '(document:keydown.escape)': 'onEscape()',
  },
  templateUrl: './graph-canvas.component.html',
  styleUrl: './graph-canvas.component.css',
})
export class GraphCanvasComponent {
  protected readonly store = inject(DesignerStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly surface = viewChild.required<ElementRef<HTMLElement>>('surface');

  protected readonly canvasSize = CANVAS_SIZE;

  protected readonly transform = computed(() => {
    const { x, y } = this.store.pan();
    return `translate(${x}px, ${y}px) scale(${this.store.zoom()})`;
  });

  protected readonly zoomPercent = computed(() => Math.round(this.store.zoom() * 100));

  protected isNodeSelected(fieldId: string): boolean {
    const selection = this.store.selection();
    return selection?.kind === 'node' && selection.fieldId === fieldId;
  }

  protected isEdgeSelected(src: string, target: string): boolean {
    const selection = this.store.selection();
    return selection?.kind === 'edge' && selection.src === src && selection.target === target;
  }

  /** A node is a valid drop target while a connection is being dragged from another node. */
  protected isDropTarget(fieldId: string): boolean {
    const draft = this.store.edgeDraft();
    return !!draft && draft.src !== fieldId;
  }

  // ----------------------------------------------------------------- panning

  protected onBackgroundPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    const target = event.target as Element | null;
    if (target?.closest('[data-node-id], cfd-edge-label, .hit')) return;

    this.store.clearSelection();

    const origin = this.store.pan();
    const startX = event.clientX;
    const startY = event.clientY;

    this.beginPointerSession((move) => {
      this.store.setPan(origin.x + (move.clientX - startX), origin.y + (move.clientY - startY));
    });
  }

  // -------------------------------------------------------------- node drag

  protected startNodeDrag(event: PointerEvent, fieldId: string): void {
    this.store.selectNode(fieldId);
    let lastX = event.clientX;
    let lastY = event.clientY;

    this.beginPointerSession((move) => {
      const node = this.store.node(fieldId);
      if (!node) return;
      const zoom = this.store.zoom();
      this.store.moveNode(
        fieldId,
        node.x + (move.clientX - lastX) / zoom,
        node.y + (move.clientY - lastY) / zoom,
      );
      lastX = move.clientX;
      lastY = move.clientY;
    });
  }

  // -------------------------------------------------------------- edge draw

  protected startEdgeDraw(event: PointerEvent, src: string): void {
    const node = this.store.node(src);
    if (!node) return;

    const x1 = node.x + NODE_WIDTH;
    const y1 = node.y + NODE_PORT_OFFSET_Y;
    this.store.startEdgeDraft({ src, x1, y1, x2: x1, y2: y1 });

    this.beginPointerSession(
      (move) => {
        const point = this.toSurfaceCoords(move.clientX, move.clientY);
        this.store.moveEdgeDraft(point.x, point.y);
      },
      (up) => {
        const dropped = document
          .elementFromPoint(up.clientX, up.clientY)
          ?.closest('[data-node-id]')
          ?.getAttribute('data-node-id');

        if (dropped) this.store.commitEdgeDraft(dropped);
        else this.store.clearEdgeDraft();
      },
    );
  }

  protected onEscape(): void {
    this.store.clearEdgeDraft();
  }

  // ------------------------------------------------------- drop from rail

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    const fieldId = event.dataTransfer?.getData('text/plain');
    if (!fieldId) return;
    const point = this.toSurfaceCoords(event.clientX, event.clientY);
    this.store.placeNode(fieldId, point.x, point.y);
  }

  // ------------------------------------------------------------------ zoom

  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    const rect = this.host.nativeElement.getBoundingClientRect();
    this.store.zoomAt(
      Math.exp(-event.deltaY * ZOOM_SENSITIVITY),
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
  }

  protected stepZoom(factor: number): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    this.store.zoomAt(factor, rect.width / 2, rect.height / 2);
  }

  // --------------------------------------------------------------- helpers

  /** Converts a viewport point into untransformed canvas coordinates. */
  private toSurfaceCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.surface().nativeElement.getBoundingClientRect();
    const zoom = this.store.zoom();
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  }

  /**
   * Runs a drag until the pointer is released, cleaning up on teardown so a drag in
   * progress can never outlive the component.
   */
  private beginPointerSession(
    onMove: (event: PointerEvent) => void,
    onUp?: (event: PointerEvent) => void,
  ): void {
    const move = (event: PointerEvent) => onMove(event);
    const up = (event: PointerEvent) => {
      stop();
      onUp?.(event);
    };
    const stop = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    this.destroyRef.onDestroy(stop);
  }
}
