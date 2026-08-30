import { resolveFieldType, type FieldDefinition } from './field.model';

describe('resolveFieldType', () => {
  const multi: FieldDefinition = { id: 'f', name: 'Floor', type: 'multi-select', values: ['1'] };
  const text: FieldDefinition = { id: 't', name: 'Notes', type: 'text', values: [] };

  it("uses the field's own type when no selection mode is set", () => {
    expect(resolveFieldType(multi, null)).toBe('multi-select');
  });

  it('lets a reveal narrow a multi-select field to a single choice', () => {
    expect(resolveFieldType(multi, 'single')).toBe('single-select');
  });

  it('lets a reveal widen a single-select field to several choices', () => {
    const single: FieldDefinition = { ...multi, type: 'single-select' };
    expect(resolveFieldType(single, 'multi')).toBe('multi-select');
  });

  it('ignores the override on text fields', () => {
    expect(resolveFieldType(text, 'multi')).toBe('text');
  });
});
