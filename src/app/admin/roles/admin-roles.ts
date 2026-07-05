import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RolesFacade } from '../../core/rbac/roles.facade';
import { groupPermissions } from '../../core/auth/permissions';
import { Role } from '../../core/models/role.model';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';

/** Dynamic RBAC: list roles and edit their permission matrix (grouped by resource). */
@Component({
  selector: 'app-admin-roles',
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, HasPermissionDirective],
  templateUrl: './admin-roles.html',
  styleUrl: './admin-roles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRoles implements OnInit {
  private readonly facade = inject(RolesFacade);

  readonly roles = this.facade.roles;
  readonly loading = this.facade.loading;

  /** { ads: ['ads.view', ...], sales: [...] } — drives the matrix layout. */
  readonly groups = groupPermissions();
  readonly groupKeys = Object.keys(this.groups);

  readonly editing = signal<Role | null>(null);
  readonly saving = signal(false);
  readonly isNew = computed(() => this.editing() !== null && !this.editing()!.id);

  ngOnInit(): void {
    void this.facade.load();
  }

  startCreate(): void {
    this.editing.set({
      id: '', name: '', description: '', permissions: [],
      isSystem: false, createdAt: '', updatedAt: '',
    });
  }

  startEdit(role: Role): void {
    this.editing.set({ ...role, permissions: [...(role.permissions ?? [])] });
  }

  cancel(): void {
    this.editing.set(null);
  }

  hasPermission(p: string): boolean {
    return this.editing()?.permissions.includes(p) ?? false;
  }

  togglePermission(p: string, checked: boolean): void {
    const e = this.editing();
    if (!e) return;
    const permissions = checked
      ? [...e.permissions, p]
      : e.permissions.filter((x) => x !== p);
    this.editing.set({ ...e, permissions });
  }

  groupAllChecked(key: string): boolean {
    return this.groups[key].every((p) => this.hasPermission(p));
  }

  toggleGroup(key: string, checked: boolean): void {
    const e = this.editing();
    if (!e) return;
    const groupPerms = this.groups[key];
    const permissions = checked
      ? Array.from(new Set([...e.permissions, ...groupPerms]))
      : e.permissions.filter((p) => !groupPerms.includes(p));
    this.editing.set({ ...e, permissions });
  }

  async save(): Promise<void> {
    const e = this.editing();
    if (!e || !e.name.trim()) return;
    const role: Role = {
      ...e,
      id: e.id || e.name.trim().toLowerCase().replace(/\s+/g, '-'),
      name: e.name.trim(),
    };
    this.saving.set(true);
    const ok = await this.facade.save(role);
    this.saving.set(false);
    if (ok) this.editing.set(null);
  }

  async remove(role: Role): Promise<void> {
    if (role.isSystem) return;
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    await this.facade.remove(role.id);
  }
}
