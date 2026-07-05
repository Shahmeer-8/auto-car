import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationData } from '../../core/services/notification.data';
import { AppNotification } from '../../core/models/notification.model';

/** In-app notifications feed for the current user. */
@Component({
  selector: 'app-admin-notifications',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './admin-notifications.html',
  styleUrl: './admin-notifications.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNotifications implements OnInit {
  private readonly data = inject(NotificationData);

  readonly items = signal<AppNotification[]>([]);
  readonly loading = signal(true);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.items.set(await this.data.listForCurrentUser());
    } catch {
      this.items.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async markRead(n: AppNotification): Promise<void> {
    if (n.read) return;
    try {
      await this.data.markRead(n.id);
      this.items.update((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    } catch {
      // non-fatal
    }
  }

  formatDate(iso: string): string {
    return iso ? new Date(iso).toLocaleString() : '';
  }
}
