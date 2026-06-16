import { Component, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Header } from './components/layout/header/header';
import { Footer } from './components/layout/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Auto-Flex');

  constructor(private router: Router) {}

  isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }
}