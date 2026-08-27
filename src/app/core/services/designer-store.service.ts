import { Injectable, computed, inject, signal } from '@angular/core';
import {
  GRID_SNAP,
  MAX_ZOOM,
  MIN_ZOOM,
  type AutofillOutcome,
  type CanvasNode,
  type DesignerSchema,
  type EdgeDraft,
  type FieldDefinition,
  type FieldType,
  type FieldValue,
  type RevealOutcome,
  type Rule,
  type RuleOutcome,
  type Selection,
} from '../models';
import { RuleEngineService } from './rule-engine.service';
import { buildEdges } from './edge.util';
import { createInitialDesign } from './initial-design';
import { createId } from './id.util';

export interface FieldDraft {
  name: string;
  type: FieldType;
  values: string[];
}

/**
 * Single source of truth for the designer.
 *
 * Everything downstream — canvas, properties panel, live preview, save payload — is a
 * `computed` off these few writable signals, so there is never a second copy to keep in sync.
 */
@Injectable({ providedIn: 'root' })
export class DesignerStore {
  private readonly engine = inject(RuleEngineService);

  private readonly seed = createInitialDesign();

  private readonly _fields = signal<readonly FieldDefinition[]>(this.seed.fields);
  private readonly _nodes = signal<readonly CanvasNode[]>(this.seed.nodes);
  private readonly _rules = signal<readonly Rule[]>(this.seed.rules);
  private readonly _selection = signal<Selection | null>(null);
  private readonly _previewInputs = signal<Readonly<Record<string, FieldValue>>>({});
  private readonly _pan = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  private readonly _zoom = signal(1);
  private readonly _edgeDraft = signal<EdgeDraft | null>(null);
  private readonly _lastSavedJson = signal<string | null>(null);

  readonly fields = this._fields.asReadonly();
  readonly nodes = this._nodes.asReadonly();
  readonly rules = this._rules.asReadonly();
  readonly selection = this._selection.asReadonly();
  readonly previewInputs = this._previewInputs.asReadonly();
  readonly pan = this._pan.asReadonly();
  readonly zoom = this._zoom.asReadonly();
  readonly edgeDraft = this._edgeDraft.asReadonly();

  readonly fieldById = computed(() => new Map(this._fields().map((f) => [f.id, f])));
  readonly placedFieldIds = computed(() => new Set(this._nodes().map((n) => n.fieldId)));
  readonly edges = computed(() => buildEdges(this._nodes(), this._rules()));

  readonly evaluation = computed(() =>
    this.engine.evaluate({
      fields: this._fields(),
      nodes: this._nodes(),
      rules: this._rules(),
      inputs: this._previewInputs(),
    }),
  );

  readonly selectedField = computed(() => {
    const selection = this._selection();
    return selection?.kind === 'node' ? (this.fieldById().get(selection.fieldId) ?? null) : null;
  });

  /** Endpoints of the selected arrow, or null when an arrow is not selected. */
  readonly selectedEdge = computed(() => {
    const selection = this._selection();
    return selection?.kind === 'edge' ? { src: selection.src, target: selection.target } : null;
  });

  /** Rules behind the currently selected arrow, in declaration order. */
  readonly selectedEdgeRules = computed(() => {
    const selection = this._selection();
    if (selection?.kind !== 'edge') return [];
    return this._rules().filter(
      (rule) =>
        rule.src === selection.src && rule.outcomes.some((o) => o.target === selection.target),
    );
  });

  readonly schema = computed<DesignerSchema>(() => ({
    version: 1,
    fields: this._fields(),
    layout: this._nodes(),
    rules: this._rules(),
  }));

  readonly isDirty = computed(
    () => JSON.stringify(this.schema()) !== this._lastSavedJson(),
  );

  field(fieldId: string): FieldDefinition | undefined {
    return this.fieldById().get(fieldId);
  }

  fieldName(fieldId: string): string {
    return this.field(fieldId)?.name ?? fieldId;
  }

  // ---------------------------------------------------------------- selection

  selectNode(fieldId: string): void {
    this._selection.set({ kind: 'node', fieldId });
  }

  selectEdge(src: string, target: string): void {
    this._selection.set({ kind: 'edge', src, target });
  }

  clearSelection(): void {
    this._selection.set(null);
  }

  // ------------------------------------------------------------------- fields

  createField(draft: FieldDraft): FieldDefinition {
    const field: FieldDefinition = {
      id: createId('f'),
      name: draft.name,
      type: draft.type,
      values: draft.type === 'text' ? [] : draft.values,
    };
    this._fields.update((fields) => [...fields, field]);
    return field;
  }

  updateField(fieldId: string, draft: FieldDraft): void {
    this._fields.update((fields) =>
      fields.map((field) =>
        field.id === fieldId
          ? { ...field, name: draft.name, type: draft.type, values: draft.type === 'text' ? [] : draft.values }
          : field,
      ),
    );
  }

  // -------------------------------------------------------------------- nodes

  /** Places a field on the canvas, snapped to the grid. No-ops if it is already there. */
  placeNode(fieldId: string, x: number, y: number): void {
    if (this.placedFieldIds().has(fieldId)) return;
    const snapped: CanvasNode = {
      fieldId,
      x: Math.round(x / GRID_SNAP) * GRID_SNAP,
      y: Math.round(y / GRID_SNAP) * GRID_SNAP,
    };
    this._nodes.update((nodes) => [...nodes, snapped]);
    this.selectNode(fieldId);
  }

  moveNode(fieldId: string, x: number, y: number): void {
    this._nodes.update((nodes) =>
      nodes.map((node) => (node.fieldId === fieldId ? { ...node, x, y } : node)),
    );
  }

  node(fieldId: string): CanvasNode | undefined {
    return this._nodes().find((n) => n.fieldId === fieldId);
  }

  /** True when removing this field would also destroy rules. */
  hasConnectedRules(fieldId: string): boolean {
    return this._rules().some(
      (rule) => rule.src === fieldId || rule.outcomes.some((o) => o.target === fieldId),
    );
  }

  removeNode(fieldId: string): void {
    this._rules.update((rules) =>
      rules
        .filter((rule) => rule.src !== fieldId)
        .map((rule) => ({ ...rule, outcomes: rule.outcomes.filter((o) => o.target !== fieldId) })),
    );
    this._nodes.update((nodes) => nodes.filter((node) => node.fieldId !== fieldId));
    this.clearSelection();
  }

  // -------------------------------------------------------------------- rules

  rule(ruleId: string): Rule | undefined {
    return this._rules().find((r) => r.id === ruleId);
  }

  /** Creates an empty "reveal" rule for a connection the user just drew. */
  addRule(src: string, target: string): Rule {
    const sourceField = this.field(src);
    const rule: Rule = {
      id: createId('r'),
      src,
      matchType: sourceField?.type === 'text' ? 'CONTAINS_ANY' : 'EXACT',
      matchValues: [],
      outcomes: [{ id: createId('o'), type: 'REVEAL', target, required: false, allowed: [] }],
    };
    this._rules.update((rules) => [...rules, rule]);
    return rule;
  }

  updateRuleCondition(ruleId: string, matchType: Rule['matchType'], matchValues: string[]): void {
    this._rules.update((rules) =>
      rules.map((rule) => (rule.id === ruleId ? { ...rule, matchType, matchValues } : rule)),
    );
  }

  deleteRule(ruleId: string): void {
    this._rules.update((rules) => rules.filter((rule) => rule.id !== ruleId));
  }

  addOutcome(ruleId: string, target: string, type: RuleOutcome['type']): void {
    const outcome: RuleOutcome =
      type === 'AUTOFILL'
        ? { id: createId('o'), type: 'AUTOFILL', target, value: '' }
        : { id: createId('o'), type: 'REVEAL', target, required: false, allowed: [] };

    this._rules.update((rules) =>
      rules.map((rule) =>
        rule.id === ruleId ? { ...rule, outcomes: [...rule.outcomes, outcome] } : rule,
      ),
    );
  }

  updateAutofill(ruleId: string, outcomeId: string, value: string): void {
    this.patchOutcome(ruleId, outcomeId, (outcome) => ({ ...(outcome as AutofillOutcome), value }));
  }

  updateReveal(ruleId: string, outcomeId: string, required: boolean, allowed: string[]): void {
    this.patchOutcome(ruleId, outcomeId, (outcome) => ({
      ...(outcome as RevealOutcome),
      required,
      allowed,
    }));
  }

  deleteOutcome(ruleId: string, outcomeId: string): void {
    this._rules.update((rules) =>
      rules.map((rule) =>
        rule.id === ruleId
          ? { ...rule, outcomes: rule.outcomes.filter((o) => o.id !== outcomeId) }
          : rule,
      ),
    );
  }

  outcome(ruleId: string, outcomeId: string): RuleOutcome | undefined {
    return this.rule(ruleId)?.outcomes.find((o) => o.id === outcomeId);
  }

  private patchOutcome(
    ruleId: string,
    outcomeId: string,
    patch: (outcome: RuleOutcome) => RuleOutcome,
  ): void {
    this._rules.update((rules) =>
      rules.map((rule) =>
        rule.id === ruleId
          ? { ...rule, outcomes: rule.outcomes.map((o) => (o.id === outcomeId ? patch(o) : o)) }
          : rule,
      ),
    );
  }

  // ----------------------------------------------------------------- viewport

  setPan(x: number, y: number): void {
    this._pan.set({ x, y });
  }

  /** Zooms around a focal point in screen space so the cursor stays put. */
  zoomAt(delta: number, focalX: number, focalY: number): void {
    const current = this._zoom();
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current * delta));
    if (next === current) return;

    const { x, y } = this._pan();
    const ratio = next / current;
    this._pan.set({ x: focalX - (focalX - x) * ratio, y: focalY - (focalY - y) * ratio });
    this._zoom.set(next);
  }

  startEdgeDraft(draft: EdgeDraft): void {
    this._edgeDraft.set(draft);
  }

  moveEdgeDraft(x2: number, y2: number): void {
    this._edgeDraft.update((draft) => (draft ? { ...draft, x2, y2 } : null));
  }

  clearEdgeDraft(): void {
    this._edgeDraft.set(null);
  }

  /**
   * Completes a dragged connection. Reuses the existing rule set when the two fields are
   * already linked, so dragging the same arrow twice does not create duplicates.
   */
  commitEdgeDraft(target: string): void {
    const draft = this._edgeDraft();
    this._edgeDraft.set(null);
    if (!draft || draft.src === target) return;

    const exists = this._rules().some(
      (rule) => rule.src === draft.src && rule.outcomes.some((o) => o.target === target),
    );
    if (!exists) this.addRule(draft.src, target);
    this.selectEdge(draft.src, target);
  }

  // ------------------------------------------------------------------ preview

  setPreviewValue(fieldId: string, value: string): void {
    this._previewInputs.update((inputs) => {
      const next = { ...inputs };
      if (!value) delete next[fieldId];
      else next[fieldId] = value;
      return next;
    });
  }

  togglePreviewValue(fieldId: string, option: string): void {
    this._previewInputs.update((inputs) => {
      const current = inputs[fieldId];
      const list = Array.isArray(current) ? [...current] : current ? [current as string] : [];
      const index = list.indexOf(option);
      if (index >= 0) list.splice(index, 1);
      else list.push(option);

      const next = { ...inputs };
      if (!list.length) delete next[fieldId];
      else next[fieldId] = list;
      return next;
    });
  }

  clearPreview(): void {
    this._previewInputs.set({});
  }

  // -------------------------------------------------------------------- reset

  markSaved(): void {
    this._lastSavedJson.set(JSON.stringify(this.schema()));
  }

  reset(): void {
    const fresh = createInitialDesign();
    this._fields.set(fresh.fields);
    this._nodes.set(fresh.nodes);
    this._rules.set(fresh.rules);
    this._selection.set(null);
    this._previewInputs.set({});
    this._pan.set({ x: 0, y: 0 });
    this._zoom.set(1);
    this._edgeDraft.set(null);
    this._lastSavedJson.set(null);
  }
}
