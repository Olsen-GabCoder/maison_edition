// src/app/models/cart-item.model.ts

// Importer le modèle Book pour référencer son ID
import { Book } from './book.model';

export interface CartItem {
  bookId: number;       // Utilise le type de Book['id'] (number)
  quantity: number;     // Le nombre d'exemplaires de ce livre dans le panier

  // Informations du livre au moment de l'ajout (pour affichage dans le panier)
  title: string;        // Copie du titre du livre
  price: number;        // Copie du prix unitaire au moment de l'ajout
  coverUrl?: string;     // Optionnel: URL de la couverture pour affichage rapide
}

// Optionnel : Interface pour représenter le panier complet (utile si plus complexe)
// export interface Cart {
//   items: CartItem[];
//   totalAmount?: number; // Calculé
//   totalItems?: number; // Calculé
// }