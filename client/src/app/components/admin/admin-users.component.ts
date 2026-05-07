import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/other.services';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  pagination: any = null;
  loading = true;
  page = 1;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.adminService.getUsers(this.page).subscribe({
      next: res => { this.users = res.data.users; this.pagination = res.data.pagination; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  goTo(p: number): void { this.page = p; this.load(); }

  toggleRole(u: any): void {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    this.adminService.updateUserRole(u.uid, newRole).subscribe({
      next: res => {
        const i = this.users.findIndex(x => x.uid === u.uid);
        if (i > -1) this.users[i] = res.data.user;
      },
    });
  }

  deleteUser(uid: string): void {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    this.adminService.deleteUser(uid).subscribe({
      next: () => { this.users = this.users.filter(u => u.uid !== uid); },
    });
  }
}
