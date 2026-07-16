import { Routes } from '@angular/router';
import { Home } from './home/home';
import { CarsPage } from './cars/cars';
import { CarDetail } from './car-detail/car-detail';
import { About } from './about/about';
import { Contact } from './contact/contact';
import { Login } from './login/login';
import { Register } from './register/register';
import { Guides } from './guides/guides';
import { Dashboard } from './dashboard/dashboard';
import { SellYourCar } from './sell-your-car/sell-your-car';
import { authGuard, guestGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'cars', component: CarsPage },
  { path: 'cars/:type', component: CarsPage },
  { path: 'car-detail/:id', component: CarDetail },
  { path: 'about', component: About },
  { path: 'contact', component: Contact },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },
  { path: 'guides', component: Guides },
  { path: 'guides/:slug', loadComponent: () => import('./guides/guide-detail').then((m) => m.GuideDetail) },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'sell-your-car', component: SellYourCar, canActivate: [authGuard] },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
  },
  { path: 'privacy', loadComponent: () => import('./legal/privacy').then((m) => m.PrivacyPage) },
  { path: 'terms', loadComponent: () => import('./legal/terms').then((m) => m.TermsPage) },
  { path: 'calculator', loadComponent: () => import('./tools/loan-calculator').then((m) => m.LoanCalculator) },
  { path: 'checklist', loadComponent: () => import('./tools/inspection-checklist').then((m) => m.InspectionChecklist) },
  { path: 'decoder', loadComponent: () => import('./tools/chassis-decoder').then((m) => m.ChassisDecoder) },
  { path: '**', redirectTo: '' },
];