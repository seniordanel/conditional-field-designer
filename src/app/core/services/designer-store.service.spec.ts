import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DesignerStore } from './designer-store.service';

describe('DesignerStore', () => {
  let store: DesignerStore;

  beforeEach(() => {
    store = TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).inject(DesignerStore);
  });

  it('snaps a dropped field to the grid and selects it', () => {
    const field = store.createField({ name: 'Cost Centre', type: 'text', values: [] });

    store.placeNode(field.id, 113, 87);

    expect(store.node(field.id)).toEqual({ fieldId: field.id, x: 120, y: 80 });
    expect(store.selection()).toEqual({ kind: 'node', fieldId: field.id });
  });

  it('ignores a second drop of a field that is already on the canvas', () => {
    const before = store.nodes().length;

    store.placeNode('f1', 500, 500);

    expect(store.nodes().length).toBe(before);
  });

  it('drops rules on both sides when a field leaves the canvas', () => {
    store.removeNode('f3');

    expect(store.rules().some((rule) => rule.src === 'f3')).toBeFalse();
    expect(
      store.rules().some((rule) => rule.outcomes.some((outcome) => outcome.target === 'f3')),
    ).toBeFalse();
    expect(store.selection()).toBeNull();
  });

  it('collapses every rule between two fields into a single edge', () => {
    // f3 → f4 is targeted by both the London and New York rules.
    const edges = store.edges().filter((edge) => edge.src === 'f3' && edge.target === 'f4');

    expect(edges.length).toBe(1);
    expect(edges[0].rules.length).toBe(2);
  });

  it('does not duplicate rules when the same connection is drawn twice', () => {
    const before = store.rules().length;

    store.startEdgeDraft({ src: 'f1', x1: 0, y1: 0, x2: 0, y2: 0 });
    store.commitEdgeDraft('f2');

    expect(store.rules().length).toBe(before);
    expect(store.selection()).toEqual({ kind: 'edge', src: 'f1', target: 'f2' });
  });

  it('drops a multi-select value from the preview when it is toggled off', () => {
    store.togglePreviewValue('f2', 'HR');
    store.togglePreviewValue('f2', 'Legal');
    expect(store.previewInputs()['f2']).toEqual(['HR', 'Legal']);

    store.togglePreviewValue('f2', 'HR');
    expect(store.previewInputs()['f2']).toEqual(['Legal']);

    store.togglePreviewValue('f2', 'Legal');
    expect(store.previewInputs()['f2']).toBeUndefined();
  });

  it('persists a selection mode on a reveal outcome', () => {
    // r1 / o1 is the seeded "Request Type -> reveal Department" outcome.
    store.updateReveal('r1', 'o1', {
      required: true,
      allowed: ['HR'],
      selectionMode: 'single',
    });

    expect(store.outcome('r1', 'o1')).toEqual(
      jasmine.objectContaining({ selectionMode: 'single', allowed: ['HR'] }),
    );
  });

  it('leaves selection mode out of the saved payload when it is inherited', () => {
    store.updateReveal('r1', 'o1', { required: true, allowed: [], selectionMode: null });

    const saved = JSON.parse(JSON.stringify(store.schema()));
    const outcome = saved.rules
      .find((rule: { id: string }) => rule.id === 'r1')
      .outcomes.find((o: { id: string }) => o.id === 'o1');

    expect('selectionMode' in outcome).toBeFalse();
  });

  it('flags a field whose declared selection mode a reveal contradicts', () => {
    // f4 (Floor) is declared multi-select; r2/o5 reveals it for London HQ.
    store.updateReveal('r2', 'o5', { required: true, allowed: [], selectionMode: 'single' });

    expect(store.selectionOverrides().get('f4')).toEqual({ mode: 'single', count: 1 });
  });

  it('counts every rule that contradicts the declared mode', () => {
    store.updateReveal('r2', 'o5', { required: true, allowed: [], selectionMode: 'single' });
    store.updateReveal('r3', 'o8', { required: true, allowed: [], selectionMode: 'single' });

    expect(store.selectionOverrides().get('f4')?.count).toBe(2);
  });

  it('ignores an override that merely restates the field\'s own mode', () => {
    // Floor is already multi-select, so this changes nothing the user would see.
    store.updateReveal('r2', 'o5', { required: true, allowed: [], selectionMode: 'multi' });

    expect(store.selectionOverrides().has('f4')).toBeFalse();
  });

  it('reports no overrides on an untouched design', () => {
    expect(store.selectionOverrides().size).toBe(0);
  });

  it('tracks unsaved changes against the last saved snapshot', () => {
    expect(store.isDirty()).toBeTrue();

    store.markSaved();
    expect(store.isDirty()).toBeFalse();

    store.createField({ name: 'New', type: 'text', values: [] });
    expect(store.isDirty()).toBeTrue();
  });
});
