import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { hasPermission } from '../auth/permissions';

/**
 * Route guard factory: allows activation only if the signed-in, active user holds `required`.
 * Falls back to /login when unauthenticated and /admin/dashboard when merely under-privileged.
 */
export function permissionGuard(required: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.authReady$.pipe(
      filter((ready) => ready),
      take(1),
      map(() => {
        if (!auth.isAuthenticated || !auth.isActive) return router.createUrlTree(['/login']);
        return hasPermission(auth.permissions, required)
          ? true
          : router.createUrlTree(['/admin/dashboard']);
      }),
    );
  };
}
