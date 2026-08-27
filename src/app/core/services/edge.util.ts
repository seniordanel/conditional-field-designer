import {
  MATCH_TYPE_SYMBOLS,
  NODE_PORT_OFFSET_Y,
  NODE_WIDTH,
  isAutofill,
  type CanvasEdge,
  type CanvasNode,
  type Rule,
} from '../models';

/** Horizontal cubic bezier between an output port and an input port. */
export function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max(Math.abs(x2 - x1) * 0.5, 60);
  return `M${x1} ${y1} C${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

/**
 * Collapses every rule linking `src` to `target` into one arrow, since the canvas draws a
 * single connection per field pair no matter how many rules sit behind it.
 */
export function buildEdges(
  nodes: readonly CanvasNode[],
  rules: readonly Rule[],
): CanvasEdge[] {
  const nodeById = new Map(nodes.map((n) => [n.fieldId, n]));
  const grouped = new Map<string, { src: string; target: string; rules: Rule[] }>();

  for (const rule of rules) {
    for (const outcome of rule.outcomes) {
      const key = `${rule.src}>${outcome.target}`;
      let entry = grouped.get(key);
      if (!entry) {
        entry = { src: rule.src, target: outcome.target, rules: [] };
        grouped.set(key, entry);
      }
      if (!entry.rules.includes(rule)) entry.rules.push(rule);
    }
  }

  const edges: CanvasEdge[] = [];
  for (const { src, target, rules: edgeRules } of grouped.values()) {
    const from = nodeById.get(src);
    const to = nodeById.get(target);
    if (!from || !to) continue;

    const x1 = from.x + NODE_WIDTH;
    const y1 = from.y + NODE_PORT_OFFSET_Y;
    const x2 = to.x;
    const y2 = to.y + NODE_PORT_OFFSET_Y;

    edges.push({
      src,
      target,
      rules: edgeRules,
      label: summarizeEdge(edgeRules, target),
      path: bezierPath(x1, y1, x2, y2),
      midX: (x1 + x2) / 2,
      midY: (y1 + y2) / 2,
    });
  }
  return edges;
}

/** e.g. `show+fill if = [London HQ] or has any [1, 2]`. */
export function summarizeEdge(rules: readonly Rule[], target: string): string {
  if (!rules.length) return '';

  const conditions = rules.map((rule) => {
    const values = rule.matchValues.length ? rule.matchValues.join(', ') : '?';
    return `${MATCH_TYPE_SYMBOLS[rule.matchType]} [${values}]`;
  });

  const effects = new Set<string>();
  for (const rule of rules) {
    for (const outcome of rule.outcomes) {
      if (outcome.target === target) effects.add(isAutofill(outcome) ? 'fill' : 'show');
    }
  }

  return `${[...effects].join('+')} if ${conditions.join(' or ')}`;
}

export function truncateLabel(label: string, max = 40): string {
  return label.length > max ? `${label.slice(0, max - 2)}…` : label;
}
