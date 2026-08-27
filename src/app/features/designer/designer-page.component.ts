import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GraphCanvasComponent } from './canvas/graph-canvas.component';
import { DialogHostComponent } from './dialogs/dialog-host.component';
import { DesignerHeaderComponent } from './header/designer-header.component';
import { FieldInventoryComponent } from './inventory/field-inventory.component';
import { LivePreviewPanelComponent } from './preview/live-preview-panel.component';
import { PropertiesPanelComponent } from './properties/properties-panel.component';

/**
 * Three-column designer shell: field library, canvas over the live preview, and the
 * contextual properties panel.
 */
@Component({
  selector: 'cfd-designer-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DesignerHeaderComponent,
    FieldInventoryComponent,
    GraphCanvasComponent,
    LivePreviewPanelComponent,
    PropertiesPanelComponent,
    DialogHostComponent,
  ],
  template: `
    <cfd-designer-header />

    <div class="layout">
      <cfd-field-inventory />

      <div class="center">
        <cfd-graph-canvas />
        <cfd-live-preview-panel />
      </div>

      <cfd-properties-panel />
    </div>

    <cfd-dialog-host />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    .layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .center {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }
  `,
})
export class DesignerPageComponent {}
