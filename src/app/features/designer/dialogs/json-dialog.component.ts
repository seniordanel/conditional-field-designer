import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DesignerStore } from '../../../core/services/designer-store.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalShellComponent } from '../../../shared/components/modal-shell/modal-shell.component';

/** Read-only view of the exact payload the save button sends. */
@Component({
  selector: 'cfd-json-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalShellComponent],
  template: `
    <cfd-modal-shell
      title="Schema payload"
      confirmLabel="Copy JSON"
      cancelLabel="Close"
      (confirm)="copy()"
      (cancel)="dialogs.close()"
    >
      <p class="meta">POST /api/schemas · {{ bytes() }} bytes</p>
      <pre class="json">{{ json() }}</pre>
    </cfd-modal-shell>
  `,
  styles: `
    .meta {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 10px;
      font-variant-numeric: tabular-nums;
    }
    .json {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      line-height: 1.55;
      background: #0f172a;
      color: #e2e8f0;
      padding: 14px;
      border-radius: 8px;
      overflow-x: auto;
      white-space: pre;
      max-height: 45vh;
      overflow-y: auto;
    }
  `,
})
export class JsonDialogComponent {
  protected readonly dialogs = inject(DialogService);
  private readonly store = inject(DesignerStore);
  private readonly toasts = inject(ToastService);

  protected readonly json = computed(() => JSON.stringify(this.store.schema(), null, 2));
  protected readonly bytes = computed(() => new TextEncoder().encode(this.json()).length);

  protected copy(): void {
    navigator.clipboard
      .writeText(this.json())
      .then(() => this.toasts.show({ kind: 'info', title: 'JSON copied to clipboard' }))
      .catch(() => this.toasts.error('Could not access the clipboard'));
  }
}
