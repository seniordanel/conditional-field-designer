import type { MatchType } from './rule.model';

/** Runtime restrictions a REVEAL outcome places on a revealed field. */
export interface FieldConstraint {
  readonly required: boolean;
  readonly allowed: readonly string[];
}

/** One "why did this happen?" entry shown next to the live preview. */
export interface RuleExplanation {
  readonly fieldName: string;
  readonly value: string;
  readonly matchType: MatchType;
  readonly matchValues: readonly string[];
  readonly effects: readonly string[];
}

/** The complete outcome of running every rule against the current preview input. */
export interface EvaluationResult {
  readonly visible: readonly string[];
  readonly constraints: Readonly<Record<string, FieldConstraint>>;
  readonly autofills: Readonly<Record<string, string>>;
  readonly explanations: readonly RuleExplanation[];
  readonly errors: readonly string[];
}

export const EMPTY_EVALUATION: EvaluationResult = {
  visible: [],
  constraints: {},
  autofills: {},
  explanations: [],
  errors: [],
};
