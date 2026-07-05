import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { hasPermission } from '../auth/permissions';

/**
 * Structural directive: renders its content only if the current user holds the given permission.
 * Usage: `<button *appHasPermission="'sales.create'">New sale</button>`
 * UI-layer enforcement only — always backed by Security Rules + Cloud Functions server-side.
 */
@Directive({
  selector: '[appHasPermission]',
})
export class HasPermissionDirective {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  // Re-evaluate whenever the profile (and therefore permissions) changes.
  private readonly profile = toSignal(this.auth.userProfile$, { initialValue: null });

  readonly appHasPermission = input.required<string>();

  private visible = false;

  constructor() {
    effect(() => {
      this.profile(); // track profile changes
      const allowed = hasPermission(this.auth.permissions, this.appHasPermission());
      if (allowed && !this.visible) {
        this.vcr.createEmbeddedView(this.tpl);
        this.visible = true;
      } else if (!allowed && this.visible) {
        this.vcr.clear();
        this.visible = false;
      }
    });
  }
}
