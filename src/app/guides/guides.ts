import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../core/firebase/firebase';
import { Guide, GUIDES_DATA, guideSlug } from './guides.data';

interface Category {
  id: string;
  label: string;
  icon: string;
  count: number;
}

interface Resource {
  icon: string;
  title: string;
  description: string;
  link: string;
  linkText: string;
}

@Component({
  selector: 'app-guides',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './guides.html',
  styleUrls: ['./guides.css']
})
export class Guides implements OnInit {
  searchQuery = '';
  selectedCategory = 'all';
  sortBy = 'latest';
  newsletterSuccess = signal(false);
  newsletterError = signal('');
  private db = getFirebaseDb();

  allGuides: Guide[] = GUIDES_DATA;

  filteredGuides: Guide[] = [];
  
  categories: Category[] = [
    { id: 'all', label: 'All Guides', icon: '📚', count: 0 },
    { id: 'buying', label: 'Buying Process', icon: '🛒', count: 0 },
    { id: 'quality', label: 'Vehicle Quality', icon: '⭐', count: 0 },
    { id: 'selection', label: 'Vehicle Selection', icon: '🚗', count: 0 },
    { id: 'inspection', label: 'Inspection', icon: '🔍', count: 0 },
    { id: 'import', label: 'Import Process', icon: '🌍', count: 0 },
    { id: 'shipping', label: 'Shipping & Logistics', icon: '🚢', count: 0 },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧', count: 0 }
  ];
  
  resources: Resource[] = [
    {
      icon: '🧮',
      title: 'Import Cost Calculator',
      description: 'Calculate total costs including vehicle, shipping, duties, and port charges.',
      link: '/calculator',
      linkText: 'Calculate Costs'
    },
    {
      icon: '📋',
      title: 'Pre-Purchase Checklist',
      description: 'Complete checklist to verify before making your JDM purchase decision.',
      link: '/checklist',
      linkText: 'View Checklist'
    },
    {
      icon: '📖',
      title: 'Auction Sheet Decoder',
      description: 'Learn to read Japanese auction sheets and understand condition reports.',
      link: '/decoder',
      linkText: 'Learn More'
    }
  ];

  ngOnInit(): void {
    this.updateCategoryCounts();
    this.filteredGuides = [...this.allGuides];
  }

  updateCategoryCounts(): void {
    const counts: { [key: string]: number } = {};
    
    this.allGuides.forEach(guide => {
      const catId = this.getCategoryId(guide.category);
      counts[catId] = (counts[catId] || 0) + 1;
    });
    
    this.categories.forEach(cat => {
      if (cat.id === 'all') {
        cat.count = this.allGuides.length;
      } else {
        cat.count = counts[cat.id] || 0;
      }
    });
  }

  getCategoryId(categoryLabel: string): string {
    const map: { [key: string]: string } = {
      'Buying Process': 'buying',
      'Vehicle Quality': 'quality',
      'Vehicle Selection': 'selection',
      'Inspection': 'inspection',
      'Import Process': 'import',
      'Shipping & Logistics': 'shipping',
      'Maintenance': 'maintenance',
      'Vehicle Types': 'selection'
    };
    return map[categoryLabel] || 'all';
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.filterGuides();
  }

  filterGuides(): void {
    let filtered = [...this.allGuides];
    
    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(guide => 
        this.getCategoryId(guide.category) === this.selectedCategory
      );
    }
    
    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(guide =>
        guide.title.toLowerCase().includes(query) ||
        guide.excerpt.toLowerCase().includes(query) ||
        guide.category.toLowerCase().includes(query)
      );
    }
    
    this.filteredGuides = filtered;
    this.sortGuides();
  }

  sortGuides(): void {
    switch (this.sortBy) {
      case 'latest':
        this.filteredGuides.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        break;
      case 'popular':
        this.filteredGuides.sort((a, b) => {
          const aViews = parseFloat(a.views.replace('K', '')) * 1000;
          const bViews = parseFloat(b.views.replace('K', '')) * 1000;
          return bViews - aViews;
        });
        break;
      case 'title':
        this.filteredGuides.sort((a, b) => 
          a.title.localeCompare(b.title)
        );
        break;
    }
  }

  getSectionTitle(): string {
    if (this.selectedCategory === 'all') {
      return 'All Buying Guides';
    }
    const category = this.categories.find(c => c.id === this.selectedCategory);
    return category ? category.label : 'Guides';
  }

  slugOf(guide: Guide): string {
    return guideSlug(guide.title);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.sortBy = 'latest';
    this.filterGuides();
  }

  async subscribeNewsletter(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    const email = emailInput?.value?.trim();
    this.newsletterSuccess.set(false);
    this.newsletterError.set('');

    if (!email || !/.+@.+\..+/.test(email)) {
      this.newsletterError.set('Please enter a valid email address.');
      return;
    }

    try {
      await addDoc(collection(this.db, 'newsletterSubscribers'), {
        email,
        source: 'guides',
        createdAt: serverTimestamp(),
      });
      this.newsletterSuccess.set(true);
      form.reset();
    } catch (err) {
      console.error('Newsletter subscribe failed:', err);
      this.newsletterError.set('Subscription failed. Please try again.');
    }
  }
}