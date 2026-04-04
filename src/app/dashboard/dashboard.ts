import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

interface CarListing {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  fuelType: string;
  color: string;
  condition: string;
  price: number;
  description: string;
  images: string[];
  ownerName: string;
  email: string;
  phone: string;
  location: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface SavedCar {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image: string;
  savedAt: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  // User Info
  userName: string = '';
  userEmail: string = '';
  userType: string = '';

  // Active Tab
  activeTab: 'listings' | 'saved' | 'profile' = 'listings';

  // Data
  listings: CarListing[] = [];
  savedCars: SavedCar[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    // Check login
    const isLoggedIn = localStorage.getItem('userLoggedIn');
    if (!isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    this.userName  = localStorage.getItem('userName')  || '';
    this.userEmail = localStorage.getItem('userEmail') || '';
    this.userType  = localStorage.getItem('userType')  || 'buyer';

    this.loadListings();
    this.loadSavedCars();

    // Default tab based on userType
    if (this.userType === 'seller') {
      this.activeTab = 'listings';
    } else {
      this.activeTab = 'saved';
    }
  }

  // ─── Listings (Seller) ───────────────────────────────────────

  loadListings() {
    const stored = localStorage.getItem('carListings');
    if (stored) {
      const all: CarListing[] = JSON.parse(stored);
      this.listings = all
        .filter(l => l.email === this.userEmail)
        .sort((a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
    }
  }

  get pendingListings() {
    return this.listings.filter(l => l.status === 'pending');
  }

  get approvedListings() {
    return this.listings.filter(l => l.status === 'approved');
  }

  deleteListing(id: string) {
    if (confirm('Are you sure you want to delete this listing?')) {
      const stored = localStorage.getItem('carListings');
      if (stored) {
        let all: CarListing[] = JSON.parse(stored);
        all = all.filter(l => l.id !== id);
        localStorage.setItem('carListings', JSON.stringify(all));
        this.loadListings();
      }
    }
  }

  viewDetails(id: string) {
    this.router.navigate(['/car-detail', id]);
  }

  // ─── Saved Cars (Buyer) ──────────────────────────────────────

  loadSavedCars() {
    const stored = localStorage.getItem(`savedCars_${this.userEmail}`);
    if (stored) {
      this.savedCars = JSON.parse(stored);
    }
  }

  removeSavedCar(id: string) {
    this.savedCars = this.savedCars.filter(c => c.id !== id);
    localStorage.setItem(
      `savedCars_${this.userEmail}`,
      JSON.stringify(this.savedCars)
    );
  }

  // ─── Logout ──────────────────────────────────────────────────

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('userLoggedIn');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userType');
      localStorage.removeItem('userId');
      this.router.navigate(['/login']);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusText(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  formatPrice(price: number): string {
    return '$' + price.toLocaleString();
  }
}