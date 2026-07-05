import { Injectable, inject, signal } from '@angular/core';
import { RolesData } from './roles.data';
import { Role } from '../models/role.model';

/** Signal-based state + use-cases for the Roles & Permissions module. */
@Injectable({ providedIn: 'root' })
export class RolesFacade {
  private readonly data = inject(RolesData);

  readonly roles = signal<Role[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.roles.set(await this.data.listRoles());
    } catch {
      this.error.set('Failed to load roles.');
    } finally {
      this.loading.set(false);
    }
  }

  async save(role: Role): Promise<boolean> {
    try {
      await this.data.saveRole(role);
      await this.load();
      return true;
    } catch {
      this.error.set('Failed to save role.');
      return false;
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.data.deleteRole(id);
      this.roles.update((rs) => rs.filter((r) => r.id !== id));
      return true;
    } catch {
      this.error.set('Failed to delete role.');
      return false;
    }
  }
}
