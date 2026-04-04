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

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'cars', component: CarsPage },
  { path: 'cars/:type', component: CarsPage },
  { path: 'car-detail/:id', component: CarDetail },
  { path: 'about', component: About },
  { path: 'contact', component: Contact },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'guides', component: Guides },
  { path: 'dashboard', component: Dashboard },
  { path: 'sell-your-car', component: SellYourCar },
  { path: '**', redirectTo: '' }
];
