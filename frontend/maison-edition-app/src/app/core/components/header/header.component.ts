// src/app/core/components/header/header.component.ts (MODIFIÉ pour Panier)
import { Component, inject, OnInit, Signal } from '@angular/core'; // Ajout Signal
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../../models/user.model';
// === AJOUT: Importer CartService ===
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  // === AJOUT: Injecter CartService ===
  private cartService = inject(CartService);

  currentUser$!: Observable<UserProfile | null>;

  // === AJOUT: Exposer le signal totalItems du panier ===
  // Le signal est directement utilisable dans le template sans async pipe
  cartItemCount: Signal<number> = this.cartService.totalItems;

  ngOnInit(): void {
     this.currentUser$ = this.authService.currentUser$;
     // Le log existant est utile
     this.currentUser$.subscribe(user => console.log('[Header] User updated:', user));
     // Log pour le panier (optionnel, car le signal est auto-mis à jour)
     // effect(() => console.log('[Header] Cart count updated:', this.cartItemCount())); // Nécessiterait inject(effect)
  }

  getUserDisplayName(user: UserProfile | null): string {
    if (!user) return '';
    return user.firstName ? user.firstName : user.email;
  }

  logoutUser(): void {
    this.authService.logout();
  }
}