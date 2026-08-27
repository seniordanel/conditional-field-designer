import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'bolt'
  | 'reset'
  | 'save'
  | 'code'
  | 'chevron-down'
  | 'close'
  | 'edit'
  | 'trash'
  | 'arrow-right'
  | 'cursor'
  | 'check'
  | 'alert'
  | 'spinner';

/**
 * Single inline-SVG icon set. Icons inherit `currentColor` so callers style them with `color`.
 */
@Component({
  selector: 'cfd-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:inline-flex' },
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      [class.spin]="name() === 'spinner'"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('bolt') {
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        }
        @case ('reset') {
          <path
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        }
        @case ('save') {
          <path d="M5 13l4 4L19 7" />
        }
        @case ('code') {
          <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        }
        @case ('chevron-down') {
          <path d="M19 9l-7 7-7-7" />
        }
        @case ('close') {
          <path d="M6 18L18 6M6 6l12 12" />
        }
        @case ('edit') {
          <path
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        }
        @case ('trash') {
          <path
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        }
        @case ('arrow-right') {
          <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
        }
        @case ('cursor') {
          <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
        }
        @case ('check') {
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        }
        @case ('alert') {
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        }
        @case ('spinner') {
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        }
      }
    </svg>
  `,
  styles: `
    .spin {
      animation: cfd-spin 0.7s linear infinite;
    }
    @keyframes cfd-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(16);
  readonly strokeWidth = input(2);
}
