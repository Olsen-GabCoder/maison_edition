// src/app/admin/components/admin-layout/admin-layout.component.ts
import { Component, inject } from '@angular/core'; // <<< Importer inject
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service'; // <<< Importer AuthService

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent {
  // Utiliser inject() pour obtenir une instance de AuthService
  private authService = inject(AuthService); // <<< Injection du service

  // Méthode appelée par le bouton (click)="logout()" dans le HTML
  logout(): void {
    console.log('[AdminLayout] Appel de la déconnexion...');
    this.authService.logout(); // <<< Appelle la méthode du service qui gère la déconnexion et la redirection
  }
}