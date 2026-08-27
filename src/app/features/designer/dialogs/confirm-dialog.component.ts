import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DialogService } from '../../../core/services/dialog.service';
import { ModalShellComponent } from '../../../shared/components/modal-shell/modal-shell.component';

/** Generic yes/no prompt, replacing the browser `confirm()` used in the prototype. */
@Component({
  selector: 'cfd-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalShellComponent],
  template: `
    <cfd-modal-shell
      [title]="title()"
      [confirmLabel]="confirmLabel()"
      [danger]="danger()"
      (confirm)="accept()"
      (cancel)="dialogs.close()"
    >
      <p class="message">{{ message() }}</p>
    </cfd-modal-shell>
  `,
  styles: `
    .message {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-body);
    }
  `,
})
export class ConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirm');
  readonly danger = input(false);
  readonly onConfirm = input.required<() => void>();

  protected readonly dialogs = inject(DialogService);

  protected accept(): void {
    this.onConfirm()();
    this.dialogs.close();
  }
}
