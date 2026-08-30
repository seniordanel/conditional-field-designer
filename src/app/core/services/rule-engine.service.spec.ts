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
    expect(result.constraints['floor']).toEqual({
      required: true,
      allowed: ['1', '2'],
      selectionMode: null,
    });
  });

  it('carries a per-value selection mode through to the constraint', () => {
    const asSingle: Rule = {
      id: 'r1',
      src: 'building',
      matchType: 'EXACT',
      matchValues: ['London'],
      outcomes: [
        {
          id: 'o1',
          type: 'REVEAL',
          target: 'floor',
          required: false,
          allowed: [],
          selectionMode: 'single',
        },
      ],
    };
    const asMulti: Rule = {
      id: 'r2',
      src: 'building',
      matchType: 'EXACT',
      matchValues: ['New York'],
      outcomes: [
        {
          id: 'o2',
          type: 'REVEAL',
          target: 'floor',
          required: false,
          allowed: [],
          selectionMode: 'multi',
        },
      ],
    };

    // The same Floor field, presented differently depending on which building fired.
    expect(run([asSingle, asMulti], { building: 'London' }).constraints['floor'].selectionMode)
      .toBe('single');
    expect(run([asSingle, asMulti], { building: 'New York' }).constraints['floor'].selectionMode)
      .toBe('multi');
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

  it('selects the value when a required reveal leaves exactly one option', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        src: 'building',
        matchType: 'EXACT',
        matchValues: ['London'],
        outcomes: [{ id: 'o1', type: 'REVEAL', target: 'floor', required: true, allowed: ['2'] }],
      },
    ];

    const result = run(rules, { building: 'London' });

    expect(result.resolved['floor']).toBe('2');
  });

  it('leaves an optional single-option field for the user to answer', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        src: 'building',
        matchType: 'EXACT',
        matchValues: ['London'],
        outcomes: [{ id: 'o1', type: 'REVEAL', target: 'floor', required: false, allowed: ['2'] }],
      },
    ];

    expect(run(rules, { building: 'London' }).resolved['floor']).toBeUndefined();
  });

  it('does not settle a field that still offers a real choice', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        src: 'building',
        matchType: 'EXACT',
        matchValues: ['London'],
        outcomes: [
          { id: 'o1', type: 'REVEAL', target: 'floor', required: true, allowed: ['1', '2'] },
        ],
      },
    ];

    expect(run(rules, { building: 'London' }).resolved['floor']).toBeUndefined();
  });

  it('settles on the field\'s own value when it has one and the reveal adds no allow-list', () => {
    const oneValueField: FieldDefinition[] = [
      ...FIELDS,
      { id: 'currency', name: 'Currency', type: 'single-select', values: ['GBP'] },
    ];
    const rules: Rule[] = [
      {
        id: 'r1',
        src: 'building',
        matchType: 'EXACT',
        matchValues: ['London'],
        outcomes: [{ id: 'o1', type: 'REVEAL', target: 'currency', required: true, allowed: [] }],
      },
    ];

    const result = engine.evaluate({
      fields: oneValueField,
      nodes: [...NODES, { fieldId: 'currency', x: 0, y: 0 }],
      rules,
      inputs: { building: 'London' },
    });

    expect(result.resolved['currency']).toBe('GBP');
  });

  it('completes a whole chain from one selection', () => {
    // Building settles Floor, Floor settles Justification — none of them typed by the user.
    const rules: Rule[] = [
      {
        id: 'r1',
        src: 'building',
        matchType: 'EXACT',
        matchValues: ['London'],
        outcomes: [{ id: 'o1', type: 'REVEAL', target: 'floor', required: true, allowed: ['3'] }],
      },
      {
        id: 'r2',
        src: 'floor',
        matchType: 'CONTAINS_ANY',
        matchValues: ['3'],
        outcomes: [{ id: 'o2', type: 'REVEAL', target: 'city', required: true, allowed: [] }],
      },
    ];

    const result = run(rules, { building: 'London' });

    expect(result.resolved['floor']).toBe('3');
    expect(result.visible).toContain('city');
    expect(result.explanations.map((e) => e.fieldName)).toEqual(['Building', 'Floor']);
  });

  it('reports a settled value in the explanation', () => {
    const rules: Rule[] = [
      {
        id: 'r1',
        src: 'building',
        matchType: 'EXACT',
        matchValues: ['London'],
        outcomes: [{ id: 'o1', type: 'REVEAL', target: 'floor', required: true, allowed: ['2'] }],
      },
    ];

    expect(run(rules, { building: 'London' }).explanations[0].effects).toEqual([
      'Reveal Floor = "2" (only option)',
    ]);
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
