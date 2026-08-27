import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { CanvasNode, FieldDefinition, FieldValue, Rule } from '../models';
import { RuleEngineService } from './rule-engine.service';

const FIELDS: FieldDefinition[] = [
  { id: 'type', name: 'Request Type', type: 'single-select', values: ['Move', 'Access'] },
  { id: 'building', name: 'Building', type: 'single-select', values: ['London', 'New York'] },
  { id: 'floor', name: 'Floor', type: 'multi-select', values: ['1', '2', '3'] },
  { id: 'city', name: 'City', type: 'text', values: [] },
  { id: 'offCanvas', name: 'Off Canvas', type: 'text', values: [] },
];

const NODES: CanvasNode[] = [
  { fieldId: 'type', x: 0, y: 0 },
  { fieldId: 'building', x: 0, y: 0 },
  { fieldId: 'floor', x: 0, y: 0 },
  { fieldId: 'city', x: 0, y: 0 },
];

describe('RuleEngineService', () => {
  let engine: RuleEngineService;

  beforeEach(() => {
    engine = TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).inject(RuleEngineService);
  });

  function run(rules: Rule[], inputs: Record<string, FieldValue> = {}) {
    return engine.evaluate({ fields: FIELDS, nodes: NODES, rules, inputs });
  }

  it('shows only untargeted fields when nothing has been answered', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        src: 'type',
        matchType: 'CONTAINS_ANY',
        matchValues: ['Move'],
        outcomes: [{ id: 'o1', type: 'REVEAL', target: 'building', required: true, allowed: [] }],
      },
    ];

    const result = run(rules);

    expect(result.visible).toContain('type');
    expect(result.visible).not.toContain('building');
  });

  it('reveals a target and applies its constraints once the condition matches', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        src: 'building',
        matchType: 'EXACT',
        matchValues: ['London'],
        outcomes: [{ id: 'o1', type: 'REVEAL', target: 'floor', required: true, allowed: ['1', '2'] }],
      },
    ];

    const result = run(rules, { building: 'London' });

    expect(result.visible).toContain('floor');
    expect(result.constraints['floor']).toEqual({ required: true, allowed: ['1', '2'] });
  });

  it('chains rules: an auto-filled value can satisfy the next rule', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        src: 'building',
        matchType: 'EXACT',
        matchValues: ['London'],
        outcomes: [{ id: 'o1', type: 'AUTOFILL', target: 'city', value: 'London' }],
      },
      {
        id: 'r2',
        src: 'city',
        matchType: 'CONTAINS_ANY',
        matchValues: ['London'],
        outcomes: [{ id: 'o2', type: 'REVEAL', target: 'floor', required: false, allowed: [] }],
      },
    ];

    const result = run(rules, { building: 'London' });

    expect(result.autofills['city']).toBe('London');
    expect(result.visible).toContain('floor');
  });

  it('lets the most specific match type win when rules share a source', () => {
    const rules: Rule[] = [
      {
        id: 'loose',
        src: 'building',
        matchType: 'CONTAINS_ANY',
        matchValues: ['London'],
        outcomes: [{ id: 'o1', type: 'AUTOFILL', target: 'city', value: 'loose' }],
      },
      {
        id: 'exact',
        src: 'building',
        matchType: 'EXACT',
        matchValues: ['London'],
        outcomes: [{ id: 'o2', type: 'AUTOFILL', target: 'city', value: 'exact' }],
      },
    ];

    const result = run(rules, { building: 'London' });

    expect(result.autofills['city']).toBe('exact');
    expect(result.explanations.length).toBe(1);
  });

  it('fires every rule that ties on priority so one field can drive several targets', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        src: 'building',
        matchType: 'EXACT',
        matchValues: ['London'],
        outcomes: [{ id: 'o1', type: 'AUTOFILL', target: 'city', value: 'London' }],
      },
      {
        id: 'r2',
        src: 'building',
        matchType: 'EXACT',
        matchValues: ['London'],
        outcomes: [{ id: 'o2', type: 'REVEAL', target: 'floor', required: false, allowed: [] }],
      },
    ];

    const result = run(rules, { building: 'London' });

    expect(result.autofills['city']).toBe('London');
    expect(result.visible).toContain('floor');
  });

  it('requires an exact set match for EXACT on a multi-value field', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        src: 'floor',
        matchType: 'EXACT',
        matchValues: ['1', '2'],
        outcomes: [{ id: 'o1', type: 'AUTOFILL', target: 'city', value: 'matched' }],
      },
    ];

    expect(run(rules, { floor: ['1'] }).autofills['city']).toBeUndefined();
    expect(run(rules, { floor: ['1', '2'] }).autofills['city']).toBe('matched');
  });

  it('never matches a rule that has no trigger values', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        src: 'building',
        matchType: 'CONTAINS_ANY',
        matchValues: [],
        outcomes: [{ id: 'o1', type: 'REVEAL', target: 'floor', required: false, allowed: [] }],
      },
    ];

    expect(run(rules, { building: 'London' }).visible).not.toContain('floor');
  });

  it('ignores outcomes that point at a field which is not on the canvas', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        src: 'building',
        matchType: 'EXACT',
        matchValues: ['London'],
        outcomes: [{ id: 'o1', type: 'REVEAL', target: 'offCanvas', required: false, allowed: [] }],
      },
    ];

    expect(run(rules, { building: 'London' }).visible).not.toContain('offCanvas');
  });

  it('reports each firing rule exactly once, however many passes it took to settle', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        src: 'building',
        matchType: 'EXACT',
        matchValues: ['London'],
        outcomes: [{ id: 'o1', type: 'AUTOFILL', target: 'city', value: 'London' }],
      },
      {
        id: 'r2',
        src: 'city',
        matchType: 'CONTAINS_ANY',
        matchValues: ['London'],
        outcomes: [{ id: 'o2', type: 'REVEAL', target: 'floor', required: false, allowed: [] }],
      },
    ];

    const result = run(rules, { building: 'London' });

    expect(result.explanations.length).toBe(2);
    expect(result.explanations.map((e) => e.fieldName)).toEqual(['Building', 'City']);
  });

  it('halts and reports an error when two rules fight over the same value', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        src: 'type',
        matchType: 'EXACT',
        matchValues: ['Move'],
        outcomes: [{ id: 'o1', type: 'AUTOFILL', target: 'city', value: 'a' }],
      },
      {
        id: 'r2',
        src: 'city',
        matchType: 'EXACT',
        matchValues: ['a'],
        outcomes: [{ id: 'o2', type: 'AUTOFILL', target: 'city', value: 'b' }],
      },
    ];

    const result = run(rules, { type: 'Move' });

    expect(result.errors).toEqual(['Cycle detected — evaluation halted.']);
  });
});
