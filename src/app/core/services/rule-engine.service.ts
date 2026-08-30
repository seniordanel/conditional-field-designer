import { Injectable } from '@angular/core';
import {
  MATCH_TYPE_PRIORITY,
  isAutofill,
  isReveal,
  type CanvasNode,
  type EvaluationResult,
  type FieldConstraint,
  type FieldDefinition,
  type FieldValue,
  type Rule,
  type RuleExplanation,
  type RuleOutcome,
} from '../models';

/** Guards against rule cycles (A reveals B, B reveals A) locking the UI up. */
const MAX_ITERATIONS = 50;

export interface EvaluationInput {
  readonly fields: readonly FieldDefinition[];
  readonly nodes: readonly CanvasNode[];
  readonly rules: readonly Rule[];
  readonly inputs: Readonly<Record<string, FieldValue>>;
}

/**
 * Pure, stateless evaluation of the rule graph.
 *
 * Fields that no rule targets are "roots" and are always visible; everything else
 * appears only once a rule reveals or auto-fills it. Because revealing a field can
 * let its own rules fire, evaluation runs to a fixpoint.
 */
@Injectable({ providedIn: 'root' })
export class RuleEngineService {
  evaluate({ fields, nodes, rules, inputs }: EvaluationInput): EvaluationResult {
    const fieldById = new Map(fields.map((f) => [f.id, f]));
    const onCanvas = new Set(nodes.map((n) => n.fieldId));

    const targeted = new Set<string>();
    for (const rule of rules) {
      for (const outcome of rule.outcomes) targeted.add(outcome.target);
    }

    const visible = new Set(
      fields.filter((f) => onCanvas.has(f.id) && !targeted.has(f.id)).map((f) => f.id),
    );
    const constraints: Record<string, FieldConstraint> = {};
    const autofills: Record<string, string> = {};
    const resolved: Record<string, string> = {};
    const errors: string[] = [];

    // An explicit auto-fill outranks a value the engine settled on, which outranks the answer
    // the user typed — a locked field's own input can no longer be what drives the rules.
    const valueOf = (fieldId: string): FieldValue | undefined =>
      autofills[fieldId] ?? resolved[fieldId] ?? inputs[fieldId];

    let changed = true;
    let iterations = 0;

    while (changed && iterations < MAX_ITERATIONS) {
      changed = false;
      iterations++;

      for (const rule of this.winningRules(rules, visible, valueOf)) {
        for (const outcome of rule.outcomes) {
          if (!fieldById.has(outcome.target) || !onCanvas.has(outcome.target)) continue;

          if (isAutofill(outcome)) {
            if (!visible.has(outcome.target) || autofills[outcome.target] !== outcome.value) {
              visible.add(outcome.target);
              autofills[outcome.target] = outcome.value;
              changed = true;
            }
          } else if (!visible.has(outcome.target)) {
            visible.add(outcome.target);
            constraints[outcome.target] = {
              required: outcome.required,
              allowed: outcome.allowed,
              selectionMode: outcome.selectionMode ?? null,
            };

            // A required field left with a single option has no other legal answer, so settle
            // it here. `changed` is already true, so the next pass sees the value and any rule
            // keyed on this field fires — which is what lets one choice complete a whole chain.
            const only = this.onlyOption(outcome, fieldById.get(outcome.target));
            if (only !== null) resolved[outcome.target] = only;

            changed = true;
          }
        }
      }
    }

    if (iterations >= MAX_ITERATIONS) {
      errors.push('Cycle detected — evaluation halted.');
    }

    // Explanations are derived once from the converged state so each firing rule is
    // reported exactly once, however many passes it took to settle.
    const explanations = this.winningRules(rules, visible, valueOf).map((rule) =>
      this.explain(rule, fieldById, valueOf(rule.src)),
    );

    return { visible: [...visible], constraints, autofills, resolved, explanations, errors };
  }

  /**
   * Rules whose source is visible and whose condition holds. When several rules share a
   * source, only the most specific match type fires — but every rule at that priority does,
   * so one field can drive multiple targets.
   */
  private winningRules(
    rules: readonly Rule[],
    visible: ReadonlySet<string>,
    valueOf: (fieldId: string) => FieldValue | undefined,
  ): Rule[] {
    const bySource = new Map<string, Rule[]>();

    for (const rule of rules) {
      if (!visible.has(rule.src)) continue;
      if (!this.matches(rule, valueOf(rule.src))) continue;
      const bucket = bySource.get(rule.src);
      if (bucket) bucket.push(rule);
      else bySource.set(rule.src, [rule]);
    }

    const winners: Rule[] = [];
    for (const bucket of bySource.values()) {
      const topPriority = Math.max(...bucket.map((r) => MATCH_TYPE_PRIORITY[r.matchType]));
      winners.push(...bucket.filter((r) => MATCH_TYPE_PRIORITY[r.matchType] === topPriority));
    }
    return winners;
  }

  /**
   * The single value a REVEAL leaves available, or null when the user still has a real choice.
   * Only mandatory fields settle themselves — an optional field may legitimately stay blank.
   */
  private onlyOption(outcome: RuleOutcome, target: FieldDefinition | undefined): string | null {
    if (!target || target.type === 'text') return null;
    if (!isReveal(outcome) || !outcome.required) return null;

    const options = outcome.allowed.length ? outcome.allowed : target.values;
    return options.length === 1 ? options[0] : null;
  }

  private matches(rule: Rule, value: FieldValue | undefined): boolean {
    if (!rule.matchValues.length) return false;
    if (value === undefined || value === null || value === '') return false;

    const actual = Array.isArray(value) ? value : [value as string];
    if (!actual.length) return false;

    switch (rule.matchType) {
      case 'EXACT':
        return (
          rule.matchValues.length === actual.length &&
          rule.matchValues.every((v) => actual.includes(v))
        );
      case 'CONTAINS_ALL':
        return rule.matchValues.every((v) => actual.includes(v));
      case 'CONTAINS_ANY':
        return rule.matchValues.some((v) => actual.includes(v));
    }
  }

  private explain(
    rule: Rule,
    fieldById: ReadonlyMap<string, FieldDefinition>,
    value: FieldValue | undefined,
  ): RuleExplanation {
    const effects = rule.outcomes
      .map((outcome) => {
        const target = fieldById.get(outcome.target);
        if (!target) return '';
        if (isAutofill(outcome)) return `Auto-fill ${target.name} = "${outcome.value}"`;

        const only = this.onlyOption(outcome, target);
        return only !== null
          ? `Reveal ${target.name} = "${only}" (only option)`
          : `Reveal ${target.name}`;
      })
      .filter(Boolean);

    return {
      fieldName: fieldById.get(rule.src)?.name ?? rule.src,
      value: Array.isArray(value) ? value.join(', ') : ((value as string) ?? ''),
      matchType: rule.matchType,
      matchValues: rule.matchValues,
      effects,
    };
  }
}
