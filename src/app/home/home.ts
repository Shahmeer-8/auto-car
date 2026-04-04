import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeroSlider } from '../hero-slider/hero-slider';
import { CarsSlider } from '../cars-slider/cars-slider';
import { GuidesSlider } from '../guides-slider/guides-slider';
import { RankingsSlider } from '../rankings-slider/rankings-slider';
import { ReliableSlider } from '../reliable-slider/reliable-slider';
import { StudiesSlider } from '../studies-slider/studies-slider';
import { ResourcesSlider } from '../resources-slider/resources-slider';
import { BestUsedSlider } from '../best-used-slider/best-used-slider';
import { ComparisonsSlider } from '../comparisons-slider/comparisons-slider';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeroSlider, CarsSlider, GuidesSlider, RankingsSlider, ReliableSlider, StudiesSlider, ResourcesSlider, BestUsedSlider, ComparisonsSlider],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {

  brands = [
    { logo: '🚗', name: 'Toyota',     count: '1,240' },
    { logo: '🏎️', name: 'Honda',      count: '980'   },
    { logo: '🚙', name: 'Nissan',     count: '850'   },
    { logo: '🚘', name: 'Mazda',      count: '620'   },
    { logo: '🏔️', name: 'Subaru',     count: '430'   },
    { logo: '⚡',  name: 'Mitsubishi', count: '380'   },
    { logo: '🛻', name: 'Suzuki',     count: '290'   },
    { logo: '💎', name: 'Lexus',      count: '310'   },
    { logo: '🌟', name: 'Daihatsu',   count: '180'   },
    { logo: '🚐', name: 'Isuzu',      count: '140'   },
  ];

  bodyTypes = [
    { icon: '🚗', name: 'Sedan'       },
    { icon: '🚙', name: 'SUV'         },
    { icon: '🛻', name: 'Truck'       },
    { icon: '🚐', name: 'Minivan'     },
    { icon: '🏎️', name: 'Coupe'       },
    { icon: '🚘', name: 'Hatchback'   },
    { icon: '🚌', name: 'Wagon'       },
    { icon: '⚡',  name: 'Electric'    },
    { icon: '🔋', name: 'Hybrid'      },
    { icon: '🚗', name: 'Convertible' },
    { icon: '🚙', name: 'CUV'         },
    { icon: '🚐', name: 'Van'         },
    { icon: '🚘', name: 'Compact'     },
    { icon: '🏎️', name: 'Sports Car'  },
    { icon: '💎', name: 'Luxury'      },
    { icon: '✅', name: 'CPO'         },
  ];

  whyItems = [
    {
      icon: '📊',
      title: 'Low Mileage Guaranteed',
      desc: 'Japanese roads are short and well-maintained. Most used cars have surprisingly low mileage compared to global standards.',
      badge: 'Avg 30,000 KM'
    },
    {
      icon: '🔍',
      title: 'Strict Auction Inspection',
      desc: "Every car goes through Japan's rigorous auction grading system. Grade 4 and above means excellent condition.",
      badge: 'Grade 4.5 Avg'
    },
    {
      icon: '🛡️',
      title: 'Well Maintained Culture',
      desc: 'Japanese owners maintain their vehicles religiously — regular servicing, careful driving, original parts.',
      badge: 'Full Service History'
    },
    {
      icon: '🚢',
      title: 'Worldwide Shipping',
      desc: 'We ship directly from Japan to your port. Fast, insured, and tracked delivery to 50+ countries.',
      badge: '50+ Countries'
    },
  ];

  stats = [
    { number: '1,200+', label: 'Cars Listed'       },
    { number: '50+',    label: 'Countries Shipped' },
    { number: '4.5',    label: 'Avg Auction Grade' },
    { number: '10yrs',  label: 'Experience'        },
  ];
}