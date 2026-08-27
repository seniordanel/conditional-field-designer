import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogService } from '../../../core/services/dialog.service';
import { ConditionDialogComponent } from './condition-dialog.component';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { FieldDialogComponent } from './field-dialog.component';
import { JsonDialogComponent } from './json-dialog.component';
import { OutcomeDialogComponent } from './outcome-dialog.component';

/**
 * Renders whichever dialog the `DialogService` currently requests. Mounted once, so any
 * component can open a modal without owning one.
 */
@Component({
  selector: 'cfd-dialog-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FieldDialogComponent,
    ConditionDialogComponent,
    OutcomeDialogComponent,
    JsonDialogComponent,
    ConfirmDialogComponent,
  ],
  template: `
    @if (dialogs.current(); as request) {
      @switch (request.kind) {
        @case ('field') {
          <cfd-field-dialog [fieldId]="request.fieldId" />
        }
        @case ('condition') {
          <cfd-condition-dialog [ruleId]="request.ruleId" />
        }
        @case ('outcome') {
          <cfd-outcome-dialog [ruleId]="request.ruleId" [outcomeId]="request.outcomeId" />
        }
        @case ('json') {
          <cfd-json-dialog />
        }
        @case ('confirm') {
          <cfd-confirm-dialog
            [title]="request.title"
            [message]="request.message"
            [confirmLabel]="request.confirmLabel"
            [danger]="request.danger ?? false"
            [onConfirm]="request.onConfirm"
          />
        }
      }
    }
  `,
})
export class DialogHostComponent {
  protected readonly dialogs = inject(DialogService);
}
