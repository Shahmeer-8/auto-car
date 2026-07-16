import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CarService } from '../services/car.service';
import { CarListing, SavedCar } from '../models/car.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  userName = '';
  userEmail = '';
  userType = '';
  isLoading = true;
  loadError = '';

  activeTab: 'listings' | 'saved' | 'profile' = 'listings';

  listings: CarListing[] = [];
  savedCars: SavedCar[] = [];

  private userId = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private carService: CarService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.authService.waitUntilReady();

    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    this.userId = this.authService.currentUser!.uid;
    this.userName = this.authService.getUserDisplayName();
    this.userEmail = this.authService.getUserEmail();
    this.userType = this.authService.getUserType();

    this.activeTab = this.userType === 'seller' ? 'listings' : 'saved';
    // Firebase auth resolves outside Angular's change detection — render the header info now.
    this.cdr.detectChanges();

    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.loadError = '';

    try {
      await Promise.all([this.loadListings(), this.loadSavedCars()]);
    } catch {
      this.loadError = 'Failed to load dashboard data. Please refresh the page.';
    } finally {
      this.isLoading = false;
      // Firestore reads resolve outside Angular's zone; force the view to update.
      this.cdr.detectChanges();
    }
  }

  async loadListings() {
    this.listings = await this.carService.getUserListings(this.userId);
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

  async loadSavedCars() {
    this.savedCars = await this.carService.getSavedCars(this.userId);
  }

  async removeSavedCar(carId: string) {
    try {
      await this.carService.removeSavedCar(this.userId, carId);
      this.savedCars = this.savedCars.filter((c) => c.carId !== carId);
      this.cdr.detectChanges();
    } catch {
      alert('Failed to remove saved car. Please try again.');
    }
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
