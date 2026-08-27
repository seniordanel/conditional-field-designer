import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MATCH_TYPE_LABELS, type MatchType } from '../../../core/models';
import { DesignerStore } from '../../../core/services/designer-store.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ModalShellComponent } from '../../../shared/components/modal-shell/modal-shell.component';

/** Edits the "if" half of a rule: how to match, and against which values. */
@Component({
  selector: 'cfd-condition-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ModalShellComponent],
  template: `
    <cfd-modal-shell title="Configure Condition" (confirm)="submit()" (cancel)="dialogs.close()">
      <div class="form-group">
        <label class="form-label" for="match-type">Match Mode</label>
        <select id="match-type" class="form-control" [formControl]="matchType">
          @for (option of matchOptions; track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      </div>

      <div class="form-group">
        <span class="form-label">
          Trigger Values for <span class="source">{{ sourceName() }}</span>
        </span>
        <div class="option-list">
          @for (value of sourceValues(); track value) {
            <label class="checkbox-row">
              <input type="checkbox" [checked]="selected().has(value)" (change)="toggle(value)" />
              {{ value }}
            </label>
          } @empty {
            <p class="none">
              This field has no defined options — add some from the field editor first.
            </p>
          }
        </div>
      </div>
    </cfd-modal-shell>
  `,
  styles: `
    .source {
      color: var(--primary);
    }
    .none {
      font-size: 12px;
      color: var(--text-muted);
      padding: 8px;
      line-height: 1.5;
    }
  `,
})
export class ConditionDialogComponent implements OnInit {
  readonly ruleId = input.required<string>();

  protected readonly dialogs = inject(DialogService);
  private readonly store = inject(DesignerStore);

  protected readonly matchOptions = (Object.keys(MATCH_TYPE_LABELS) as MatchType[]).map((value) => ({
    value,
    label: MATCH_TYPE_LABELS[value],
  }));

  protected readonly matchType = new FormControl<MatchType>('EXACT', { nonNullable: true });
  protected readonly selected = signal<ReadonlySet<string>>(new Set());

  private readonly rule = computed(() => this.store.rule(this.ruleId()));
  protected readonly sourceName = computed(() => {
    const src = this.rule()?.src;
    return src ? this.store.fieldName(src) : '';
  });
  protected readonly sourceValues = computed(() => {
    const src = this.rule()?.src;
    return src ? (this.store.field(src)?.values ?? []) : [];
  });

  ngOnInit(): void {
    const rule = this.rule();
    if (!rule) return;
    this.matchType.setValue(rule.matchType);
    this.selected.set(new Set(rule.matchValues));
  }

  protected toggle(value: string): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (!next.delete(value)) next.add(value);
      return next;
    });
  }

  protected submit(): void {
    this.store.updateRuleCondition(this.ruleId(), this.matchType.value, [...this.selected()]);
    this.dialogs.close();
  }
}
