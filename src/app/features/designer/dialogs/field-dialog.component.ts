import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import type { FieldType } from '../../../core/models';
import { DesignerStore } from '../../../core/services/designer-store.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ModalShellComponent } from '../../../shared/components/modal-shell/modal-shell.component';

/** Create or edit a field definition. */
@Component({
  selector: 'cfd-field-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ModalShellComponent],
  template: `
    <cfd-modal-shell
      [title]="isNew() ? 'Create New Field' : 'Edit Field'"
      [confirmDisabled]="form.invalid"
      (confirm)="submit()"
      (cancel)="dialogs.close()"
    >
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-group">
          <label class="form-label" for="field-name">Field Name</label>
          <input
            id="field-name"
            type="text"
            class="form-control"
            formControlName="name"
            placeholder="e.g. Department"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="field-type">Type</label>
          <select id="field-type" class="form-control" formControlName="type">
            <option value="single-select">Single-select</option>
            <option value="multi-select">Multi-select</option>
            <option value="text">Text Input</option>
          </select>
        </div>

        @if (showOptions()) {
          <div class="form-group">
            <label class="form-label" for="field-values">
              Options <span class="form-hint">(one per line)</span>
            </label>
            <textarea
              id="field-values"
              class="form-control"
              rows="6"
              formControlName="values"
              placeholder="Enter one option per line"
            ></textarea>
          </div>
        }
      </form>
    </cfd-modal-shell>
  `,
})
export class FieldDialogComponent implements OnInit {
  readonly fieldId = input<string | undefined>();

  protected readonly dialogs = inject(DialogService);
  private readonly store = inject(DesignerStore);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<FieldType>('single-select', { nonNullable: true }),
    values: new FormControl('', { nonNullable: true }),
  });

  private readonly type = toSignal(this.form.controls.type.valueChanges, {
    initialValue: this.form.controls.type.value,
  });

  protected readonly isNew = computed(() => !this.fieldId());
  protected readonly showOptions = computed(() => this.type() !== 'text');

  ngOnInit(): void {
    const id = this.fieldId();
    if (!id) return;
    const field = this.store.field(id);
    if (!field) return;

    this.form.setValue({
      name: field.name,
      type: field.type,
      values: field.values.join('\n'),
    });
  }

  protected submit(): void {
    if (this.form.invalid) return;
    const { name, type, values } = this.form.getRawValue();

    const draft = {
      name: name.trim(),
      type,
      values: values
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean),
    };

    const id = this.fieldId();
    if (id) this.store.updateField(id, draft);
    else this.store.createField(draft);

    this.dialogs.close();
  }
}
