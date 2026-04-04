import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-car-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './car-detail.html',
  styleUrls: ['./car-detail.css']
})
export class CarDetail implements OnInit {
  car: any = null;
  selectedImage = '';
  images: string[] = [];

  private allCars = [
    { id: 'static-1', name: '2022 Toyota Land Cruiser', price: '$45,000', km: '28,000 km', transmission: 'Automatic', body: 'SUV',   grade: '4.5', badge: 'Grade 4.5', image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80' },
    { id: 'static-2', name: '2021 Honda CR-V',          price: '$22,500', km: '32,000 km', transmission: 'Automatic', body: 'SUV',   grade: '4.0', badge: 'Hot Deal',  image: 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=800&q=80' },
    { id: 'static-3', name: '2022 Nissan X-Trail',      price: '$24,000', km: '21,000 km', transmission: 'Automatic', body: 'SUV',   grade: '4.5', badge: 'Popular',   image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80' },
    { id: 'static-4', name: '2022 Mazda CX-5',          price: '$26,000', km: '19,000 km', transmission: 'Automatic', body: 'SUV',   grade: '4.5', badge: 'Premium',   image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80' },
    { id: 'static-5', name: '2021 Subaru Forester',     price: '$21,000', km: '35,000 km', transmission: 'Automatic', body: 'SUV',   grade: '4.0', badge: 'Great Deal', image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80' },
    { id: 'static-6', name: '2020 Toyota Hilux',        price: '$32,000', km: '45,000 km', transmission: 'Manual',    body: 'Truck', grade: '4.0', badge: 'Hot Deal',  image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80' },
    { id: 'static-7', name: '2022 Lexus RX 350',        price: '$54,000', km: '12,000 km', transmission: 'Automatic', body: 'SUV',   grade: '4.5', badge: 'Premium',   image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80' },
    { id: 'static-8', name: '2021 Mitsubishi Pajero',   price: '$29,500', km: '38,000 km', transmission: 'Automatic', body: 'SUV',   grade: '4.0', badge: 'Grade 4',   image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80' },
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.car = null; return; }

    // ✅ Pehle localStorage se dhundo
    const storedListings = localStorage.getItem('carListings');
    if (storedListings) {
      const listings = JSON.parse(storedListings);
      const found = listings.find((l: any) => l.id === id);
      if (found) {
        this.car = {
          id: found.id,
          name: `${found.year} ${found.make} ${found.model}`,
          price: '$' + found.price?.toLocaleString(),
          km: found.mileage?.toLocaleString() + ' km',
          transmission: found.transmission,
          body: found.bodyType || 'N/A',
          grade: 'N/A',
          badge: found.status === 'approved' ? 'Approved' : 'Pending',
          image: found.images?.[0] || 'assets/placeholder-car.jpg',
          fuelType: found.fuelType,
          color: found.color,
          condition: found.condition,
          description: found.description,
          location: found.location,
          phone: found.phone,
          ownerName: found.ownerName,
          submittedAt: found.submittedAt,
          isUserListing: true
        };
        // ✅ Saari images set karo
        this.images = found.images?.length > 0
          ? found.images
          : ['assets/placeholder-car.jpg'];
        this.selectedImage = this.images[0];
        return;
      }
    }

    // ✅ Hardcoded cars
    const numId = Number(id);
    if (!isNaN(numId) && numId >= 1 && numId <= this.allCars.length) {
      this.car = this.allCars[numId - 1];
      this.images = [this.car.image];
      this.selectedImage = this.car.image;
    } else {
      this.car = null;
    }
  }

  selectImage(img: string) {
    this.selectedImage = img;
  }
}