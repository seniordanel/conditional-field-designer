import type { Rule } from './rule.model';

/** Placement of a field on the design surface. */
export interface CanvasNode {
  readonly fieldId: string;
  readonly x: number;
  readonly y: number;
}

/** What the right-hand properties panel is currently editing. */
export type Selection =
  | { readonly kind: 'node'; readonly fieldId: string }
  | { readonly kind: 'edge'; readonly src: string; readonly target: string };

/** An in-progress connection being dragged out of a node's output port. */
export interface EdgeDraft {
  readonly src: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** All rules that connect one source field to one target field, collapsed into a single arrow. */
export interface CanvasEdge {
  readonly src: string;
  readonly target: string;
  readonly rules: readonly Rule[];
  readonly label: string;
  readonly path: string;
  readonly midX: number;
  readonly midY: number;
}

export interface Viewport {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

/** Node box geometry, shared by the node component and the edge geometry helpers. */
export const NODE_WIDTH = 260;
export const NODE_PORT_OFFSET_Y = 30;
export const CANVAS_SIZE = 6000;
export const GRID_SNAP = 20;
export const MIN_ZOOM = 0.35;
export const MAX_ZOOM = 2;
