// src/app/core/components/header/header.component.ts - CORRIGÉ IMPORT UserProfile
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Observable } from 'rxjs';
// --- Imports Corrigés ---
import { AuthService } from '../../services/auth.service'; // Importer AuthService
import { UserProfile } from '../../../models/user.model'; // <<<=== Importer UserProfile depuis models (adapter si chemin différent)

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);

  currentUser$!: Observable<UserProfile | null>;

  ngOnInit(): void {
     this.currentUser$ = this.authService.currentUser$;
  }

  logoutUser(): void {
    this.authService.logout();
  }
}