# Conditional Field Designer

An Angular 20 implementation of the Conditional Field Designer prototype: a node-graph editor
where you place form fields on a canvas, connect them, and describe the rules that reveal or
auto-fill downstream fields — with a live end-user preview of the resulting form.

There is no backend. Saving is mocked (see [Saving](#saving)).

## Running it

```bash
npm install
npm start
```

Then open http://localhost:4200.

```bash
npm test          # unit tests (Karma + Jasmine, headless)
npm run build     # production build
```

## What you can do

| Action | How |
| --- | --- |
| Add a field to the library | **+ New Field** in the left rail |
| Put a field on the canvas | Drag it from the left rail |
| Move a node | Drag its header |
| Connect two fields | Drag from a node's right-hand port onto another node |
| Edit a rule | Click an arrow (or its label), then use the right-hand panel |
| Try the form | Fill in the **Live End-User Preview** at the bottom |
| Inspect the payload | **View JSON** in the header |

Pan by dragging empty canvas; zoom with the wheel or the on-canvas control. `Esc` cancels a
connection you are mid-way through drawing.

## Architecture

```
src/app/
├── core/
│   ├── models/            Domain types (fields, rules, canvas, evaluation, schema)
│   └── services/
│       ├── rule-engine     Pure evaluation of the rule graph
│       ├── designer-store  Signal state: the single source of truth
│       ├── schema-api      Mocked persistence
│       ├── dialog          Which modal is open
│       ├── toast           Notifications
│       └── edge.util       Bezier geometry + edge label text
├── shared/components/     icon, modal-shell, toast-host
└── features/designer/
    ├── designer-page      Three-column shell
    ├── header             Branding, View JSON, Reset, Save
    ├── inventory          Field library + draggable chips
    ├── canvas             Pan/zoom surface, nodes, edges, labels
    ├── properties         Contextual inspector (node or connection)
    ├── preview            Live form + "why this result?" explanations
    └── dialogs            Field / condition / outcome / JSON / confirm
```

Some decisions worth calling out:

**Signals, and only signals.** `DesignerStore` holds six writable signals; everything else —
the edges to draw, the evaluation result, the save payload, the dirty flag — is a `computed`
derived from them. There is no second copy of state to keep in sync, and no manual re-render.

**Zoneless change detection.** Because all state is signal-based, the app runs with
`provideZonelessChangeDetection()`; Angular re-renders exactly when a signal changes.

**The rule engine is pure and separately testable.** `RuleEngineService.evaluate()` takes
fields, layout, rules and the user's answers, and returns visibility, constraints, auto-fills
and explanations. It knows nothing about Angular or the DOM.

**One place owns document-level pointer listeners.** `GraphCanvasComponent` runs every drag
(pan, node move, connection draw) and tears listeners down via `DestroyRef`. Nodes, labels and
ports stay declarative and just report intent through outputs.

**Dialogs are data.** `DialogService` holds a `DialogRequest`; `DialogHostComponent` renders
whichever one is active. No component needs a reference to another component to open a modal.

## How evaluation works

Fields that no rule targets are *roots* and are always visible. Everything else appears only
once a rule reveals or auto-fills it — and because revealing a field lets that field's own
rules fire, evaluation runs to a fixpoint (capped at 50 passes, after which a cycle is
reported).

A required field whose constraints leave exactly **one** option has no other legal answer, so
the engine selects it rather than asking. That value then feeds the next pass, so a single
choice can settle a whole chain — pick a building, and the floor, and whatever the floor
reveals, fall out on their own. Optional fields are never settled this way; a user may
legitimately leave one blank.

When several rules share a source field, the most specific match type wins:
`EXACT` > `CONTAINS_ALL` > `CONTAINS_ANY`. Every rule tied at the winning priority fires, so
one field can legitimately drive several targets at once.

## Saving

`SchemaApiService.save()` stands in for the real endpoint. It returns an `Observable` that
emits once after a simulated 0.5–1s round trip, or errors with a 422-shaped body when the
schema does not validate (an empty canvas, a rule with no trigger values, an auto-fill with no
value). The payload is logged to the console as it would appear in the network tab.

Swapping in a real backend is a one-line change inside that file:

```ts
return this.http.post<SaveSuccess>('/api/schemas', schema);
```

Nothing outside `schema-api.service.ts` changes, because the header already consumes it as an
Observable with success and error branches.

## Differences from the prototype

- **Explanations are no longer duplicated.** The prototype pushed an explanation on every pass
  of its fixpoint loop, so a rule that took three passes to settle appeared three times. They
  are now derived once from the converged state.
- **`confirm()` and `alert()` are replaced** by in-app dialogs and toasts.
- **Wheel zoom and a zoom control were added.** The prototype tracked a `zoom` value in state
  but never exposed a way to change it.
- **A dot grid was added to the canvas** so panning has a visual reference.
- **Required single-option fields settle themselves.** The prototype left them unanswered, which
  stopped the cascade at the first field the user had no real choice about.
