import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { AuditData } from '../../core/services/audit.data';
import { AuditLog } from '../../core/models/audit.model';

/** Read-only viewer for the append-only audit trail. */
@Component({
  selector: 'app-admin-audit',
  imports: [CommonModule, MatCardModule],
  templateUrl: './admin-audit.html',
  styleUrl: './admin-audit.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAudit implements OnInit {
  private readonly data = inject(AuditData);

  readonly logs = signal<AuditLog[]>([]);
  readonly loading = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      this.logs.set(await this.data.list());
    } catch {
      this.logs.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(iso: string): string {
    return iso ? new Date(iso).toLocaleString() : '—';
  }
}
