// src/app/core/services/order.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Order, OrderStatus } from '../../models/order.model'; // Vérifiez chemin
import { OrderItem } from '../../models/order-item.model';   // Vérifiez chemin
import { Address } from '../../models/address.model';       // Vérifiez chemin
import { Book } from '../../models/book.model';           // Vérifiez chemin

// Clé pour le localStorage
const USER_ORDERS_STORAGE_KEY = 'editAppUserOrders';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  // Le BehaviorSubject pour la liste "globale" ou "admin"
  private ordersSubject = new BehaviorSubject<Order[]>(this.loadInitialOrders());
  // L'observable exposé pour les composants qui veulent la liste admin
  public orders$: Observable<Order[]> = this.ordersSubject.asObservable();

  constructor() {
    console.log('[OrderService] Initialisé.');
  }

  /**
   * Charge les commandes initiales pour le BehaviorSubject.
   * Actuellement, charge uniquement les données mock.
   * Pourrait être étendu pour fusionner avec localStorage si nécessaire.
   */
  private loadInitialOrders(): Order[] {
    console.log('[OrderService] loadInitialOrders: Chargement des données mock pour BehaviorSubject.');
    return this.generateMockOrders();
  }

  /** Génère des données simulées initiales */
  private generateMockOrders(): Order[] {
     // NOTE : Assurez-vous que ces données mock respectent VOS modèles actuels
     // (id: string, pas de subTotal dans items, OrderStatus correct, etc.)
     const mockOrders: Order[] = [
       {
         id: 'ORD-2023-001', orderNumber: 'CMD231115001', customerId: null, customerName: 'Alice Dupont', customerEmail: 'alice.d@email.com',
         items: [{ bookId: 1, title: 'Le Seigneur des Anneaux', quantity: 1, price: 25.50 }, { bookId: 3, title: '1984', quantity: 1, price: 15.00 }],
         totalAmount: 40.50, status: 'Processing', orderDate: new Date(2023, 10, 15, 10, 30), lastUpdate: new Date(2023, 10, 15, 10, 30),
         shippingAddress: { street: '1 rue de la Paix', city: 'Paris', zipCode: '75001', country: 'France' }
       },
       {
         id: 'ORD-2023-002', orderNumber: 'CMD231118002', customerId: 101, customerName: 'Bob Martin', customerEmail: 'bob.m@email.com',
         items: [{ bookId: 2, title: 'Fondation', quantity: 1, price: 18.00 }],
         totalAmount: 18.00, status: 'Shipped', orderDate: new Date(2023, 10, 18, 14, 0), lastUpdate: new Date(2023, 10, 19, 9, 0),
         shippingAddress: { street: '10 avenue des Champs', city: 'Lyon', zipCode: '69002', country: 'France' }
       },
       // Ajoutez d'autres mocks si nécessaire
     ];
     console.log('[OrderService] generateMockOrders: Données mock générées.');
     return mockOrders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  }

  // --- Méthodes pour lire/écrire les commandes UTILISATEUR dans localStorage ---

  /** Récupère les commandes stockées localement pour l'utilisateur */
  private getUserOrdersFromStorage(): Order[] {
    try {
      const storedOrders = localStorage.getItem(USER_ORDERS_STORAGE_KEY);
      const orders = storedOrders ? JSON.parse(storedOrders) : [];
      // Important: Reconvertir les chaînes de date en objets Date
      return orders.map((order: any) => ({
          ...order,
          orderDate: new Date(order.orderDate),
          lastUpdate: new Date(order.lastUpdate)
      }));
    } catch (e) {
      console.error('[OrderService] Erreur lecture localStorage pour commandes utilisateur:', e);
      return [];
    }
  }

  /** Sauvegarde la liste complète des commandes UTILISATEUR dans localStorage */
  private saveUserOrdersToStorage(orders: Order[]): void {
    try {
      // Trier avant sauvegarde peut être une bonne idée
      const sortedOrders = orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
      localStorage.setItem(USER_ORDERS_STORAGE_KEY, JSON.stringify(sortedOrders));
      console.log(`[OrderService] ${orders.length} commandes utilisateur sauvegardées dans localStorage.`);
    } catch (e) {
      console.error('[OrderService] Erreur écriture localStorage pour commandes utilisateur:', e);
    }
  }

  /** Ajoute UNE commande au stockage local UTILISATEUR */
  private addOrderToUserStorage(order: Order): void {
      const currentStoredOrders = this.getUserOrdersFromStorage();
      if (!currentStoredOrders.some(o => o.id === order.id)) {
          const updatedStoredOrders = [...currentStoredOrders, order];
          this.saveUserOrdersToStorage(updatedStoredOrders);
      } else {
           console.warn(`[OrderService] Tentative d'ajout au storage d'une commande déjà existante (ID: ${order.id})`);
      }
  }

   /** Met à jour UNE commande dans le stockage local UTILISATEUR */
   private updateOrderInUserStorage(updatedOrder: Order): void {
     const currentStoredOrders = this.getUserOrdersFromStorage();
     const index = currentStoredOrders.findIndex(o => o.id === updatedOrder.id);
     if (index !== -1) {
       currentStoredOrders[index] = updatedOrder; // Met à jour l'élément
       this.saveUserOrdersToStorage(currentStoredOrders);
       console.log(`[OrderService] Commande ${updatedOrder.id} mise à jour dans localStorage.`);
     } else {
         console.warn(`[OrderService] Tentative de mise à jour localStorage pour commande ${updatedOrder.id} non trouvée.`);
         // Optionnel : ajouter la commande si elle manque ? Ou logguer l'incohérence.
         // this.addOrderToUserStorage(updatedOrder); // Ceci pourrait ajouter une commande si elle a été supprimée ailleurs
     }
   }

  // --- Méthodes de Service Publiques ---

  /** Retourne l'observable pour la liste principale/admin */
  getOrders(): Observable<Order[]> {
    return this.orders$;
  }

  /** Récupère les commandes spécifiques à l'utilisateur (depuis localStorage) */
  getUserOrders(): Observable<Order[]> {
      console.log('[OrderService] getUserOrders appelé (lecture localStorage).');
      return of(this.getUserOrdersFromStorage()); // Retourne un Observable pour cohérence
  }

  /** Récupère une commande par ID (recherche dans la liste principale/admin) */
  getOrderById(id: string): Observable<Order | undefined> {
    // Recherche dans la liste principale (admin) émise par BehaviorSubject
    return this.orders$.pipe(map(orders => orders.find(order => order.id === id)));
  }

  /**
   * Ajoute une nouvelle commande :
   * 1. Met à jour le BehaviorSubject (pour la liste admin).
   * 2. Ajoute la commande au localStorage (pour la liste utilisateur).
   */
  addOrder(
    orderFormData: { customerName: string, customerEmail: string, customerId?: string | number | null, shippingAddress: Address },
    selectedBook: Book
  ): Observable<Order> {

    const currentAdminOrders = this.ordersSubject.getValue();
    console.log(`[OrderService] addOrder: Nombre commandes admin AVANT ajout: ${currentAdminOrders.length}`);

    // Générer infos internes
    const newId: string = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const orderNumber = `CMD${newId.slice(-8)}`;
    const orderDate = new Date();
    const lastUpdate = new Date();
    const status: OrderStatus = 'Shipped'; // Statut par défaut

    // Créer OrderItem
    const orderItem: OrderItem = {
      bookId: selectedBook.id,
      title: selectedBook.title,
      quantity: 1,
      price: selectedBook.price
    };

    // Calculer total
    const totalAmount = orderItem.price * orderItem.quantity;

    // Gérer customerId (vers number | null)
    let customerIdToSave: number | null = null;
    if (orderFormData.customerId != null && orderFormData.customerId !== '') { // Vérifier null/undefined/vide
        const parsedId = parseInt(String(orderFormData.customerId), 10);
        if (!isNaN(parsedId)) {
            customerIdToSave = parsedId;
        } else {
             console.warn(`[OrderService] addOrder: customerId "${orderFormData.customerId}" fourni mais invalide.`);
        }
    }

    // ===> CORRECTION : Définition complète de l'objet newOrder <===
    const newOrder: Order = {
      id: newId,
      orderNumber: orderNumber,
      orderDate: orderDate,
      status: status,
      totalAmount: totalAmount,
      lastUpdate: lastUpdate,
      customerName: orderFormData.customerName,
      customerEmail: orderFormData.customerEmail,
      customerId: customerIdToSave,
      shippingAddress: orderFormData.shippingAddress,
      items: [orderItem]
    };
    // ===> FIN CORRECTION <===

    // 1. Mettre à jour la liste admin via BehaviorSubject
    const updatedAdminOrders = [...currentAdminOrders, newOrder].sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
    this.ordersSubject.next(updatedAdminOrders);
    console.log('[OrderService] addOrder: Notifié les abonnés admin (BehaviorSubject).');

    // 2. AJOUTER au localStorage pour l'utilisateur
    this.addOrderToUserStorage(newOrder);

    console.log('[OrderService] addOrder: Ajout terminé.');
    return of(newOrder); // Retourner la commande créée
  }

  /**
   * Met à jour le statut d'une commande :
   * 1. Met à jour le BehaviorSubject (pour admin).
   * 2. Met à jour la commande dans localStorage (pour utilisateur).
   */
  updateOrderStatus(id: string, newStatus: OrderStatus): Observable<Order | undefined> {
    let currentAdminOrders = this.ordersSubject.getValue();
    const orderIndex = currentAdminOrders.findIndex(order => order.id === id);
    let updatedOrder: Order | undefined = undefined;

    if (orderIndex !== -1) {
      updatedOrder = {
          ...currentAdminOrders[orderIndex],
          status: newStatus,
          lastUpdate: new Date() // Nom de propriété correct
      };
      const updatedAdminList = [...currentAdminOrders]; // Copie
      updatedAdminList[orderIndex] = updatedOrder; // Remplacement

      // 1. Mettre à jour la liste admin
      this.ordersSubject.next(updatedAdminList);
      console.log(`[OrderService] updateOrderStatus: Statut mis à jour pour admin pour ID ${id}.`);

      // 2. METTRE A JOUR le localStorage pour l'utilisateur
      this.updateOrderInUserStorage(updatedOrder);

      return of(updatedOrder);
    } else {
      console.warn(`[OrderService] updateOrderStatus: Commande ID ${id} non trouvée dans la liste admin.`);
      return of(undefined);
    }
  }

  /**
   * Supprime une commande UNIQUEMENT de la liste admin (BehaviorSubject).
   * Ne touche pas au localStorage utilisateur dans cette version.
   */
  deleteOrder(id: string): Observable<void> {
    let currentAdminOrders = this.ordersSubject.getValue();
    const updatedOrders = currentAdminOrders.filter(order => order.id !== id);

    if (updatedOrders.length < currentAdminOrders.length) {
      this.ordersSubject.next(updatedOrders); // Met à jour seulement la liste admin
      console.log(`[OrderService] deleteOrder: Commande ${id} supprimée de la liste admin.`);
      return of(undefined);
    } else {
      console.warn(`[OrderService] deleteOrder: Commande ${id} non trouvée dans liste admin.`);
      return throwError(() => new Error(`Commande ${id} non trouvée.`));
    }
  }
}