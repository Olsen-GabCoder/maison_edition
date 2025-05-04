// src/app/pages/cart/cart/cart.component.ts
import { Component, inject, Signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
// === AJOUT/VÉRIFICATION: Importer Router ===
import { Router, RouterLink } from '@angular/router';
// =======================================
import { FormsModule } from '@angular/forms'; // Nécessaire pour [(ngModel)] sur l'input quantité

import { CartService } from '../../../core/services/cart.service';
import { CartItem } from '../../../models/cart-item.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule // Assurer que FormsModule est importé
  ],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartComponent {
  private cartService = inject(CartService);
  private notificationService = inject(NotificationService);
  // === AJOUT: Injecter Router ===
  private router = inject(Router);
  // ============================

  // --- Signaux pour l'état du panier ---
  cartItems: Signal<CartItem[]> = this.cartService.cartItems;
  totalAmount: Signal<number> = this.cartService.totalAmount;
  totalItems: Signal<number> = this.cartService.totalItems;
  // ----------------------------------

  /** Utilisé par *ngFor pour optimiser le rendu */
  trackByBookId(index: number, item: CartItem): number {
    return item.bookId;
  }

  /** Met à jour la quantité d'un article ou le supprime si quantité <= 0 */
  updateQuantity(item: CartItem, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let newQuantity: number;

    // Essayer de parser la quantité, mettre 0 si invalide ou vide
    try {
        newQuantity = parseInt(inputElement.value, 10);
        if (isNaN(newQuantity) || newQuantity < 0) {
             newQuantity = 0; // Si invalide ou négatif, considérer 0
        }
    } catch {
        newQuantity = 0; // Mettre 0 si erreur de parsing
    }

    // Logique de mise à jour ou suppression
    if (newQuantity === 0) {
        // Si la quantité devient 0, on retire l'item
        console.log(`[CartComponent] Quantité mise à 0 pour ${item.title}, suppression...`);
        this.removeItem(item); // Appelle la méthode qui gère aussi la notification
        // Remettre la valeur visuelle à 0 si l'utilisateur a tapé n'importe quoi
        // Note: l'item disparaîtra de toute façon au prochain cycle de détection
        inputElement.value = '0';
    } else {
        // Mettre à jour la quantité via le service
        console.log(`[CartComponent] Mise à jour quantité pour ${item.title} à ${newQuantity}`);
        this.cartService.updateItemQuantity(item.bookId, newQuantity);
        // S'assurer que la valeur affichée correspond bien (utile si on a forcé à 0 plus haut)
        inputElement.value = String(newQuantity);
    }
  }

  /** Supprime un article du panier */
  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.bookId);
    // La notification est gérée ici
    this.notificationService.showSuccess(`"${item.title}" retiré du panier.`);
  }

  /** Vide complètement le panier après confirmation */
  clearCart(): void {
    if (this.totalItems() === 0) return; // Ne rien faire si déjà vide

    if (confirm("Voulez-vous vraiment vider l'intégralité de votre panier ?")) {
      this.cartService.clearCart();
      this.notificationService.showSuccess("Panier vidé.");
    }
  }

  /** Calcule le sous-total pour un article (prix * quantité) */
  getItemSubtotal(item: CartItem): number {
    return item.price * item.quantity;
  }

  // === NOUVELLE MÉTHODE ===
  /**
   * Navigue vers la page de création de commande à partir du panier.
   */
  goToCartOrderPage(): void {
    // Vérification de sécurité (même si le bouton est caché)
    if (this.totalItems() === 0) {
      this.notificationService.showWarning("Votre panier est vide.");
      return;
    }
    console.log('[CartComponent] Navigation vers /order/from-cart...');
    // Redirige vers la route (qu'on créera à l'étape 3)
    this.router.navigate(['/order/from-cart']);
  }
  // =======================
}