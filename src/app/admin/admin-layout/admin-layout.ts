import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { getFirebaseDb } from '../../core/firebase/firebase';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { NotificationData } from '../../core/services/notification.data';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, HasPermissionDirective],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout implements OnInit {
  private db = getFirebaseDb();

  // Signals: these are all filled from async Firestore reads, and this app is
  // zoneless — plain fields would not reliably re-render (and caused NG0100).
  readonly carListingsCount = signal(0);
  readonly adReviewCount = signal(0);
  readonly complaintsCount = signal(0);
  readonly unreadCount = signal(0);
  readonly pageTitle = signal('Main dashboard');

  /** Mobile only: the sidebar slides in over the content and closes on navigation. */
  readonly sidebarOpen = signal(false);

  get adminName(): string {
    return this.auth.getUserDisplayName() || 'Admin';
  }

  get adminEmail(): string {
    return this.auth.getUserEmail() || '';
  }

  get adminInitials(): string {
    const name = this.adminName.trim();
    if (!name) return 'A';
    const parts = name.split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
    return (first + second).toUpperCase() || 'A';
  }

  private titles: Record<string, string> = {
    'dashboard': 'Main dashboard',
    'cars': 'Car listings',
    'orders': 'Car bookings',
    'users': 'User management',
    'analytics': 'Reports & analytics',
    'reviews': 'Ad review',
    'featured': 'Featured / sponsored',
    'categories': 'Category & attributes',
    'complaints': 'Complaints',
    'content': 'Content management',
    'roles': 'Roles & permissions',
  };

  constructor(
    private auth: AuthService,
    private router: Router,
    private notificationData: NotificationData,
  ) {}

  ngOnInit() {
    this.updateTitle(this.router.url);

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateTitle(event.urlAfterRedirects);
        // On a phone the sidebar covers the page — close it once we've navigated.
        this.sidebarOpen.set(false);
      }
    });

    void this.loadBadgeCounts();
    this.notificationData
      .unreadCountForCurrentUser()
      .then((c) => this.unreadCount.set(c))
      .catch(() => this.unreadCount.set(0));
  }

  toggleSidebar() {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  private updateTitle(url: string) {
    const segment = url.split('/').filter(Boolean).pop() || 'dashboard';
    this.pageTitle.set(this.titles[segment] || 'Admin Panel');
  }

  async loadBadgeCounts() {
    try {
      const carsSnap = await getCountFromServer(collection(this.db, 'cars'));
      this.carListingsCount.set(carsSnap.data().count);

      const reviewQ = query(
        collection(this.db, 'cars'),
        where('status', '==', 'pending')
      );
      const reviewSnap = await getCountFromServer(reviewQ);
      this.adReviewCount.set(reviewSnap.data().count);

      const complaintsQ = query(
        collection(this.db, 'complaints'),
        where('status', '==', 'open')
      );
      const complaintsSnap = await getCountFromServer(complaintsQ);
      this.complaintsCount.set(complaintsSnap.data().count);
    } catch {
      this.complaintsCount.set(0);
    }
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}