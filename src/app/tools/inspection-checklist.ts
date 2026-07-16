import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-inspection-checklist',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-page">
      <h1>Used Car Inspection Checklist</h1>
      <p class="sub">What to verify before buying an imported Japanese vehicle.</p>
      @for (section of sections; track section.title) {
        <section>
          <h2>{{ section.title }}</h2>
          <ul>
            @for (item of section.items; track item) { <li><label><input type="checkbox" /> {{ item }}</label></li> }
          </ul>
        </section>
      }
      <p class="cta"><a routerLink="/cars">Browse inspected cars →</a></p>
    </div>
  `,
  styles: `
    .tool-page { max-width: 720px; margin: 0 auto; padding: 48px 20px 80px; }
    h1 { font-size: 1.8rem; } .sub { color: #6b7280; margin-bottom: 28px; }
    section { margin-bottom: 24px; } h2 { font-size: 1.15rem; margin-bottom: 10px; }
    ul { list-style: none; padding: 0; } li { padding: 6px 0; }
    label { display: flex; gap: 10px; align-items: baseline; cursor: pointer; }
    .cta { margin-top: 24px; }
  `,
})
export class InspectionChecklist {
  readonly sections = [
    { title: 'Documents', items: [
      'Export certificate / deregistration papers present',
      'Auction sheet matches the advertised grade',
      'Mileage on auction sheet matches the odometer',
      'Service history booklet included',
    ]},
    { title: 'Exterior & Underbody', items: [
      'No mismatched paint or panel gaps (accident signs)',
      'Underbody rust check — especially wheel arches and frame rails',
      'Tyres wear evenly (alignment/suspension health)',
      'All lights and glass intact',
    ]},
    { title: 'Engine & Drivetrain', items: [
      'Cold start: no blue/white smoke',
      'No oil or coolant leaks around the engine bay',
      'Automatic shifts smoothly through all gears',
      'No unusual noise from CV joints or wheel bearings on a test drive',
    ]},
    { title: 'Interior & Electronics', items: [
      'Air conditioning blows cold',
      'All windows, mirrors, and locks operate',
      'No warning lights on the dashboard after start',
      'Seat wear consistent with the advertised mileage',
    ]},
  ];
}
