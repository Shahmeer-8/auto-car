import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Header } from './header';
import { AuthService } from '../../../services/auth.service';

describe('Header', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        // Stub AuthService so the test never touches Firebase.
        { provide: AuthService, useValue: { userProfile$: of(null) } },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Header);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('toggleResearch opens research and closes shop', () => {
    const fixture = TestBed.createComponent(Header);
    const header = fixture.componentInstance;
    header.shopOpen = true;

    header.toggleResearch();

    expect(header.researchOpen).toBe(true);
    expect(header.shopOpen).toBe(false);
  });

  it('closeAll closes every menu', () => {
    const fixture = TestBed.createComponent(Header);
    const header = fixture.componentInstance;
    header.researchOpen = true;
    header.mobileMenuOpen = true;

    header.closeAll();

    expect(header.researchOpen).toBe(false);
    expect(header.mobileMenuOpen).toBe(false);
  });
});
