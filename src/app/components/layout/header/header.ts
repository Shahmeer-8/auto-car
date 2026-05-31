import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { AppUser } from '../../../models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class Header implements OnInit, OnDestroy {
  researchOpen = false;
  shopOpen = false;

  mobileMenuOpen = false;
  mobileResearchOpen = false;
  mobileShopOpen = false;

  isLoggedIn = false;
  userName = '';

  private sub?: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.sub = this.authService.userProfile$.subscribe((profile: AppUser | null) => {
      this.isLoggedIn = !!profile;
      this.userName = profile?.name ?? '';
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  toggleResearch() {
    this.researchOpen = !this.researchOpen;
    this.shopOpen = false;
  }

  toggleShop() {
    this.shopOpen = !this.shopOpen;
    this.researchOpen = false;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (!this.mobileMenuOpen) {
      this.mobileResearchOpen = false;
      this.mobileShopOpen = false;
    }
  }

  toggleMobileResearch() {
    this.mobileResearchOpen = !this.mobileResearchOpen;
    this.mobileShopOpen = false;
  }

  toggleMobileShop() {
    this.mobileShopOpen = !this.mobileShopOpen;
    this.mobileResearchOpen = false;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
    this.mobileResearchOpen = false;
    this.mobileShopOpen = false;
  }

  closeAll() {
    this.researchOpen = false;
    this.shopOpen = false;
    this.mobileMenuOpen = false;
    this.mobileResearchOpen = false;
    this.mobileShopOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeAll();
  }
}
