/** The three input kinds a designer can place on the canvas. */
export type FieldType = 'text' | 'single-select' | 'multi-select';

/**
 * How a choice field lets the user pick. A field carries one by virtue of its type, but a
 * REVEAL outcome may override it for that reveal — so the same `Floor` field can be
 * single-select for one building and multi-select for another.
 */
export type SelectionMode = 'single' | 'multi';

/** A reusable field definition, independent of whether it is on the canvas. */
export interface FieldDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: FieldType;
  /** Allowed options. Always empty for `text` fields. */
  readonly values: readonly string[];
}

/** A value captured from the end user in the live preview. */
export type FieldValue = string | readonly string[];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Text',
  'single-select': 'Single-select',
  'multi-select': 'Multi-select',
};

export const FIELD_TYPE_BADGES: Record<FieldType, string> = {
  text: 'TEXT',
  'single-select': 'SELECT',
  'multi-select': 'MULTI',
};

export const FIELD_TYPE_DESCRIPTIONS: Record<FieldType, string> = {
  text: 'Text input',
  'single-select': 'Single-select field',
  'multi-select': 'Multi-select field',
};

export function isChoiceField(field: FieldDefinition): boolean {
  return field.type !== 'text';
}

export const SELECTION_MODE_LABELS: Record<SelectionMode, string> = {
  single: 'Single-select',
  multi: 'Multi-select',
};

/**
 * The type a field should actually render as, once a reveal's selection mode is taken into
 * account. Text fields ignore the override; `null` means "use the field's own type".
 */
export function resolveFieldType(
  field: FieldDefinition,
  selectionMode: SelectionMode | null,
): FieldType {
  if (field.type === 'text' || !selectionMode) return field.type;
  return selectionMode === 'single' ? 'single-select' : 'multi-select';
}
