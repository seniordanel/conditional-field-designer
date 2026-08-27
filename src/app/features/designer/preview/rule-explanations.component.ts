import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DesignerStore } from '../../../core/services/designer-store.service';

/** "Why this result?" — the audit trail for whichever rules just fired. */
@Component({
  selector: 'cfd-rule-explanations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.evaluation().explanations.length) {
      <h3 class="section-title">Why this result?</h3>
      @for (item of store.evaluation().explanations; track $index) {
        <article class="card">
          <div class="trigger">{{ item.fieldName }} = {{ item.value }}</div>
          <div class="matched">
            ✓ Matched: {{ item.matchType.replace('_', ' ') }} [{{ item.matchValues.join(', ') }}]
          </div>
          @for (effect of item.effects; track effect) {
            <div class="effect">→ {{ effect }}</div>
          }
        </article>
      }
    } @else {
      <p class="empty">Select values in the form to see rule evaluations here.</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .section-title {
      font-size: 11px;
      margin-bottom: 10px;
    }
    .card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 8px;
    }
    .trigger {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-body);
      margin-bottom: 3px;
    }
    .matched {
      font-size: 11px;
      color: var(--success);
      font-weight: 600;
      margin-bottom: 3px;
    }
    .effect {
      font-size: 11px;
      color: var(--text-muted);
      padding-left: 10px;
    }
    .empty {
      text-align: center;
      color: var(--border-dark);
      padding: 20px;
      font-size: 12px;
    }
  `,
})
export class RuleExplanationsComponent {
  protected readonly store = inject(DesignerStore);
}
