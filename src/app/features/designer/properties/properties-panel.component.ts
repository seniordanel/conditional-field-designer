import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DesignerStore } from '../../../core/services/designer-store.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { EdgePropertiesComponent } from './edge-properties.component';
import { NodePropertiesComponent } from './node-properties.component';

/** Right rail. Shows whichever inspector matches the current selection. */
@Component({
  selector: 'cfd-properties-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, NodePropertiesComponent, EdgePropertiesComponent],
  template: `
    @if (store.selectedField(); as field) {
      <cfd-node-properties [field]="field" />
    } @else if (store.selectedEdge(); as edge) {
      <cfd-edge-properties [src]="edge.src" [target]="edge.target" />
    } @else {
      <div class="empty">
        <cfd-icon name="cursor" [size]="48" [strokeWidth]="1.5" />
        <p class="title">Nothing Selected</p>
        <p class="hint">Click a node to edit it, or click an arrow to configure its conditional logic.</p>
      </div>
    }
  `,
  styles: `
    :host {
      width: 380px;
      background: var(--surface);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      z-index: 20;
      flex-shrink: 0;
      overflow-y: auto;
    }
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      padding: 40px;
      text-align: center;
      color: var(--border-dark);
    }
    .title {
      margin-top: 16px;
      font-weight: 700;
      font-size: 15px;
      color: var(--text-muted);
    }
    .hint {
      margin-top: 6px;
      font-size: 13px;
      color: var(--text-faint);
      max-width: 220px;
      line-height: 1.5;
    }
  `,
})
export class PropertiesPanelComponent {
  protected readonly store = inject(DesignerStore);
}
