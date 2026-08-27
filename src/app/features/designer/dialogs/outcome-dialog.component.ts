import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { isAutofill } from '../../../core/models';
import { DesignerStore } from '../../../core/services/designer-store.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ModalShellComponent } from '../../../shared/components/modal-shell/modal-shell.component';

/** Edits the "then" half of a rule — either an auto-fill value or a reveal's constraints. */
@Component({
  selector: 'cfd-outcome-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ModalShellComponent],
  template: `
    <cfd-modal-shell
      [title]="autofill() ? 'Configure Auto-fill' : 'Configure Reveal'"
      (confirm)="submit()"
      (cancel)="dialogs.close()"
    >
      <div class="form-group">
        <label class="form-label" for="outcome-target">Target Field</label>
        <input id="outcome-target" class="form-control" disabled [value]="targetName()" />
      </div>

      @if (autofill()) {
        <div class="form-group">
          <label class="form-label" for="outcome-value">Value to Auto-fill</label>
          @if (targetValues().length) {
            <select id="outcome-value" class="form-control" [formControl]="value">
              <option value="">— Select —</option>
              @for (option of targetValues(); track option) {
                <option [value]="option">{{ option }}</option>
              }
            </select>
          } @else {
            <input id="outcome-value" type="text" class="form-control" [formControl]="value" />
          }
        </div>
      } @else {
        <div class="form-group required-box">
          <label class="checkbox-row strong">
            <input type="checkbox" [formControl]="required" />
            Make this field required
          </label>
        </div>

        @if (targetValues().length) {
          <div class="form-group">
            <span class="form-label">Allowed Options</span>
            <p class="form-hint spaced">Uncheck to hide options from the user.</p>
            <div class="option-list">
              @for (option of targetValues(); track option) {
                <label class="checkbox-row">
                  <input type="checkbox" [checked]="allowed().has(option)" (change)="toggle(option)" />
                  {{ option }}
                </label>
              }
            </div>
          </div>
        }
      }
    </cfd-modal-shell>
  `,
  styles: `
    .required-box {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
    }
    .strong {
      font-weight: 600;
    }
    .spaced {
      margin-bottom: 8px;
    }
  `,
})
export class OutcomeDialogComponent implements OnInit {
  readonly ruleId = input.required<string>();
  readonly outcomeId = input.required<string>();

  protected readonly dialogs = inject(DialogService);
  private readonly store = inject(DesignerStore);

  protected readonly value = new FormControl('', { nonNullable: true });
  protected readonly required = new FormControl(false, { nonNullable: true });
  protected readonly allowed = signal<ReadonlySet<string>>(new Set());

  private readonly outcome = computed(() => this.store.outcome(this.ruleId(), this.outcomeId()));
  private readonly targetField = computed(() => {
    const target = this.outcome()?.target;
    return target ? this.store.field(target) : undefined;
  });

  protected readonly autofill = computed(() => {
    const outcome = this.outcome();
    return !!outcome && isAutofill(outcome);
  });
  protected readonly targetName = computed(() => this.targetField()?.name ?? '');
  protected readonly targetValues = computed(() => this.targetField()?.values ?? []);

  ngOnInit(): void {
    const outcome = this.outcome();
    if (!outcome) return;

    if (isAutofill(outcome)) {
      this.value.setValue(outcome.value);
      return;
    }

    this.required.setValue(outcome.required);
    // An empty allow-list means "no restriction", so show every option as checked.
    this.allowed.set(new Set(outcome.allowed.length ? outcome.allowed : this.targetValues()));
  }

  protected toggle(option: string): void {
    this.allowed.update((current) => {
      const next = new Set(current);
      if (!next.delete(option)) next.add(option);
      return next;
    });
  }

  protected submit(): void {
    if (this.autofill()) {
      this.store.updateAutofill(this.ruleId(), this.outcomeId(), this.value.value);
    } else {
      this.store.updateReveal(this.ruleId(), this.outcomeId(), this.required.value, [
        ...this.allowed(),
      ]);
    }
    this.dialogs.close();
  }
}
