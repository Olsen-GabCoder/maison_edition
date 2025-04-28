// src/app/core/components/header/header.component.ts
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; // Import nécessaires pour la navigation

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,         // Nécessaire pour routerLink
    RouterLinkActive    // Nécessaire pour routerLinkActive
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  // Pas de logique spécifique ici pour l'instant, mais tu peux ajouter des propriétés ou méthodes si nécessaire.
}
