import type { SelectionMode } from './field.model';
import type { MatchType } from './rule.model';

/**
 * Runtime restrictions a REVEAL outcome places on a revealed field. Unlike the outcome it
 * comes from, every property here is resolved — the engine normalises the optional ones.
 */
export interface FieldConstraint {
  readonly required: boolean;
  readonly allowed: readonly string[];
  /** `null` means the field renders as its own type. */
  readonly selectionMode: SelectionMode | null;
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
  /** Values set by an AUTOFILL outcome, from a literal the admin typed. */
  readonly autofills: Readonly<Record<string, string>>;
  /**
   * Values the engine settled on by itself: a required field whose constraints left exactly
   * one option has no other legal answer, so it is selected rather than asked for.
   */
  readonly resolved: Readonly<Record<string, string>>;
  readonly explanations: readonly RuleExplanation[];
  readonly errors: readonly string[];
}

export const EMPTY_EVALUATION: EvaluationResult = {
  visible: [],
  constraints: {},
  autofills: {},
  resolved: {},
  explanations: [],
  errors: [],
};
