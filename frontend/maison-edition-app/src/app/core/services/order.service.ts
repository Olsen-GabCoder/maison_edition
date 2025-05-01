// src/app/core/services/order.service.ts
import { Injectable, inject } from '@angular/core'; // <<< inject ajouté
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, distinctUntilChanged } from 'rxjs/operators';
import { Order, OrderStatus } from '../../models/order.model';
import { OrderItem } from '../../models/order-item.model';
import { Address } from '../../models/address.model';
import { Book } from '../../models/book.model';
// --- AJOUT IMPORT ---
import { UserAuthService } from './user-auth.service'; // <<<=== IMPORTER UserAuthService

const ORDERS_STORAGE_KEY = 'editAppOrders';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private ordersSubject = new BehaviorSubject<Order[]>(this.loadInitialOrders());
  public orders$: Observable<Order[]> = this.ordersSubject.asObservable();

  // --- INJECTER UserAuthService ---
  private userAuthService = inject(UserAuthService); // <<<=== INJECTER

  constructor() {
    console.log(`[OrderService] Initialisé.`);
  }

  private loadInitialOrders(): Order[] {
    console.log(`[OrderService] loadInitialOrders: Lecture depuis localStorage ('${ORDERS_STORAGE_KEY}').`);
    try {
      const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        const orders = JSON.parse(storedOrders);
        // Assurer la compatibilité ascendante : ajouter userEmail: null si manquant
        const typedOrders = this.parseDatesAndAddUserEmail(orders);
        console.log(`[OrderService] loadInitialOrders: ${typedOrders.length} commandes chargées.`);
        return typedOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
      } else {
        console.log('[OrderService] loadInitialOrders: localStorage vide. Génération mocks.');
        const mockOrders = this.generateMockOrders();
        this.saveOrdersToStorage(mockOrders);
        return mockOrders;
      }
    } catch (e) {
      console.error('[OrderService] Erreur lecture localStorage:', e);
      const mockOrders = this.generateMockOrders();
      this.saveOrdersToStorage(mockOrders);
      return mockOrders;
    }
  }

  private saveOrdersToStorage(orders: Order[]): void {
      try {
          const sortedOrders = orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(sortedOrders));
          console.log(`[OrderService] saveOrdersToStorage: ${orders.length} commandes sauvegardées.`);
      } catch (e) {
          console.error('[OrderService] saveOrdersToStorage: Erreur écriture localStorage:', e);
      }
  }

  // --- Mocks initiaux (AJOUTER userEmail: null) ---
  private generateMockOrders(): Order[] {
     const mockOrders: Order[] = [
       { id: 'ORD-MOCK-001', orderNumber: 'CMD-MOCK-001', customerId: null, customerName: 'Alice Mock', customerEmail: 'alice.mock@email.com', userEmail: null, items: [ { bookId: 1, title: 'Le Seigneur des Anneaux', quantity: 1, price: 25.50 }, { bookId: 3, title: '1984', quantity: 1, price: 15.00 } ], totalAmount: 40.50, status: 'Processing', orderDate: new Date(2023, 10, 15, 10, 30), lastUpdate: new Date(2023, 10, 15, 10, 30), shippingAddress: { street: '1 rue Mock', city: 'Mockville', zipCode: '75000', country: 'France' } },
       { id: 'ORD-MOCK-002', orderNumber: 'CMD-MOCK-002', customerId: 101, customerName: 'Bob Mock', customerEmail: 'bob.mock@email.com', userEmail: 'bob.mock@email.com', items: [{ bookId: 2, title: 'Fondation', quantity: 1, price: 18.00 }], totalAmount: 18.00, status: 'Shipped', orderDate: new Date(2023, 10, 18, 14, 0), lastUpdate: new Date(2023, 10, 19, 9, 0), shippingAddress: { street: '10 avenue Mock', city: 'Mockcity', zipCode: '69000', country: 'France' } }, // <- Exemple avec userEmail
       { id: 'ORD-MOCK-003', orderNumber: 'CMD-MOCK-003', customerId: null, customerName: 'Claire Mock', customerEmail: 'claire.mock@email.com', userEmail: null, items: [{ bookId: 1, title: 'Le Seigneur des Anneaux', quantity: 1, price: 25.50 }], totalAmount: 25.50, status: 'Delivered', orderDate: new Date(2023, 9, 5, 11, 15), lastUpdate: new Date(2023, 9, 10, 16, 30), shippingAddress: { street: '5 Place Mock', city: 'Mockcity', zipCode: '69002', country: 'France' } }
     ];
     console.log('[OrderService] generateMockOrders: Données mock générées.');
     return mockOrders;
  }

  // --- Modifié pour ajouter userEmail si manquant ---
  private parseDatesAndAddUserEmail(orders: any[]): Order[] {
     return orders.map(order => ({
         ...order,
         orderDate: new Date(order.orderDate),
         lastUpdate: new Date(order.lastUpdate),
         userEmail: order.userEmail !== undefined ? order.userEmail : null // Ajoute null si non présent
     }));
  }

  // --- Méthodes Publiques ---

  getOrders(): Observable<Order[]> {
    console.log('[OrderService] getOrders appelé (pour Admin).');
    return this.orders$;
  }

  /** Retourne un observable pour la liste utilisateur (commandes non 'Delivered' ET de l'utilisateur connecté) */
  getUserOrders(): Observable<Order[]> {
      console.log('[OrderService] getUserOrders appelé.');
      const currentUser = this.userAuthService.getCurrentUser(); // <<<=== Récupérer l'utilisateur actuel
      const userEmail = currentUser?.email ?? null; // Obtenir son email (ou null)
      console.log(`[OrderService] Filtrage des commandes pour userEmail: ${userEmail}`);

      return this.orders$.pipe(
          map(allOrders => {
              // Filtrer par statut ET par userEmail
              return allOrders.filter(order =>
                  order.status !== 'Delivered' && order.userEmail === userEmail
              );
          }),
          distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
          tap(userVisibleOrders => console.log(`[OrderService] getUserOrders: ${userVisibleOrders.length} commandes visibles émises pour ${userEmail}.`))
      );
  }

  getOrderById(id: string): Observable<Order | undefined> {
    return this.orders$.pipe(
        map(orders => orders.find(order => order.id === id)),
        tap(foundOrder => console.log(`[OrderService] getOrderById(${id}): ${foundOrder ? 'Trouvée' : 'Non trouvée'}`))
        );
  }

  /** Ajoute une nouvelle commande en associant l'utilisateur connecté */
  addOrder(
    orderFormData: { customerName: string, customerEmail: string, customerId?: string | number | null, shippingAddress: Address },
    selectedBook: Book
  ): Observable<Order> {
    console.log('[OrderService] addOrder: Tentative ajout...');
    const currentOrders = this.ordersSubject.getValue();
    const currentUser = this.userAuthService.getCurrentUser(); // <<<=== Obtenir l'utilisateur connecté
    const currentUserEmail = currentUser?.email ?? null; // <<<=== Obtenir son email

    console.log(`[OrderService] addOrder: Utilisateur connecté détecté: ${currentUserEmail}`);

    // Génération de la nouvelle commande
    const newId: string = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const orderNumber = `CMD${newId.slice(-8)}`;
    const orderDate = new Date();
    const lastUpdate = new Date();
    const status: OrderStatus = 'Shipped'; // ou 'Pending' ?
    const orderItem: OrderItem = { bookId: selectedBook.id, title: selectedBook.title, quantity: 1, price: selectedBook.price };
    const totalAmount = orderItem.price * orderItem.quantity;
    let customerIdToSave: number | null = null;
    if (orderFormData.customerId != null && orderFormData.customerId !== '') { const parsedId = parseInt(String(orderFormData.customerId), 10); if (!isNaN(parsedId)) customerIdToSave = parsedId; }

    const newOrder: Order = {
      id: newId,
      orderNumber,
      orderDate,
      status,
      totalAmount,
      lastUpdate,
      customerName: orderFormData.customerName,
      customerEmail: orderFormData.customerEmail, // Email entré dans le formulaire
      customerId: customerIdToSave,
      userEmail: currentUserEmail, // <<<=== ASSOCIER L'EMAIL UTILISATEUR
      shippingAddress: orderFormData.shippingAddress,
      items: [orderItem]
    };

    const updatedOrders = [...currentOrders, newOrder];
    this.ordersSubject.next(updatedOrders);
    this.saveOrdersToStorage(updatedOrders);
    console.log('[OrderService] addOrder: Commande ajoutée et sauvegardée avec userEmail:', currentUserEmail);
    return of(newOrder);
  }

  updateOrderStatus(id: string, newStatus: OrderStatus): Observable<Order | undefined> {
     // ... (logique inchangée) ...
     let currentOrders = this.ordersSubject.getValue();
     const orderIndex = currentOrders.findIndex(order => order.id === id);
     let updatedOrder: Order | undefined = undefined;
     if (orderIndex !== -1) {
       updatedOrder = { ...currentOrders[orderIndex], status: newStatus, lastUpdate: new Date() };
       const updatedList = currentOrders.map(order => order.id === id ? updatedOrder! : order);
       this.ordersSubject.next(updatedList);
       this.saveOrdersToStorage(updatedList);
       console.log(`[OrderService] updateOrderStatus: Statut mis à jour pour ID ${id}.`);
       return of(updatedOrder);
     } else {
       console.warn(`[OrderService] updateOrderStatus: Commande ID ${id} non trouvée.`);
       return of(undefined);
     }
  }

  deleteOrder(id: string): Observable<void> {
      // ... (logique inchangée) ...
      let currentOrders = this.ordersSubject.getValue();
      const updatedOrders = currentOrders.filter(order => order.id !== id);
      if (updatedOrders.length < currentOrders.length) {
        this.ordersSubject.next(updatedOrders);
        this.saveOrdersToStorage(updatedOrders);
        console.log(`[OrderService] deleteOrder: Commande ${id} supprimée.`);
        return of(undefined);
      } else {
        console.warn(`[OrderService] deleteOrder: Commande ${id} non trouvée.`);
        return throwError(() => new Error(`Commande ${id} non trouvée.`));
      }
  }

  deleteBulkOrders(ids: string[]): Observable<{success: string[], failed: string[]}> {
       // ... (logique inchangée) ...
       if (!ids || ids.length === 0) { return of({success: [], failed: []}); }
       const currentOrders = this.ordersSubject.getValue();
       const results = {success: [] as string[], failed: [] as string[]};
       const updatedOrders = currentOrders.filter(order => {
         const shouldDelete = ids.includes(order.id);
         if (shouldDelete) { results.success.push(order.id); }
         return !shouldDelete;
       });
       results.failed = ids.filter(id => !results.success.includes(id));
       if (results.success.length > 0) {
         this.ordersSubject.next(updatedOrders);
         this.saveOrdersToStorage(updatedOrders);
         console.log(`[OrderService] deleteBulkOrders: ${results.success.length} commandes supprimées.`);
         if (results.failed.length > 0) {
            console.warn(`[OrderService] deleteBulkOrders: IDs non trouvés:`, results.failed);
         }
       } else {
          console.log(`[OrderService] deleteBulkOrders: Aucune commande trouvée.`);
       }
       return of(results);
   }
}