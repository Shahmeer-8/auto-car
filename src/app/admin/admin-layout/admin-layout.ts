import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { getFirebaseDb } from '../../core/firebase/firebase';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout implements OnInit {
  private db = getFirebaseDb();

  carListingsCount = 0;
  adReviewCount = 0;
  complaintsCount = 0;
  pageTitle = 'Main dashboard';

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
    'users': 'User management',
    'analytics': 'Reports & analytics',
    'reviews': 'Ad review',
    'featured': 'Featured / sponsored',
    'categories': 'Category & attributes',
    'complaints': 'Complaints',
    'content': 'Content management',
    'roles': 'Roles & permissions',
  };

  constructor(private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.loadBadgeCounts();
    this.updateTitle(this.router.url);

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateTitle(event.urlAfterRedirects);
        this.cdr.detectChanges();
      }
    });
  }

  private updateTitle(url: string) {
    const segment = url.split('/').filter(Boolean).pop() || 'dashboard';
    this.pageTitle = this.titles[segment] || 'Admin Panel';
  }

  async loadBadgeCounts() {
    try {
      const carsSnap = await getCountFromServer(collection(this.db, 'cars'));
      this.carListingsCount = carsSnap.data().count;

      const reviewQ = query(
        collection(this.db, 'cars'),
        where('status', '==', 'pending')
      );
      const reviewSnap = await getCountFromServer(reviewQ);
      this.adReviewCount = reviewSnap.data().count;

      const complaintsQ = query(
        collection(this.db, 'complaints'),
        where('status', '==', 'open')
      );
      const complaintsSnap = await getCountFromServer(complaintsQ);
      this.complaintsCount = complaintsSnap.data().count;

    } catch (e) {
      this.complaintsCount = 0;
    }
    this.cdr.detectChanges();
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}