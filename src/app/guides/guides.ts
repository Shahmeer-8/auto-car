import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Guide {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  readTime: number;
  author: string;
  authorImage: string;
  views: string;
  date: string;
}

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
  
  allGuides: Guide[] = [
    {
      id: 1,
      slug: 'japan-auction-grade-explained',
      title: 'What is Japan Auction Grade? Everything You Need to Know',
      excerpt: 'Understand auction grades 1 to 5 and why Grade 4+ means a car in excellent condition.',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=85',
      category: 'Buying Process',
      readTime: 8,
      author: 'Kenji Tanaka',
      authorImage: 'https://i.pravatar.cc/150?img=12',
      views: '12.5K',
      date: '2024-03-01'
    },
    {
      id: 2,
      slug: 'why-japanese-used-cars-low-mileage',
      title: 'Why Japanese Used Cars Have Such Low Mileage',
      excerpt: 'Japan\'s unique road culture and strict shaken inspection system keeps mileage surprisingly low.',
      image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=85',
      category: 'Vehicle Quality',
      readTime: 6,
      author: 'Yuki Sato',
      authorImage: 'https://i.pravatar.cc/150?img=33',
      views: '18.2K',
      date: '2024-02-28'
    },
    {
      id: 3,
      slug: 'top-10-reliable-japanese-cars-import',
      title: 'Top 10 Most Reliable Japanese Cars for Import',
      excerpt: 'Toyota Land Cruiser, Honda CR-V, Nissan X-Trail — find out which JDM cars last the longest.',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=85',
      category: 'Vehicle Selection',
      readTime: 10,
      author: 'Hiroshi Yamada',
      authorImage: 'https://i.pravatar.cc/150?img=68',
      views: '25.8K',
      date: '2024-02-25'
    },
    {
      id: 4,
      slug: 'check-japanese-car-history-before-buying',
      title: 'How to Check a Japanese Car\'s History Before Buying',
      excerpt: 'Use the chassis number to verify mileage, accidents, and ownership history before you commit.',
      image: 'https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?w=800&q=85',
      category: 'Inspection',
      readTime: 12,
      author: 'Mai Kobayashi',
      authorImage: 'https://i.pravatar.cc/150?img=47',
      views: '15.3K',
      date: '2024-02-20'
    },
    {
      id: 5,
      slug: 'complete-jdm-import-costs-breakdown',
      title: 'Complete JDM Import Costs Breakdown 2024',
      excerpt: 'Understand every cost: vehicle price, auction fees, shipping, customs, and port charges.',
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=85',
      category: 'Import Process',
      readTime: 15,
      author: 'Takeshi Nakamura',
      authorImage: 'https://i.pravatar.cc/150?img=15',
      views: '32.1K',
      date: '2024-02-18'
    },
    {
      id: 6,
      slug: 'japanese-kei-cars-explained',
      title: 'Japanese Kei Cars: The Ultimate Beginner\'s Guide',
      excerpt: 'Everything about Japan\'s mini vehicles — regulations, benefits, and best models to import.',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=85',
      category: 'Vehicle Types',
      readTime: 9,
      author: 'Akiko Suzuki',
      authorImage: 'https://i.pravatar.cc/150?img=29',
      views: '9.7K',
      date: '2024-02-15'
    },
    {
      id: 7,
      slug: 'shipping-methods-jdm-vehicles',
      title: 'RoRo vs Container: Which Shipping Method is Best?',
      excerpt: 'Compare roll-on/roll-off and container shipping for cost, safety, and delivery time.',
      image: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800&q=85',
      category: 'Shipping & Logistics',
      readTime: 11,
      author: 'Kenji Tanaka',
      authorImage: 'https://i.pravatar.cc/150?img=12',
      views: '14.6K',
      date: '2024-02-12'
    },
    {
      id: 8,
      slug: 'customs-clearance-guide-jdm-imports',
      title: 'Customs Clearance Guide for JDM Imports',
      excerpt: 'Navigate customs regulations, required documents, and duties for smooth vehicle clearance.',
      image: 'https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?w=800&q=85',
      category: 'Import Process',
      readTime: 13,
      author: 'Yuki Sato',
      authorImage: 'https://i.pravatar.cc/150?img=33',
      views: '11.2K',
      date: '2024-02-10'
    },
    {
      id: 9,
      slug: 'jdm-maintenance-tips-imported-cars',
      title: 'Essential Maintenance Tips for Imported JDM Cars',
      excerpt: 'Keep your Japanese import running smoothly with proper maintenance schedules and parts sourcing.',
      image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&q=85',
      category: 'Maintenance',
      readTime: 10,
      author: 'Hiroshi Yamada',
      authorImage: 'https://i.pravatar.cc/150?img=68',
      views: '8.9K',
      date: '2024-02-08'
    }
  ];
  
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

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.sortBy = 'latest';
    this.filterGuides();
  }

  subscribeNewsletter(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    
    console.log('Newsletter subscription:', emailInput.value);
    
    // Show success message (you can implement a toast/notification here)
    alert('Thank you for subscribing! You\'ll receive our weekly JDM insights.');
    
    form.reset();
    
    // In real application:
    // this.newsletterService.subscribe(emailInput.value).subscribe({
    //   next: () => { /* success */ },
    //   error: () => { /* error */ }
    // });
  }
}