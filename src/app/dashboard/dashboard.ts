import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CarService } from '../services/car.service';
import { CarListing } from '../models/car.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  userName = '';
  userEmail = '';
  userType = '';
  isLoading = true;
  loadError = '';
  submittedMsg = '';

  activeTab: 'listings' | 'profile' = 'listings';

  listings: CarListing[] = [];

  private userId = '';
  private readonly sub = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private carService: CarService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    // Success banner after submitting/updating a listing from the Sell Your Car flow.
    const flag = this.route.snapshot.queryParamMap.get('submitted');
    if (flag === 'new') {
      this.submittedMsg =
        '🎉 Your car has been submitted for review! It will appear below shortly and go live once approved.';
    } else if (flag === 'updated') {
      this.submittedMsg = '✅ Your listing has been updated and resubmitted for review.';
    }

    await this.authService.waitUntilReady();

    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    this.userId = this.authService.currentUser!.uid;
    this.userName = this.authService.getUserDisplayName();
    this.userEmail = this.authService.getUserEmail();
    this.userType = this.authService.getUserType();
    // Firebase auth resolves outside Angular's zone; render the header info now.
    this.cdr.detectChanges();

    await this.loadListings();
    this.isLoading = false;
    this.cdr.detectChanges();

    // Refresh whenever a listing changes anywhere — e.g. the Sell Your Car flow's
    // background save completing after we've already navigated here.
    this.sub.add(
      this.carService.carsUpdated$.subscribe(() => {
        this.loadListings().then(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }),
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  async loadListings() {
    if (!this.userId) return;
    try {
      this.listings = await this.carService.getUserListings(this.userId);
      this.loadError = '';
    } catch {
      this.loadError = 'Failed to load your listings. Please refresh the page.';
    }
  }

  get pendingListings() {
    return this.listings.filter((l) => l.status === 'pending');
  }

  get approvedListings() {
    return this.listings.filter((l) => l.status === 'approved');
  }

  async deleteListing(id: string) {
    if (!id || !confirm('Are you sure you want to delete this listing?')) return;

    try {
      await this.carService.deleteCar(id);
      await this.loadListings();
      this.cdr.detectChanges();
    } catch {
      alert('Failed to delete listing. Please try again.');
    }
  }

  viewDetails(id: string) {
    this.router.navigate(['/car-detail', id]);
  }

  async logout() {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch {
      alert('Logout failed. Please try again.');
    }
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusText(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatPrice(price: number): string {
    return '$' + price.toLocaleString();
  }
}
