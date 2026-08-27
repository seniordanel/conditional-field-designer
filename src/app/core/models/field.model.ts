/** The three input kinds a designer can place on the canvas. */
export type FieldType = 'text' | 'single-select' | 'multi-select';

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
