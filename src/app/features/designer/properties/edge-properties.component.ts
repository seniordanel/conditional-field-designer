import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DesignerStore } from '../../../core/services/designer-store.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { RuleCardComponent } from './rule-card.component';

/** Properties for a connection: every rule that links the two fields. */
@Component({
  selector: 'cfd-edge-properties',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, RuleCardComponent],
  template: `
    @if (sourceField(); as source) {
      @if (targetField(); as target) {
        <header class="head">
          <h2 class="section-title">Relationship</h2>
          <div class="pair">
            <span>{{ source.name }}</span>
            <cfd-icon name="arrow-right" [size]="16" [strokeWidth]="2.5" />
            <span>{{ target.name }}</span>
          </div>
        </header>

        <div class="body">
          <button type="button" class="btn btn-primary btn-sm btn-block add" (click)="addRule()">
            + Add Conditional Rule
          </button>

          @for (rule of store.selectedEdgeRules(); track rule.id) {
            <cfd-rule-card [rule]="rule" [sourceField]="source" [targetField]="target" />
          } @empty {
            <p class="empty">No rules yet. Add one below.</p>
          }
        </div>
      }
    }
  `,
  styles: `
    .head {
      padding: 20px;
      border-bottom: 1px solid var(--border);
      background: var(--surface-muted);
    }
    .section-title {
      font-size: 13px;
      margin-bottom: 8px;
    }
    .pair {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
      color: var(--text-strong);
      flex-wrap: wrap;
    }
    .pair cfd-icon {
      color: var(--primary);
    }
    .body {
      padding: 16px 20px;
    }
    .add {
      margin-bottom: 16px;
    }
    .empty {
      text-align: center;
      padding: 20px;
      color: var(--text-muted);
      font-size: 13px;
      font-style: italic;
    }
  `,
})
export class EdgePropertiesComponent {
  readonly src = input.required<string>();
  readonly target = input.required<string>();

  protected readonly store = inject(DesignerStore);

  protected readonly sourceField = computed(() => this.store.field(this.src()));
  protected readonly targetField = computed(() => this.store.field(this.target()));

  protected addRule(): void {
    this.store.addRule(this.src(), this.target());
  }
}
