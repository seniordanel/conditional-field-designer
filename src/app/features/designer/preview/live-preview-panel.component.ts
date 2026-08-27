import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DesignerStore } from '../../../core/services/designer-store.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PreviewFormComponent } from './preview-form.component';
import { RuleExplanationsComponent } from './rule-explanations.component';

const COLLAPSED_HEIGHT = 40;
const MIN_HEIGHT = 100;
const MAX_HEIGHT = 600;

/** Collapsible, resizable dock holding the live end-user preview and its explanations. */
@Component({
  selector: 'cfd-live-preview-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, PreviewFormComponent, RuleExplanationsComponent],
  host: { '[style.height.px]': 'currentHeight()' },
  template: `
    @if (open()) {
      <div class="resize" (pointerdown)="startResize($event)"></div>
    }

    <div class="handle" (click)="toggle()">
      <span class="title">
        <span class="dot"></span>
        Live End-User Preview
        <span class="sub">— See how the form behaves with your rules</span>
      </span>
      <span class="right">
        @if (firingCount(); as count) {
          <span class="count">{{ count }} {{ count === 1 ? 'rule' : 'rules' }} firing</span>
        }
        <button
          type="button"
          class="btn btn-ghost btn-xs"
          [attr.aria-expanded]="open()"
          aria-label="Toggle preview"
          (click)="toggle(); $event.stopPropagation()"
        >
          <cfd-icon name="chevron-down" [size]="14" [class.flipped]="!open()" />
        </button>
      </span>
    </div>

    <div class="body">
      <div class="col">
        <cfd-preview-form />
      </div>
      <div class="col explain">
        <cfd-rule-explanations />
      </div>
    </div>
  `,
  styleUrl: './live-preview-panel.component.css',
})
export class LivePreviewPanelComponent {
  protected readonly store = inject(DesignerStore);
  private readonly destroyRef = inject(DestroyRef);

  private readonly height = signal(240);
  protected readonly open = signal(true);

  protected readonly firingCount = computed(() => this.store.evaluation().explanations.length);

  protected readonly currentHeight = computed(() =>
    this.open() ? this.height() : COLLAPSED_HEIGHT,
  );

  protected toggle(): void {
    this.open.update((open) => !open);
  }

  protected startResize(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const startY = event.clientY;
    const startHeight = this.height();

    const move = (moveEvent: PointerEvent) => {
      const next = startHeight - (moveEvent.clientY - startY);
      this.height.set(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, next)));
    };
    const stop = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', stop);
    };

    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop);
    this.destroyRef.onDestroy(stop);
  }
}
