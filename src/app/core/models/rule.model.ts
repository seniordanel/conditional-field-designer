/**
 * How a rule compares its `matchValues` against the source field's value.
 * Priority matters during evaluation: EXACT beats CONTAINS_ALL beats CONTAINS_ANY.
 */
export type MatchType = 'EXACT' | 'CONTAINS_ALL' | 'CONTAINS_ANY';

export type OutcomeType = 'REVEAL' | 'AUTOFILL';

/** Shows a downstream field, optionally narrowing its options. */
export interface RevealOutcome {
  readonly id: string;
  readonly type: 'REVEAL';
  readonly target: string;
  readonly required: boolean;
  /** Subset of the target's values the user may pick. Empty means "all". */
  readonly allowed: readonly string[];
}

/** Shows a downstream field and locks it to a fixed value. */
export interface AutofillOutcome {
  readonly id: string;
  readonly type: 'AUTOFILL';
  readonly target: string;
  readonly value: string;
}

export type RuleOutcome = RevealOutcome | AutofillOutcome;

/** "If <src> <matchType> <matchValues> then <outcomes>". */
export interface Rule {
  readonly id: string;
  readonly src: string;
  readonly matchType: MatchType;
  readonly matchValues: readonly string[];
  readonly outcomes: readonly RuleOutcome[];
}

export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  EXACT: 'Is Exactly (highest priority)',
  CONTAINS_ALL: 'Contains All',
  CONTAINS_ANY: 'Contains Any (lowest priority)',
};

/** Reads naturally inside "If Building <verb> ...". */
export const MATCH_TYPE_VERBS: Record<MatchType, string> = {
  EXACT: 'is exactly',
  CONTAINS_ALL: 'contains all of',
  CONTAINS_ANY: 'contains any of',
};

/** Compact form used on canvas edge labels. */
export const MATCH_TYPE_SYMBOLS: Record<MatchType, string> = {
  EXACT: '=',
  CONTAINS_ALL: 'has all',
  CONTAINS_ANY: 'has any',
};

export const MATCH_TYPE_PRIORITY: Record<MatchType, number> = {
  EXACT: 3,
  CONTAINS_ALL: 2,
  CONTAINS_ANY: 1,
};

export function isAutofill(outcome: RuleOutcome): outcome is AutofillOutcome {
  return outcome.type === 'AUTOFILL';
}

export function isReveal(outcome: RuleOutcome): outcome is RevealOutcome {
  return outcome.type === 'REVEAL';
}
