import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeroSlider } from '../components/hero-slider/hero-slider';
import { Slider } from '../components/slider/slider';
import { CarService } from '../services/car.service';
import { SliderItem } from '../components/slider/slider.types';
import { CarListing } from '../models/car.model';
import {
  HARDCODED_CARS,
  GUIDES,
  RANKINGS,
  RELIABLE_CARS,
  STUDIES,
  RESOURCES,
  BEST_USED,
  COMPARISONS,
  POPULAR_CARS_CONFIG,
  GUIDES_CONFIG,
  RANKINGS_CONFIG,
  RELIABLE_CONFIG,
  STUDIES_CONFIG,
  RESOURCES_CONFIG,
  BEST_USED_CONFIG,
  COMPARISONS_CONFIG,
} from './home.data';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeroSlider, Slider],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit, OnDestroy {
  popularCars: SliderItem[] = [];
  guides = GUIDES;
  rankings = RANKINGS;
  reliableCars = RELIABLE_CARS;
  studies = STUDIES;
  resources = RESOURCES;
  bestUsed = BEST_USED;
  comparisons = COMPARISONS;

  popularCarsConfig = POPULAR_CARS_CONFIG;
  guidesConfig = GUIDES_CONFIG;
  rankingsConfig = RANKINGS_CONFIG;
  reliableConfig = RELIABLE_CONFIG;
  studiesConfig = STUDIES_CONFIG;
  resourcesConfig = RESOURCES_CONFIG;
  bestUsedConfig = BEST_USED_CONFIG;
  comparisonsConfig = COMPARISONS_CONFIG;

  brands = [
    { logo: '🚗', name: 'Toyota', count: '1,240' },
    { logo: '🏎️', name: 'Honda', count: '980' },
    { logo: '🚙', name: 'Nissan', count: '850' },
    { logo: '🚘', name: 'Mazda', count: '620' },
    { logo: '🏔️', name: 'Subaru', count: '430' },
    { logo: '⚡', name: 'Mitsubishi', count: '380' },
    { logo: '🛻', name: 'Suzuki', count: '290' },
    { logo: '💎', name: 'Lexus', count: '310' },
    { logo: '🌟', name: 'Daihatsu', count: '180' },
    { logo: '🚐', name: 'Isuzu', count: '140' },
  ];

  bodyTypes = [
    { icon: '🚗', name: 'Sedan' },
    { icon: '🚙', name: 'SUV' },
    { icon: '🛻', name: 'Truck' },
    { icon: '🚐', name: 'Minivan' },
    { icon: '🏎️', name: 'Coupe' },
    { icon: '🚘', name: 'Hatchback' },
    { icon: '🚌', name: 'Wagon' },
    { icon: '⚡', name: 'Electric' },
    { icon: '🔋', name: 'Hybrid' },
    { icon: '🚗', name: 'Convertible' },
    { icon: '🚙', name: 'CUV' },
    { icon: '🚐', name: 'Van' },
    { icon: '🚘', name: 'Compact' },
    { icon: '🏎️', name: 'Sports Car' },
    { icon: '💎', name: 'Luxury' },
    { icon: '✅', name: 'CPO' },
  ];

  whyItems = [
    {
      icon: '📊',
      title: 'Low Mileage Guaranteed',
      desc: 'Japanese roads are short and well-maintained. Most used cars have surprisingly low mileage compared to global standards.',
      badge: 'Avg 30,000 KM',
    },
    {
      icon: '🔍',
      title: 'Strict Auction Inspection',
      desc: "Every car goes through Japan's rigorous auction grading system. Grade 4 and above means excellent condition.",
      badge: 'Grade 4.5 Avg',
    },
    {
      icon: '🛡️',
      title: 'Well Maintained Culture',
      desc: 'Japanese owners maintain their vehicles religiously — regular servicing, careful driving, original parts.',
      badge: 'Full Service History',
    },
    {
      icon: '🚢',
      title: 'Worldwide Shipping',
      desc: 'We ship directly from Japan to your port. Fast, insured, and tracked delivery to 50+ countries.',
      badge: '50+ Countries',
    },
  ];

  private sub?: Subscription;

  constructor(private carService: CarService) {}

  ngOnInit(): void {
    this.carService.getListedCars().then((cars) => this.buildPopularCars(cars));
    this.sub = this.carService.approvedCars$.subscribe((cars: CarListing[]) => this.buildPopularCars(cars));

  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private buildPopularCars(listedCars: CarListing[]): void {
    const firestoreItems: SliderItem[] = listedCars.map((l) => ({
      id: l.id,
      title: `${l.year} ${l.make} ${l.model}`,
      price: '$' + Number(l.price)?.toLocaleString(),
      meta: `${Number(l.mileage)?.toLocaleString()} km • ${l.transmission} • ${l.bodyType || 'Car'}`,
      badge: 'New Listing',
      image: l.images?.[0] || 'placeholder-car.svg',
      isUserListing: true,
    }));

    this.popularCars = [...firestoreItems, ...HARDCODED_CARS];
  }
}
