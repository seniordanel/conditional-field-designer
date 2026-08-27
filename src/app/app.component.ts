import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DesignerPageComponent } from './features/designer/designer-page.component';
import { ToastHostComponent } from './shared/components/toast-host/toast-host.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DesignerPageComponent, ToastHostComponent],
  template: `
    <cfd-designer-page />
    <cfd-toast-host />
  `,
})
export class AppComponent {}
