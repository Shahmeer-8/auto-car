import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { HasPermissionDirective } from './has-permission.directive';
import { AuthService } from '../../services/auth.service';
import { AppUser } from '../../models/user.model';

@Component({
  imports: [HasPermissionDirective],
  template: `<span *appHasPermission="'sales.create'">GRANTED</span>`,
})
class HostComponent {}

function makeAuthStub(permissions: string[]) {
  const subject = new BehaviorSubject<AppUser | null>({
    uid: 'u1',
    name: 'Test',
    email: 't@x.com',
    phone: '',
    userType: 'admin',
    createdAt: '',
    isActive: true,
    permissions,
  });
  return {
    userProfile$: subject.asObservable(),
    get permissions() {
      return subject.value?.permissions ?? [];
    },
  };
}

describe('HasPermissionDirective', () => {
  function setup(permissions: string[]) {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: AuthService, useValue: makeAuthStub(permissions) }],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders content when the user has the permission', () => {
    const el = setup(['sales.create']);
    expect(el.textContent).toContain('GRANTED');
  });

  it('hides content when the user lacks the permission', () => {
    const el = setup(['ads.view']);
    expect(el.textContent).not.toContain('GRANTED');
  });

  it('renders content for the wildcard permission', () => {
    const el = setup(['*']);
    expect(el.textContent).toContain('GRANTED');
  });
});
