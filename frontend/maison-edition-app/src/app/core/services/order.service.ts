// src/app/core/services/order.service.ts
import { Injectable, inject, NgZone } from '@angular/core'; // <<<=== NgZone ajouté
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap, distinctUntilChanged } from 'rxjs/operators';
import { Order, OrderStatus } from '../../models/order.model';
import { OrderItem } from '../../models/order-item.model';
import { CartItem } from '../../models/cart-item.model';
import { Address } from '../../models/address.model';
import { AuthService } from './auth.service';

const ORDERS_STORAGE_KEY = 'editAppOrders';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private ordersSubject = new BehaviorSubject<Order[]>(this.loadInitialOrders());
  public orders$: Observable<Order[]> = this.ordersSubject.asObservable();
  private authService = inject(AuthService);
  private ngZone = inject(NgZone); // <<<=== Injecter NgZone

  constructor() {
    console.log(`[OrderService] Initialisé.`);
    // <<<=== AJOUT: Écouter les changements de localStorage venant d'autres onglets ===
    this.listenToStorageChanges();
    // ==============================================================================
  }

  // <<<=== AJOUT: Méthode pour écouter les événements storage ===
  private listenToStorageChanges(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event: StorageEvent) => {
        // S'exécuter dans la zone Angular pour que la détection de changements fonctionne
        this.ngZone.run(() => {
          if (event.key === ORDERS_STORAGE_KEY && event.newValue !== null && event.storageArea === localStorage) {
            console.log('[OrderService] Événement storage détecté depuis un autre onglet/fenêtre.');
            try {
              const ordersFromStorage = JSON.parse(event.newValue);
              const typedOrders = this.parseDatesAndAddUserEmail(ordersFromStorage);
              const sortedOrders = typedOrders.sort(
                (a, b) => b.orderDate.getTime() - a.orderDate.getTime()
              );

              // Optionnel: Vérifier si les données ont réellement changé pour éviter des émissions inutiles
              const currentSubjectValue = this.ordersSubject.getValue();
              if (JSON.stringify(currentSubjectValue) !== JSON.stringify(sortedOrders)) {
                  console.log('[OrderService] Mise à jour de ordersSubject suite à l\'événement storage.');
                  this.ordersSubject.next(sortedOrders);
              } else {
                  console.log('[OrderService] Événement storage reçu, mais les données sont identiques. Aucune émission.');
              }
            } catch (e) {
              console.error('[OrderService] Erreur lors du traitement de l\'événement storage:', e);
            }
          }
        });
      });
    }
  }
  // =========================================================

  /** Charge les commandes depuis localStorage (ou génère des mocks) */
  private loadInitialOrders(): Order[] {
    console.log(
      `[OrderService] loadInitialOrders: Lecture depuis localStorage ('${ORDERS_STORAGE_KEY}').`
    );
    if (typeof localStorage === 'undefined') {
        console.warn('[OrderService] localStorage non disponible. Génération mocks.');
        return this.generateMockOrdersAndSave();
    }
    try {
      const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        const orders = JSON.parse(storedOrders);
        const typedOrders = this.parseDatesAndAddUserEmail(orders);
        console.log(
          `[OrderService] loadInitialOrders: ${typedOrders.length} commandes chargées.`
        );
        return typedOrders.sort(
          (a, b) => b.orderDate.getTime() - a.orderDate.getTime()
        );
      } else {
        console.log(
          '[OrderService] loadInitialOrders: localStorage vide. Génération mocks.'
        );
        return this.generateMockOrdersAndSave();
      }
    } catch (e) {
      console.error('[OrderService] Erreur lecture/parsing localStorage:', e);
      return this.generateMockOrdersAndSave();
    }
  }

  /** Helper pour générer et sauvegarder les mocks */
  private generateMockOrdersAndSave(): Order[] {
      const mockOrders = this.generateMockOrders();
      if (typeof localStorage !== 'undefined') {
          this.saveOrdersToStorage(mockOrders);
      }
      return mockOrders;
  }


  /** Sauvegarde les commandes dans localStorage */
  private saveOrdersToStorage(orders: Order[]): void {
    if (typeof localStorage === 'undefined') {
        console.warn('[OrderService] localStorage non disponible, sauvegarde annulée.');
        return;
    }
    try {
      // Trier avant de sauvegarder pour la cohérence
      const sortedOrders = orders.sort(
        (a, b) => b.orderDate.getTime() - a.orderDate.getTime()
      );
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(sortedOrders));
      console.log(
        `[OrderService] saveOrdersToStorage: ${orders.length} commandes sauvegardées.`
      );
    } catch (e) {
      console.error(
        '[OrderService] saveOrdersToStorage: Erreur écriture localStorage:',
        e
      );
    }
  }

  /** Génère des commandes mock initiales */
  private generateMockOrders(): Order[] {
    // Mocks restent identiques
    const mockOrders: Order[] = [
        { id: 'ORD-MOCK-001', orderNumber: 'CMD-MOCK-001', customerId: null, customerName: 'Alice Mock', customerEmail: 'alice.mock@email.com', userEmail: null, items: [ { bookId: 1, title: 'Le Seigneur des Anneaux', quantity: 1, price: 25.50 }, { bookId: 3, title: 'Dune', quantity: 1, price: 22.50 } ], totalAmount: 48.00, status: 'Processing', orderDate: new Date(2023, 10, 15, 10, 30), lastUpdate: new Date(2023, 10, 15, 10, 30), shippingAddress: { street: '1 rue Mock', city: 'Mockville', zipCode: '75000', country: 'France' } },
        { id: 'ORD-MOCK-002', orderNumber: 'CMD-MOCK-002', customerId: 101, customerName: 'Bob Mock', customerEmail: 'bob.mock@email.com', userEmail: 'bob.mock@email.com', items: [{ bookId: 2, title: 'Fondation', quantity: 1, price: 19.90 }], totalAmount: 19.90, status: 'Shipped', orderDate: new Date(2023, 10, 18, 14, 0), lastUpdate: new Date(2023, 10, 19, 9, 0), shippingAddress: { street: '10 avenue Mock', city: 'Mockcity', zipCode: '69000', country: 'France' } },
        { id: 'ORD-MOCK-003', orderNumber: 'CMD-MOCK-003', customerId: null, customerName: 'Claire Mock', customerEmail: 'claire.mock@email.com', userEmail: null, items: [{ bookId: 1, title: 'Le Seigneur des Anneaux', quantity: 1, price: 25.50 }], totalAmount: 25.50, status: 'Delivered', orderDate: new Date(2023, 9, 5, 11, 15), lastUpdate: new Date(2023, 9, 10, 16, 30), shippingAddress: { street: '5 Place Mock', city: 'Mockcity', zipCode: '69002', country: 'France' } },
        { id: 'ORD-MOCK-004', orderNumber: 'CMD-MOCK-004', customerId: 999, customerName: 'Admin User', customerEmail: 'admin@example.com', userEmail: 'admin@example.com', items: [{ bookId: 3, title: 'Dune', quantity: 2, price: 22.50 }], totalAmount: 45.00, status: 'Pending', orderDate: new Date(2023, 11, 1, 16, 0), lastUpdate: new Date(2023, 11, 1, 16, 0), shippingAddress: { street: '123 Admin Street', city: 'AdminTown', zipCode: '10000', country: 'France' } }
      ];
    console.log('[OrderService] generateMockOrders: Données mock générées.');
    return mockOrders;
  }

  /** Convertit les dates string en objets Date et ajoute userEmail si manquant */
  private parseDatesAndAddUserEmail(orders: any[]): Order[] {
    if (!Array.isArray(orders)) {
        console.warn('[OrderService] parseDatesAndAddUserEmail: input non valide.');
        return [];
    }
    return orders.map((order) => {
      if (!order || typeof order !== 'object') return null;
      try {
        // S'assurer que orderDate et lastUpdate sont bien des strings avant de les parser
        const orderDateStr = order.orderDate;
        const lastUpdateStr = order.lastUpdate;

        const parsedDate = typeof orderDateStr === 'string' ? new Date(orderDateStr) : (orderDateStr instanceof Date ? orderDateStr : new Date());
        const parsedUpdate = typeof lastUpdateStr === 'string' ? new Date(lastUpdateStr) : (lastUpdateStr instanceof Date ? lastUpdateStr : new Date());

        if (isNaN(parsedDate.getTime()) || isNaN(parsedUpdate.getTime())) {
            console.warn(`[OrderService] Date invalide détectée pour commande (ignorée):`, order.orderNumber || order.id);
            return null;
        }
        return {
          ...order,
          orderDate: parsedDate,
          lastUpdate: parsedUpdate,
          userEmail: order.userEmail !== undefined ? order.userEmail : null,
          items: Array.isArray(order.items) ? order.items : []
        };
      } catch(e) {
          console.error(`[OrderService] Erreur parsing date pour commande:`, order.orderNumber || order.id, e);
          return null;
      }
    }).filter((order): order is Order => order !== null);
  }

  // --- Méthodes Publiques ---

  /** Récupère toutes les commandes (pour l'admin) */
  getOrders(): Observable<Order[]> {
    console.log('[OrderService] getOrders appelé (pour Admin).');
    return this.orders$;
  }

  /** Retourne les commandes de l'utilisateur connecté (non 'Delivered') */
  getUserOrders(): Observable<Order[]> {
    console.log('[OrderService] getUserOrders appelé.');
    const currentUser = this.authService.getCurrentUser();
    const userEmail = currentUser?.email ?? null;
    console.log(`[OrderService] Filtrage commandes pour userEmail: ${userEmail}`);

    if (!userEmail) {
        console.log('[OrderService] Aucun utilisateur connecté, retour liste vide pour getUserOrders.');
        return of([]);
    }

    return this.orders$.pipe(
      map(allOrders =>
        allOrders.filter(
          order => order.status !== 'Delivered' && order.userEmail === userEmail
        )
      ),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(userVisibleOrders =>
        console.log(`[OrderService] getUserOrders: ${userVisibleOrders.length} commandes émises pour ${userEmail}.`)
      )
    );
  }

  /** Récupère une commande spécifique par son ID */
  getOrderById(id: string): Observable<Order | undefined> {
    return this.orders$.pipe(
      map(orders => orders.find(order => order.id === id)),
      tap(foundOrder => console.log(`[OrderService] getOrderById(${id}): ${foundOrder ? 'Trouvée' : 'Non trouvée'}`))
    );
  }

  /**
   * Ajoute une nouvelle commande basée sur les articles fournis (généralement du panier).
   * @param orderFormData Informations client et adresse de livraison.
   * @param cartItems Tableau des articles à inclure dans la commande.
   * @returns Observable émettant la commande créée ou une erreur.
   */
  addOrder(
    orderFormData: {
      customerName: string;
      customerEmail: string;
      customerId?: string | number | null;
      shippingAddress: Address;
    },
    cartItems: CartItem[]
  ): Observable<Order> {

    if (!cartItems || cartItems.length === 0) {
      const errorMsg = "Impossible de créer une commande avec un panier vide.";
      console.error('[OrderService] addOrder:', errorMsg);
      return throwError(() => new Error(errorMsg));
    }

    console.log(`[OrderService] addOrder: Tentative ajout commande pour ${cartItems.length} type(s) d'article(s).`);
    const currentOrders = this.ordersSubject.getValue();
    const currentUser = this.authService.getCurrentUser();
    const currentUserEmail = currentUser?.email ?? null;
    console.log(`[OrderService] addOrder: Utilisateur connecté détecté: ${currentUserEmail}`);

    const newId: string = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const orderNumber = `CMD${newId.slice(-8)}`;
    const now = new Date();
    const status: OrderStatus = 'Pending';

    const orderItems: OrderItem[] = cartItems
      .filter(cartItem => cartItem && cartItem.quantity > 0 && typeof cartItem.price === 'number')
      .map(validCartItem => ({
        bookId: validCartItem.bookId,
        title: validCartItem.title,
        quantity: validCartItem.quantity,
        price: validCartItem.price
      }));

    if (orderItems.length === 0) {
       const errorMsg = "Aucun article valide trouvé dans le panier pour créer la commande.";
       console.error('[OrderService] addOrder:', errorMsg);
       return throwError(() => new Error(errorMsg));
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let customerIdToSave: number | null = null;
    if (orderFormData.customerId != null && String(orderFormData.customerId).trim() !== '') {
      const parsedId = parseInt(String(orderFormData.customerId), 10);
      if (!isNaN(parsedId)) customerIdToSave = parsedId;
    }

    const newOrder: Order = {
      id: newId,
      orderNumber,
      orderDate: now,
      status,
      totalAmount,
      lastUpdate: now,
      customerName: orderFormData.customerName,
      customerEmail: orderFormData.customerEmail,
      customerId: customerIdToSave,
      userEmail: currentUserEmail,
      shippingAddress: orderFormData.shippingAddress,
      items: orderItems,
    };

    const updatedOrders = [...currentOrders, newOrder].sort( // Trier ici aussi avant d'émettre
      (a, b) => b.orderDate.getTime() - a.orderDate.getTime()
    );
    this.ordersSubject.next(updatedOrders);
    this.saveOrdersToStorage(updatedOrders);

    console.log(`[OrderService] addOrder: Commande ${newOrder.orderNumber} (ID: ${newOrder.id}) ajoutée et sauvegardée.`);
    return of(newOrder);
  }

  /** Met à jour le statut d'une commande existante */
  updateOrderStatus(id: string, newStatus: OrderStatus): Observable<Order | undefined> {
    console.log(`[OrderService] Tentative MAJ statut pour ID ${id} vers ${newStatus}`);
    let currentOrders = this.ordersSubject.getValue();
    const orderIndex = currentOrders.findIndex(order => order.id === id);

    if (orderIndex !== -1) {
      const updatedOrder: Order = { ...currentOrders[orderIndex], status: newStatus, lastUpdate: new Date() };
      const updatedList = [...currentOrders];
      updatedList[orderIndex] = updatedOrder;

      // Trier avant d'émettre et de sauvegarder
      const sortedList = updatedList.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
      this.ordersSubject.next(sortedList);
      this.saveOrdersToStorage(sortedList);

      console.log(`[OrderService] updateOrderStatus: Statut mis à jour pour ID ${id}.`);
      return of(updatedOrder);
    } else {
      console.warn(`[OrderService] updateOrderStatus: Commande ID ${id} non trouvée.`);
      return of(undefined);
    }
  }

  /** Supprime une commande */
  deleteOrder(id: string): Observable<void> {
    console.log(`[OrderService] Tentative suppression commande ID: ${id}`);
    let currentOrders = this.ordersSubject.getValue();
    const updatedOrders = currentOrders.filter(order => order.id !== id);

    if (updatedOrders.length < currentOrders.length) {
      // Pas besoin de trier ici car on ne fait que supprimer
      this.ordersSubject.next(updatedOrders);
      this.saveOrdersToStorage(updatedOrders);
      console.log(`[OrderService] deleteOrder: Commande ${id} supprimée.`);
      return of(undefined);
    } else {
      console.warn(`[OrderService] deleteOrder: Commande ${id} non trouvée.`);
      return throwError(() => new Error(`Commande ${id} non trouvée.`));
    }
  }

  /** Supprime plusieurs commandes en bloc */
  deleteBulkOrders(ids: string[]): Observable<{ success: string[]; failed: string[] }> {
    console.log(`[OrderService] Tentative suppression bulk: ${ids.length} IDs`);
    if (!ids || ids.length === 0) return of({ success: [], failed: [] });

    const currentOrders = this.ordersSubject.getValue();
    const results = { success: [] as string[], failed: [] as string[] };
    const idSet = new Set(ids);
    const updatedOrders = currentOrders.filter(order => !idSet.has(order.id));

    ids.forEach(id => {
        if (currentOrders.some(order => order.id === id)) {
            results.success.push(id);
        } else {
            results.failed.push(id);
        }
    });

    if (results.success.length > 0) {
      this.ordersSubject.next(updatedOrders);
      this.saveOrdersToStorage(updatedOrders);
      console.log(`[OrderService] deleteBulkOrders: ${results.success.length} commandes supprimées.`);
      if (results.failed.length > 0) console.warn(`[OrderService] deleteBulkOrders: IDs non trouvés:`, results.failed);
    } else {
      console.log(`[OrderService] deleteBulkOrders: Aucune des commandes demandées n'a été trouvée.`);
    }
    return of(results);
  }
}