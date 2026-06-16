import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.authReady$.pipe(
    filter((ready) => ready),
    take(1),
    map(() => (auth.isAuthenticated ? true : router.createUrlTree(['/login']))),
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.authReady$.pipe(
    filter((ready) => ready),
    take(1),
    map(() => {
      if (!auth.isAuthenticated) return true;
      if (auth.isAdmin) return router.createUrlTree(['/admin/dashboard']);
      return router.createUrlTree(['/dashboard']);
    }),
  );
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.authReady$.pipe(
    filter((ready) => ready),
    take(1),
    map(() => {
      if (!auth.isAuthenticated) return router.createUrlTree(['/login']);
      if (!auth.isAdmin) return router.createUrlTree(['/']);
      return true;
    }),
  );
};