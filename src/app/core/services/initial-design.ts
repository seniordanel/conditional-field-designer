import type { CanvasNode, FieldDefinition, Rule } from '../models';

/** Seed design: an office-move request form, used on first load and by "Reset". */
export interface InitialDesign {
  fields: FieldDefinition[];
  nodes: CanvasNode[];
  rules: Rule[];
}

export function createInitialDesign(): InitialDesign {
  return {
    fields: [
      { id: 'f1', name: 'Request Type', type: 'single-select', values: ['Office Move', 'IT Access', 'Building Access'] },
      { id: 'f2', name: 'Department', type: 'multi-select', values: ['Finance', 'HR', 'Legal', 'Technology'] },
      { id: 'f3', name: 'Building', type: 'single-select', values: ['London HQ', 'New York HQ', 'Canary Wharf'] },
      { id: 'f4', name: 'Floor', type: 'multi-select', values: ['1', '2', '3', '4', '5', '6', '10', '11', '12'] },
      { id: 'f5', name: 'City', type: 'text', values: [] },
      { id: 'f6', name: 'Country', type: 'text', values: [] },
      { id: 'f7', name: 'Secure Area Justification', type: 'text', values: [] },
    ],
    nodes: [
      { fieldId: 'f1', x: 60, y: 120 },
      { fieldId: 'f2', x: 420, y: 40 },
      { fieldId: 'f3', x: 420, y: 260 },
      { fieldId: 'f5', x: 780, y: 60 },
      { fieldId: 'f6', x: 780, y: 200 },
      { fieldId: 'f4', x: 780, y: 360 },
      { fieldId: 'f7', x: 1140, y: 360 },
    ],
    rules: [
      {
        id: 'r1',
        src: 'f1',
        matchType: 'CONTAINS_ANY',
        matchValues: ['Office Move', 'Building Access'],
        outcomes: [
          { id: 'o1', type: 'REVEAL', target: 'f2', required: true, allowed: ['Finance', 'HR', 'Legal', 'Technology'] },
          { id: 'o2', type: 'REVEAL', target: 'f3', required: true, allowed: ['London HQ', 'New York HQ', 'Canary Wharf'] },
        ],
      },
      {
        id: 'r2',
        src: 'f3',
        matchType: 'EXACT',
        matchValues: ['London HQ'],
        outcomes: [
          { id: 'o3', type: 'AUTOFILL', target: 'f5', value: 'London' },
          { id: 'o4', type: 'AUTOFILL', target: 'f6', value: 'United Kingdom' },
          { id: 'o5', type: 'REVEAL', target: 'f4', required: true, allowed: ['1', '2', '10', '11', '12'] },
        ],
      },
      {
        id: 'r3',
        src: 'f3',
        matchType: 'EXACT',
        matchValues: ['New York HQ'],
        outcomes: [
          { id: 'o6', type: 'AUTOFILL', target: 'f5', value: 'New York' },
          { id: 'o7', type: 'AUTOFILL', target: 'f6', value: 'United States' },
          { id: 'o8', type: 'REVEAL', target: 'f4', required: true, allowed: ['3', '4', '5', '6'] },
        ],
      },
      {
        id: 'r4',
        src: 'f4',
        matchType: 'CONTAINS_ANY',
        matchValues: ['5', '6', '11', '12'],
        outcomes: [{ id: 'o9', type: 'REVEAL', target: 'f7', required: true, allowed: [] }],
      },
    ],
  };
}
