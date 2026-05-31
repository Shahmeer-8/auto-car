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
    map(() => (auth.isAuthenticated ? router.createUrlTree(['/dashboard']) : true)),
  );
};
