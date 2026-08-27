import { Injectable, signal } from '@angular/core';

/** Every modal the designer can open, described as data rather than imperative calls. */
export type DialogRequest =
  | { readonly kind: 'field'; readonly fieldId?: string }
  | { readonly kind: 'condition'; readonly ruleId: string }
  | { readonly kind: 'outcome'; readonly ruleId: string; readonly outcomeId: string }
  | { readonly kind: 'json' }
  | {
      readonly kind: 'confirm';
      readonly title: string;
      readonly message: string;
      readonly confirmLabel: string;
      readonly danger?: boolean;
      readonly onConfirm: () => void;
    };

/**
 * A single open dialog at a time, driven by a signal. The host component renders whichever
 * request is active, so no component needs a reference to any other component.
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly _current = signal<DialogRequest | null>(null);
  readonly current = this._current.asReadonly();

  open(request: DialogRequest): void {
    this._current.set(request);
  }

  confirm(
    options: Omit<Extract<DialogRequest, { kind: 'confirm' }>, 'kind'>,
  ): void {
    this._current.set({ kind: 'confirm', ...options });
  }

  close(): void {
    this._current.set(null);
  }
}
