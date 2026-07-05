import { Routes } from '@angular/router';
import { permissionGuard } from '../core/guards/permission.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        canActivate: [permissionGuard('dashboard.view')],
        loadComponent: () =>
          import('./admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'cars',
        canActivate: [permissionGuard('ads.view')],
        loadComponent: () => import('./cars/admin-cars').then((m) => m.AdminCars),
      },
      {
        path: 'users',
        canActivate: [permissionGuard('users.view')],
        loadComponent: () => import('./users/admin-users').then((m) => m.AdminUsers),
      },
      {
        path: 'roles',
        canActivate: [permissionGuard('roles.manage')],
        loadComponent: () => import('./roles/admin-roles').then((m) => m.AdminRoles),
      },
      {
        path: 'analytics',
        canActivate: [permissionGuard('reports.view')],
        loadComponent: () => import('./analytics/admin-analytics').then((m) => m.AdminAnalytics),
      },
      {
        path: 'reviews',
        canActivate: [permissionGuard('ads.moderate')],
        loadComponent: () => import('./reviews/admin-reviews').then((m) => m.AdminReviews),
      },
      {
        path: 'featured',
        canActivate: [permissionGuard('ads.feature')],
        loadComponent: () => import('./featured/admin-featured').then((m) => m.AdminFeatured),
      },
      {
        path: 'categories',
        canActivate: [permissionGuard('cms.edit')],
        loadComponent: () => import('./categories/admin-categories').then((m) => m.AdminCategories),
      },
      {
        path: 'complaints',
        canActivate: [permissionGuard('customers.manage')],
        loadComponent: () => import('./complaints/admin-complaints').then((m) => m.AdminComplaints),
      },
      {
        path: 'content',
        canActivate: [permissionGuard('cms.edit')],
        loadComponent: () => import('./content/admin-content').then((m) => m.AdminContent),
      },
      {
        path: 'audit',
        canActivate: [permissionGuard('audit.view')],
        loadComponent: () => import('./audit/admin-audit').then((m) => m.AdminAudit),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./notifications/admin-notifications').then((m) => m.AdminNotifications),
      },
    ],
  },
];
