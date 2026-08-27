import type { FieldDefinition } from './field.model';
import type { CanvasNode } from './canvas.model';
import type { Rule } from './rule.model';

/** The JSON document the designer produces — this is what gets POSTed on save. */
export interface DesignerSchema {
  readonly version: number;
  readonly fields: readonly FieldDefinition[];
  readonly layout: readonly CanvasNode[];
  readonly rules: readonly Rule[];
}

export interface SaveSuccess {
  readonly schemaId: string;
  readonly revision: number;
  readonly savedAt: string;
  readonly bytes: number;
}

/** A validation rejection, shaped like a 422 body from a real API. */
export interface SaveValidationError {
  readonly status: number;
  readonly message: string;
  readonly issues: readonly string[];
}
