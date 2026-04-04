import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.html',
  styleUrls: ['./about.css']
})
export class About {

  features = [
    { icon: '🏆', title: 'Auction-Certified Quality',    desc: 'Every vehicle passes Japan\'s rigorous official auction grading. We stock only Grade 4.0 and above — guaranteed.' },
    { icon: '💎', title: 'Transparent Pricing',           desc: 'No hidden fees, no last-minute surprises. Full cost breakdowns provided before you commit to anything.' },
    { icon: '🛡️', title: 'Zero Hidden Charges',          desc: 'Vehicle price, shipping, and documentation costs are presented upfront with complete clarity.' },
    { icon: '📋', title: 'Full Inspection Reports',       desc: 'Detailed Japanese auction sheets covering interior, exterior, engine, and chassis condition for every car.' },
    { icon: '🌍', title: 'Worldwide Shipping',            desc: 'We manage end-to-end export logistics — from auction to your port — with marine insurance included.' },
    { icon: '🤝', title: 'Lifetime After-Sale Support',  desc: 'Our relationship doesn\'t end at delivery. We assist with customs, registration, and any post-sale queries.' },
  ];

  services = [
    { icon: '🚗', title: 'Buy Used Cars',          desc: 'Explore 1,200+ premium Japanese vehicles filtered by brand, body type, budget, and auction grade. Every listing is verified.' },
    { icon: '💰', title: 'Import Consultation',    desc: 'Our export specialists walk you through every step — from choosing the right car to clearing customs in your country.' },
    { icon: '🔍', title: 'Vehicle Inspection',     desc: 'Receive a comprehensive Japanese auction sheet with full structural, mechanical and cosmetic condition grading.' },
    { icon: '📄', title: 'Documentation Support', desc: 'We prepare and handle all export paperwork — deregistration certificates, bill of lading, and customs declarations.' },
    { icon: '🚢', title: 'Shipping & Logistics',   desc: 'RoRo and container shipping options available. Real-time tracking and marine insurance on every shipment.' },
  ];

  trustPoints = [
    { icon: '📋', title: 'Document Verification',      desc: 'Every title, ownership record, and export certificate is verified and cross-referenced before listing.' },
    { icon: '🛣️', title: 'Genuine Mileage Guarantee', desc: 'Odometer readings are validated against Japan\'s national vehicle history database — no tampering, ever.' },
    { icon: '💥', title: 'Accident History Checks',    desc: 'Structural and cosmetic damage is fully disclosed on the official auction inspection sheet — no exceptions.' },
    { icon: '⭐', title: 'Customer Satisfaction First', desc: 'We are not satisfied until your vehicle arrives safely and you are completely happy with your purchase.' },
  ];

  teamStats = [
    { display: '1,200+', lbl: 'Cars in Stock' },
    { display: '50+',    lbl: 'Countries Served' },
    { display: '8,000+', lbl: 'Happy Customers' },
    { display: '10+',    lbl: 'Years Experience' },
  ];
}