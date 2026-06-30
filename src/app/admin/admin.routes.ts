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
        path: 'users',
        loadComponent: () => import('./users/admin-users').then((m) => m.AdminUsers),
      },
      {
        path: 'analytics',
        loadComponent: () => import('./analytics/admin-analytics').then((m) => m.AdminAnalytics),
      },
      {
        path: 'reviews',
        loadComponent: () => import('./reviews/admin-reviews').then((m) => m.AdminReviews),
      },
      {
        path: 'featured',
        loadComponent: () => import('./featured/admin-featured').then((m) => m.AdminFeatured),
      },
      {
        path: 'categories',
        loadComponent: () => import('./categories/admin-categories').then((m) => m.AdminCategories),
      },
      {
        path: 'complaints',
        loadComponent: () => import('./complaints/admin-complaints').then((m) => m.AdminComplaints),
      },
      {
        path: 'content',
        loadComponent: () => import('./content/admin-content').then((m) => m.AdminContent),
      },
      {
        path: 'roles',
        loadComponent: () => import('./roles/admin-roles').then((m) => m.AdminRoles),
      },
    ],
  },
];
