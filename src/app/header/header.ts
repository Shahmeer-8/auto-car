import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header {

  // Desktop dropdowns
  researchOpen = false;
  shopOpen = false;

  // Mobile menu
  mobileMenuOpen = false;
  mobileResearchOpen = false;
  mobileShopOpen = false;

  // Desktop toggles
  toggleResearch() {
    this.researchOpen = !this.researchOpen;
    this.shopOpen = false;
  }

  toggleShop() {
    this.shopOpen = !this.shopOpen;
    this.researchOpen = false;
  }

  // Mobile toggles
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