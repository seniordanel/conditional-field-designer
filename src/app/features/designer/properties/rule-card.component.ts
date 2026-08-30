import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import {
  MATCH_TYPE_VERBS,
  SELECTION_MODE_LABELS,
  isAutofill,
  type FieldDefinition,
  type Rule,
  type RuleOutcome,
} from '../../../core/models';
import { DesignerStore } from '../../../core/services/designer-store.service';
import { DialogService } from '../../../core/services/dialog.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

/** One "if … then …" rule, scoped to the connection currently selected. */
@Component({
  selector: 'cfd-rule-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <header class="card-head">
      <span class="condition">If {{ sourceField().name }} {{ verb() }}</span>
      <span class="tools">
        <button type="button" class="btn btn-ghost btn-xs" aria-label="Edit condition" (click)="editCondition()">
          <cfd-icon name="edit" [size]="14" />
        </button>
        <button type="button" class="btn btn-danger-ghost btn-xs" aria-label="Delete rule" (click)="deleteRule()">
          <cfd-icon name="trash" [size]="14" />
        </button>
      </span>
    </header>

    <div class="card-body">
      <div class="chips">
        @for (value of rule().matchValues; track value) {
          <span class="chip">{{ value }}</span>
        } @empty {
          <span class="warn">⚠ No values selected</span>
        }
      </div>

      <h4 class="then">Then → {{ targetField().name }}</h4>

      @for (outcome of outcomes(); track outcome.id) {
        <div class="outcome">
          <span class="summary">
            <span class="pill" [class.fill]="outcome.type === 'AUTOFILL'">
              {{ outcome.type === 'AUTOFILL' ? 'Fill' : 'Show' }}
            </span>
            {{ describe(outcome) }}
          </span>
          <span class="tools">
            <button type="button" class="btn btn-ghost btn-xs" aria-label="Edit outcome" (click)="editOutcome(outcome.id)">
              <cfd-icon name="edit" [size]="14" />
            </button>
            <button
              type="button"
              class="btn btn-danger-ghost btn-xs"
              aria-label="Delete outcome"
              (click)="store.deleteOutcome(rule().id, outcome.id)"
            >
              <cfd-icon name="trash" [size]="14" />
            </button>
          </span>
        </div>
      }

      <div class="add">
        <button type="button" class="btn btn-outline btn-xs" (click)="addOutcome('AUTOFILL')">
          + Auto-fill
        </button>
        <button type="button" class="btn btn-outline btn-xs" (click)="addOutcome('REVEAL')">
          + Reveal
        </button>
      </div>
    </div>
  `,
  styleUrl: './rule-card.component.css',
})
export class RuleCardComponent {
  readonly rule = input.required<Rule>();
  readonly sourceField = input.required<FieldDefinition>();
  readonly targetField = input.required<FieldDefinition>();

  protected readonly store = inject(DesignerStore);
  private readonly dialogs = inject(DialogService);

  protected readonly verb = computed(() => MATCH_TYPE_VERBS[this.rule().matchType]);

  /** Only the outcomes pointing at the field on the other end of this connection. */
  protected readonly outcomes = computed(() =>
    this.rule().outcomes.filter((outcome) => outcome.target === this.targetField().id),
  );

  protected describe(outcome: RuleOutcome): string {
    if (isAutofill(outcome)) return `"${outcome.value}"`;

    const target = this.targetField();
    const parts = [outcome.required ? 'Required' : 'Optional'];

    if (outcome.selectionMode) {
      parts.push(SELECTION_MODE_LABELS[outcome.selectionMode].toLowerCase());
    }
    if (target.type !== 'text') {
      parts.push(`${outcome.allowed.length}/${target.values.length} options`);
    }
    return parts.join(', ');
  }

  protected editCondition(): void {
    this.dialogs.open({ kind: 'condition', ruleId: this.rule().id });
  }

  protected editOutcome(outcomeId: string): void {
    this.dialogs.open({ kind: 'outcome', ruleId: this.rule().id, outcomeId });
  }

  protected addOutcome(type: RuleOutcome['type']): void {
    this.store.addOutcome(this.rule().id, this.targetField().id, type);
  }

  protected deleteRule(): void {
    this.dialogs.confirm({
      title: 'Delete rule',
      message: 'This rule and all of its outcomes will be removed.',
      confirmLabel: 'Delete rule',
      danger: true,
      onConfirm: () => this.store.deleteRule(this.rule().id),
    });
  }
}
