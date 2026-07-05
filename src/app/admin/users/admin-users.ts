import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UsersData } from '../../core/rbac/users.data';
import { RolesFacade } from '../../core/rbac/roles.facade';
import { AppUser } from '../../models/user.model';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

/** User management: list staff, assign a role (server-side via Cloud Function), ban/unban. */
@Component({
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, HasPermissionDirective],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers implements OnInit {
  private readonly usersData = inject(UsersData);
  private readonly rolesFacade = inject(RolesFacade);

  readonly users = signal<AppUser[]>([]);
  readonly loading = signal(true);
  readonly busyUid = signal<string | null>(null);
  readonly roles = this.rolesFacade.roles;

  async ngOnInit(): Promise<void> {
    await Promise.all([this.rolesFacade.load(), this.load()]);
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.users.set(await this.usersData.listUsers());
    } catch {
      this.users.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async assignRole(user: AppUser, roleId: string): Promise<void> {
    if (!roleId || roleId === user.roleId) return;
    this.busyUid.set(user.uid);
    try {
      await this.usersData.assignRole(user.uid, roleId);
      const role = this.roles().find((r) => r.id === roleId);
      this.users.update((list) =>
        list.map((u) =>
          u.uid === user.uid
            ? { ...u, roleId, roleName: role?.name, permissions: role?.permissions ?? [] }
            : u,
        ),
      );
    } catch {
      alert('Failed to change role. Please try again.');
    } finally {
      this.busyUid.set(null);
    }
  }

  async toggleActive(user: AppUser): Promise<void> {
    const next = !user.isActive;
    this.busyUid.set(user.uid);
    try {
      await this.usersData.setActive(user.uid, next);
      this.users.update((list) =>
        list.map((u) => (u.uid === user.uid ? { ...u, isActive: next } : u)),
      );
    } catch {
      alert('Failed to update status. Please try again.');
    } finally {
      this.busyUid.set(null);
    }
  }
}
