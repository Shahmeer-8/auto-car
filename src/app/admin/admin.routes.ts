import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'cars',
        loadComponent: () => import('./cars/admin-cars').then((m) => m.AdminCars),
      },
      {
        path: 'reviews',
        loadComponent: () => import('./reviews/admin-reviews').then((m) => m.AdminReviews),
      },
      {
        path: 'users',
        loadComponent: () => import('./users/admin-users').then((m) => m.AdminUsers),
      },
    ],
  },
];
