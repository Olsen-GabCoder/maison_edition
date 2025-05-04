// src/app/core/services/cart.service.ts
import { Injectable, computed, signal, effect } from '@angular/core';
import { Book } from '../../models/book.model'; // Pour typer l'argument d'ajout
import { CartItem } from '../../models/cart-item.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_KEY = 'app_cart_items'; // Clé LocalStorage

  // --- Utilisation des Signaux pour l'état du panier ---
  // Signal privé contenant le tableau des CartItem
  #cartItems = signal<CartItem[]>(this.loadCartFromStorage());

  // Signal public (lecture seule) pour les composants
  public readonly cartItems = this.#cartItems.asReadonly();

  // Signal calculé pour le nombre total d'articles
  public readonly totalItems = computed(() => {
    return this.#cartItems().reduce((acc, item) => acc + item.quantity, 0);
  });

  // Signal calculé pour le montant total du panier
  public readonly totalAmount = computed(() => {
    return this.#cartItems().reduce((acc, item) => acc + (item.price * item.quantity), 0);
  });

  constructor() {
    console.log('[CartService] Initialisé. Panier chargé:', this.#cartItems());

    // --- Effet pour sauvegarder dans localStorage à chaque changement ---
    // `effect` s'exécute automatiquement lorsque les signaux dont il dépend (#cartItems) changent.
    // `allowSignalWrites: true` est nécessaire car l'effet initial de chargement
    // pourrait potentiellement modifier le signal si le localStorage est invalide.
    effect(() => {
      console.log('[CartService] Changement détecté dans #cartItems, sauvegarde localStorage...');
      this.saveCartToStorage(this.#cartItems());
    }, { allowSignalWrites: true }); // Important pour l'exécution initiale potentiellement modificatrice
  }

  // --- Méthodes Publiques ---

  /** Ajoute un livre au panier ou incrémente sa quantité */
  addItem(book: Book, quantity: number = 1): void {
    if (quantity <= 0) return; // Ne pas ajouter si quantité invalide

    const currentItems = this.#cartItems();
    const existingItemIndex = currentItems.findIndex(item => item.bookId === book.id);

    if (existingItemIndex > -1) {
      // Le livre existe déjà: mettre à jour la quantité
      console.log(`[CartService] Incrémentation quantité pour livre ID: ${book.id}`);
      const updatedItems = currentItems.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + quantity } // Nouvelle quantité
          : item
      );
      this.#cartItems.set(updatedItems); // Mettre à jour le signal
    } else {
      // Nouveau livre: créer un CartItem et l'ajouter
      console.log(`[CartService] Ajout nouveau livre ID: ${book.id}`);
      const newItem: CartItem = {
        bookId: book.id,
        quantity: quantity,
        title: book.title, // Copier les infos au moment de l'ajout
        price: book.price,
        coverUrl: book.coverUrl
      };
      this.#cartItems.set([...currentItems, newItem]); // Ajouter le nouvel item au tableau
    }
  }

  /** Met à jour la quantité d'un article spécifique dans le panier */
  updateItemQuantity(bookId: number, newQuantity: number): void {
    if (newQuantity < 0) return; // Quantité négative non autorisée

    if (newQuantity === 0) {
      // Si la quantité est 0, supprimer l'article
      this.removeItem(bookId);
      return;
    }

    const currentItems = this.#cartItems();
    const updatedItems = currentItems.map(item =>
      item.bookId === bookId
        ? { ...item, quantity: newQuantity }
        : item
    );

    // Vérifier si l'élément a réellement été trouvé et mis à jour
    if (JSON.stringify(updatedItems) !== JSON.stringify(currentItems)) {
         console.log(`[CartService] Mise à jour quantité pour livre ID: ${bookId} à ${newQuantity}`);
         this.#cartItems.set(updatedItems);
    } else {
        console.warn(`[CartService updateItemQuantity] Livre ID ${bookId} non trouvé dans le panier.`);
    }
  }

  /** Supprime complètement un article du panier */
  removeItem(bookId: number): void {
    const currentItems = this.#cartItems();
    const updatedItems = currentItems.filter(item => item.bookId !== bookId);

     if (updatedItems.length < currentItems.length) {
        console.log(`[CartService] Suppression livre ID: ${bookId}`);
        this.#cartItems.set(updatedItems);
     } else {
         console.warn(`[CartService removeItem] Livre ID ${bookId} non trouvé pour suppression.`);
     }
  }

  /** Vide entièrement le panier */
  clearCart(): void {
    console.log('[CartService] Vidage du panier.');
    this.#cartItems.set([]); // Mettre à jour avec un tableau vide
  }

  // --- Méthodes Privées pour LocalStorage ---

  /** Charge le panier depuis localStorage lors de l'initialisation */
  private loadCartFromStorage(): CartItem[] {
    if (typeof localStorage === 'undefined') {
        console.warn("[CartService] LocalStorage non disponible pour charger le panier.");
        return [];
    }
    const storedCart = localStorage.getItem(this.CART_KEY);
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        // Valider basiquement si c'est un tableau (peut être amélioré)
        if (Array.isArray(parsedCart)) {
          // On pourrait ajouter une validation plus poussée de chaque CartItem ici
          return parsedCart as CartItem[];
        } else {
          console.warn("[CartService] Données du panier stockées invalides (pas un tableau). Réinitialisation.");
          localStorage.removeItem(this.CART_KEY);
        }
      } catch (e) {
        console.error("[CartService] Erreur lecture JSON panier:", e);
        localStorage.removeItem(this.CART_KEY); // Nettoyer clé invalide
      }
    }
    return []; // Retourne tableau vide si rien ou invalide
  }

  /** Sauvegarde le panier actuel dans localStorage */
  private saveCartToStorage(cartItems: CartItem[]): void {
    if (typeof localStorage === 'undefined') {
       console.warn("[CartService] LocalStorage non disponible pour sauvegarder le panier.");
        return;
    }
    try {
      const dataToStore = JSON.stringify(cartItems);
      localStorage.setItem(this.CART_KEY, dataToStore);
       console.log("[CartService] Panier sauvegardé dans localStorage:", dataToStore);
    } catch (e) {
      console.error("[CartService] Erreur sauvegarde JSON panier:", e);
    }
  }
}