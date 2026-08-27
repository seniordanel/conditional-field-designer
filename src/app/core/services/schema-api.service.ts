import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, throwError, timer } from 'rxjs';
import { isAutofill, type DesignerSchema, type SaveSuccess, type SaveValidationError } from '../models';

/** Fake round-trip time so the button's pending state is actually visible. */
const MIN_LATENCY_MS = 550;
const MAX_LATENCY_MS = 1050;

/**
 * Stand-in for the persistence API.
 *
 * The contract is deliberately the same shape a real endpoint would have — an Observable
 * that emits once or errors with a 422-style body — so swapping this for
 * `http.post<SaveSuccess>('/api/schemas', schema)` touches nothing outside this file.
 */
@Injectable({ providedIn: 'root' })
export class SchemaApiService {
  private readonly schemaId = 'sch_office_move';
  private revision = 0;

  save(schema: DesignerSchema): Observable<SaveSuccess> {
    // Real implementation:
    //   return inject(HttpClient).post<SaveSuccess>('/api/schemas', schema);
    const payload = JSON.stringify(schema);
    const issues = this.validate(schema);
    const latency = MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);

    if (issues.length) {
      const error: SaveValidationError = {
        status: 422,
        message: 'The server rejected this schema.',
        issues,
      };
      return timer(latency).pipe(switchMap(() => throwError(() => error)));
    }

    return timer(latency).pipe(
      map(() => {
        this.revision += 1;
        // eslint-disable-next-line no-console -- stands in for the network tab
        console.info('[SchemaApiService] POST /api/schemas', schema);
        return {
          schemaId: this.schemaId,
          revision: this.revision,
          savedAt: new Date().toISOString(),
          bytes: new TextEncoder().encode(payload).length,
        };
      }),
    );
  }

  /** Server-side checks the designer cannot enforce on its own. */
  private validate(schema: DesignerSchema): string[] {
    const issues: string[] = [];
    const nameOf = (id: string) => schema.fields.find((f) => f.id === id)?.name ?? id;

    if (!schema.layout.length) {
      issues.push('The canvas is empty — place at least one field before saving.');
    }

    for (const rule of schema.rules) {
      if (!rule.matchValues.length) {
        issues.push(`Rule on "${nameOf(rule.src)}" has no trigger values selected.`);
      }
      for (const outcome of rule.outcomes) {
        if (isAutofill(outcome) && !outcome.value) {
          issues.push(`Auto-fill into "${nameOf(outcome.target)}" has no value set.`);
        }
      }
    }
    return issues;
  }
}
