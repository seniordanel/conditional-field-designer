import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import type { DesignerSchema, SaveValidationError } from '../models';
import { SchemaApiService } from './schema-api.service';

function schema(overrides: Partial<DesignerSchema> = {}): DesignerSchema {
  return {
    version: 1,
    fields: [{ id: 'f1', name: 'Building', type: 'single-select', values: ['London'] }],
    layout: [{ fieldId: 'f1', x: 0, y: 0 }],
    rules: [],
    ...overrides,
  };
}

describe('SchemaApiService', () => {
  let api: SchemaApiService;

  beforeEach(() => {
    api = TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).inject(SchemaApiService);
  });

  it('acknowledges a valid schema with an incrementing revision', async () => {
    const first = await firstValueFrom(api.save(schema()));
    const second = await firstValueFrom(api.save(schema()));

    expect(first.revision).toBe(1);
    expect(second.revision).toBe(2);
    expect(first.bytes).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(first.savedAt))).toBeFalse();
  });

  it('rejects an empty canvas', async () => {
    const error = await firstValueFrom(api.save(schema({ layout: [] }))).catch(
      (e: SaveValidationError) => e,
    );

    expect((error as SaveValidationError).status).toBe(422);
    expect((error as SaveValidationError).issues).toContain(
      'The canvas is empty — place at least one field before saving.',
    );
  });

  it('rejects rules that were drawn but never configured', async () => {
    const incomplete = schema({
      rules: [
        {
          id: 'r1',
          src: 'f1',
          matchType: 'EXACT',
          matchValues: [],
          outcomes: [{ id: 'o1', type: 'AUTOFILL', target: 'f1', value: '' }],
        },
      ],
    });

    const error = (await firstValueFrom(api.save(incomplete)).catch(
      (e: SaveValidationError) => e,
    )) as SaveValidationError;

    expect(error.issues).toEqual([
      'Rule on "Building" has no trigger values selected.',
      'Auto-fill into "Building" has no value set.',
    ]);
  });
});
