// src/app/core/services/order.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, distinctUntilChanged } from 'rxjs/operators'; // distinctUntilChanged ajouté pour optimisation potentielle
import { Order, OrderStatus } from '../../models/order.model'; // Vérifiez chemin
import { OrderItem } from '../../models/order-item.model';   // Vérifiez chemin
import { Address } from '../../models/address.model';       // Vérifiez chemin
import { Book } from '../../models/book.model';           // Vérifiez chemin

// Clé localStorage unique pour toutes les commandes
const ORDERS_STORAGE_KEY = 'editAppOrders';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  // BehaviorSubject initialisé avec les données persistantes
  private ordersSubject = new BehaviorSubject<Order[]>(this.loadInitialOrders());
  // Observable principal exposé (utilisé par admin et comme base pour user)
  public orders$: Observable<Order[]> = this.ordersSubject.asObservable();

  constructor() {
    console.log(`[OrderService] Initialisé. Source de données: localStorage ('${ORDERS_STORAGE_KEY}').`);
  }

  /**
   * Charge les commandes depuis localStorage ou génère les mocks si vide/erreur.
   */
  private loadInitialOrders(): Order[] {
    console.log(`[OrderService] loadInitialOrders: Lecture depuis localStorage ('${ORDERS_STORAGE_KEY}').`);
    try {
      const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        const orders = JSON.parse(storedOrders);
        const typedOrders = this.parseDates(orders);
        console.log(`[OrderService] loadInitialOrders: ${typedOrders.length} commandes chargées.`);
        // Retourner trié
        return typedOrders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
      } else {
        console.log('[OrderService] loadInitialOrders: localStorage vide. Génération mocks.');
        const mockOrders = this.generateMockOrders();
        this.saveOrdersToStorage(mockOrders); // Sauvegarde initiale
        return mockOrders;
      }
    } catch (e) {
      console.error('[OrderService] Erreur lecture localStorage:', e);
      const mockOrders = this.generateMockOrders();
      this.saveOrdersToStorage(mockOrders); // Tenter sauvegarde même si erreur lecture
      return mockOrders;
    }
  }

  /** Sauvegarde la liste complète des commandes dans localStorage */
  private saveOrdersToStorage(orders: Order[]): void {
      try {
          // Toujours trier avant de sauvegarder pour la cohérence
          const sortedOrders = orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(sortedOrders));
          console.log(`[OrderService] saveOrdersToStorage: ${orders.length} commandes sauvegardées ('${ORDERS_STORAGE_KEY}').`);
      } catch (e) {
          console.error('[OrderService] saveOrdersToStorage: Erreur écriture localStorage:', e);
      }
  }

  /** Génère les données simulées initiales (COMPLÈTES) */
  private generateMockOrders(): Order[] {
     // Assurez-vous que ces données respectent l'interface Order
     const mockOrders: Order[] = [
       { // Commande 1 (complète)
         id: 'ORD-MOCK-001', // ID String
         orderNumber: 'CMD-MOCK-001', // Numéro Commande
         customerId: null, // Invité
         customerName: 'Alice Mock',
         customerEmail: 'alice.mock@email.com',
         items: [ // Tableau d'OrderItem
             { bookId: 1, title: 'Le Seigneur des Anneaux', quantity: 1, price: 25.50 },
             { bookId: 3, title: '1984', quantity: 1, price: 15.00 }
         ],
         totalAmount: (25.50 * 1) + (15.00 * 1), // 40.50
         status: 'Processing', // Type OrderStatus
         orderDate: new Date(2023, 10, 15, 10, 30), // Objet Date
         lastUpdate: new Date(2023, 10, 15, 10, 30), // Objet Date
         shippingAddress: { street: '1 rue Mock', city: 'Mockville', zipCode: '75000', country: 'France' } // Objet Address
       },
       { // Commande 2 (complète)
         id: 'ORD-MOCK-002',
         orderNumber: 'CMD-MOCK-002',
         customerId: 101, // Client ID numérique
         customerName: 'Bob Mock',
         customerEmail: 'bob.mock@email.com',
         items: [{ bookId: 2, title: 'Fondation', quantity: 1, price: 18.00 }],
         totalAmount: 18.00 * 1, // 18.00
         status: 'Shipped',
         orderDate: new Date(2023, 10, 18, 14, 0),
         lastUpdate: new Date(2023, 10, 19, 9, 0),
         shippingAddress: { street: '10 avenue Mock', city: 'Mockcity', zipCode: '69000', country: 'France' }
       },
        { // Commande 3 - Livrée (complète)
         id: 'ORD-MOCK-003',
         orderNumber: 'CMD-MOCK-003',
         customerId: null,
         customerName: 'Claire Mock',
         customerEmail: 'claire.mock@email.com',
         items: [{ bookId: 1, title: 'Le Seigneur des Anneaux', quantity: 1, price: 25.50 }], // Quantité 1
         totalAmount: 25.50 * 1, // 25.50
         status: 'Delivered', // Statut livré pour tester le filtre utilisateur
         orderDate: new Date(2023, 9, 5, 11, 15),
         lastUpdate: new Date(2023, 9, 10, 16, 30),
         shippingAddress: { street: '5 Place Mock', city: 'Mockcity', zipCode: '69002', country: 'France' }
       }
     ];
     console.log('[OrderService] generateMockOrders: Données mock générées.');
     return mockOrders; // Tri appliqué par loadInitialOrders ou saveOrdersToStorage
  }

  /** Helper pour parser les dates après lecture JSON */
  private parseDates(orders: any[]): Order[] {
     return orders.map(order => ({
         ...order,
         orderDate: new Date(order.orderDate),
         lastUpdate: new Date(order.lastUpdate)
     }));
  }

  // --- Méthodes Publiques ---

  /** Retourne l'observable pour la liste principale/admin (toutes commandes) */
  getOrders(): Observable<Order[]> {
    console.log('[OrderService] getOrders appelé (pour Admin).');
    return this.orders$;
  }

  /** Retourne un observable pour la liste utilisateur (commandes non 'Delivered') */
  getUserOrders(): Observable<Order[]> {
      console.log('[OrderService] getUserOrders appelé (pour Utilisateur, filtre "Delivered").');
      return this.orders$.pipe(
          // Filtre pour exclure les commandes livrées
          map(allOrders => allOrders.filter(order => order.status !== 'Delivered')),
          // distinctUntilChanged pourrait éviter des émissions inutiles si la liste filtrée ne change pas
          distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
          tap(userVisibleOrders => console.log(`[OrderService] getUserOrders: ${userVisibleOrders.length} commandes visibles émises.`))
      );
  }

  /** Récupère une commande par ID (recherche dans la liste principale) */
  getOrderById(id: string): Observable<Order | undefined> {
    return this.orders$.pipe(
        map(orders => orders.find(order => order.id === id)),
        // Peut être utile d'ajouter un tap pour logguer si trouvé ou non
        tap(foundOrder => console.log(`[OrderService] getOrderById(${id}): ${foundOrder ? 'Trouvée' : 'Non trouvée'}`))
        );
  }

  /** Ajoute une nouvelle commande */
  addOrder(
    orderFormData: { customerName: string, customerEmail: string, customerId?: string | number | null, shippingAddress: Address },
    selectedBook: Book
  ): Observable<Order> {
    const currentOrders = this.ordersSubject.getValue();
    // Génération de la nouvelle commande (logique inchangée)
    const newId: string = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const orderNumber = `CMD${newId.slice(-8)}`;
    const orderDate = new Date(); const lastUpdate = new Date(); const status: OrderStatus = 'Shipped';
    const orderItem: OrderItem = { bookId: selectedBook.id, title: selectedBook.title, quantity: 1, price: selectedBook.price };
    const totalAmount = orderItem.price * orderItem.quantity;
    let customerIdToSave: number | null = null;
    if (orderFormData.customerId != null && orderFormData.customerId !== '') { const parsedId = parseInt(String(orderFormData.customerId), 10); if (!isNaN(parsedId)) customerIdToSave = parsedId; else console.warn(`[OrderService] addOrder: customerId "${orderFormData.customerId}" fourni mais invalide.`); }
    const newOrder: Order = { id: newId, orderNumber, orderDate, status, totalAmount, lastUpdate, customerName: orderFormData.customerName, customerEmail: orderFormData.customerEmail, customerId: customerIdToSave, shippingAddress: orderFormData.shippingAddress, items: [orderItem] };

    // Mettre à jour l'état et persister
    const updatedOrders = [...currentOrders, newOrder]; // Ajout simple
    this.ordersSubject.next(updatedOrders); // Émettre la nouvelle liste (le tri se fera à la sauvegarde)
    this.saveOrdersToStorage(updatedOrders); // Sauvegarde dans l'unique localStorage
    console.log('[OrderService] addOrder: Ajout terminé et sauvegardé.');
    return of(newOrder);
  }

  /** Met à jour le statut d'une commande */
  updateOrderStatus(id: string, newStatus: OrderStatus): Observable<Order | undefined> {
    let currentOrders = this.ordersSubject.getValue();
    const orderIndex = currentOrders.findIndex(order => order.id === id);
    let updatedOrder: Order | undefined = undefined;

    if (orderIndex !== -1) {
      // Créer l'objet mis à jour
      updatedOrder = { ...currentOrders[orderIndex], status: newStatus, lastUpdate: new Date() };
      // Créer une nouvelle référence de tableau pour l'immutabilité
      const updatedList = currentOrders.map(order => order.id === id ? updatedOrder! : order);

      // Mettre à jour l'état et persister
      this.ordersSubject.next(updatedList);
      this.saveOrdersToStorage(updatedList);
      console.log(`[OrderService] updateOrderStatus: Statut mis à jour et sauvegardé pour ID ${id}.`);
      return of(updatedOrder);
    } else {
      console.warn(`[OrderService] updateOrderStatus: Commande ID ${id} non trouvée.`);
      return of(undefined);
    }
  }

  /** Supprime une commande */
  deleteOrder(id: string): Observable<void> {
    let currentOrders = this.ordersSubject.getValue();
    const updatedOrders = currentOrders.filter(order => order.id !== id);

    // Vérifier si une suppression a eu lieu
    if (updatedOrders.length < currentOrders.length) {
      // Mettre à jour l'état et persister
      this.ordersSubject.next(updatedOrders);
      this.saveOrdersToStorage(updatedOrders);
      console.log(`[OrderService] deleteOrder: Commande ${id} supprimée et sauvegardée.`);
      return of(undefined); // Succès
    } else {
      console.warn(`[OrderService] deleteOrder: Commande ${id} non trouvée.`);
      return throwError(() => new Error(`Commande ${id} non trouvée.`));
    }
  }

   /** Supprime plusieurs commandes */
   deleteBulkOrders(ids: string[]): Observable<{success: string[], failed: string[]}> {
    if (!ids || ids.length === 0) { return of({success: [], failed: []}); }

    const currentOrders = this.ordersSubject.getValue();
    const results = {success: [] as string[], failed: [] as string[]};

    // Filtrer pour ne garder que les commandes dont l'ID n'est PAS dans la liste à supprimer
    const updatedOrders = currentOrders.filter(order => {
      const shouldDelete = ids.includes(order.id);
      if (shouldDelete) { results.success.push(order.id); } // Enregistrer les succès
      return !shouldDelete; // Garder si non marqué pour suppression
    });

    // Identifier les échecs (IDs demandés mais pas trouvés dans les succès)
    results.failed = ids.filter(id => !results.success.includes(id));

    // Si au moins une commande a été supprimée, mettre à jour l'état et persister
    if (results.success.length > 0) {
      this.ordersSubject.next(updatedOrders);
      this.saveOrdersToStorage(updatedOrders);
      console.log(`[OrderService] deleteBulkOrders: ${results.success.length} commandes supprimées.`);
      if (results.failed.length > 0) {
         console.warn(`[OrderService] deleteBulkOrders: IDs non trouvés:`, results.failed);
      }
    } else {
       console.log(`[OrderService] deleteBulkOrders: Aucune commande trouvée à supprimer pour les IDs fournis.`);
    }

    return of(results); // Retourner le résultat
  }
}