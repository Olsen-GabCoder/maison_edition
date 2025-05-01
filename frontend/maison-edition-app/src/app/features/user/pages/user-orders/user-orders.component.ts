// src/app/features/user/pages/user-orders/user-orders.component.ts - CORRIGÉ
import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../../core/services/order.service';
import { Order, OrderStatus } from '../../../../models/order.model'; // OrderStatus importé
import { OrderItem } from '../../../../models/order-item.model';
import { UserAuthService, UserInfo } from '../../../../core/services/user-auth.service';
import { RouterLink } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { catchError, tap, takeUntil, map } from 'rxjs/operators';

// ===> RÉ-AJOUT de l'interface GroupedOrderView <===
interface GroupedOrderView {
  bookId: number;
  title: string;
  unitPrice: number;
  totalQuantity: number;
  totalGroupPrice: number;
  latestOrderDate: Date;
  latestStatus: OrderStatus;
  customerName: string; // Gardé même si c'est l'utilisateur connecté
  customerEmail: string;// Gardé même si c'est l'utilisateur connecté
  latestOrderNumber: string;
}
// ===> FIN RÉ-AJOUT <===

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.scss']
})
export class UserOrdersComponent implements OnInit, OnDestroy {

  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);
  private userAuthService = inject(UserAuthService);
  private destroy$ = new Subject<void>();

  currentUser: UserInfo | null = null;

  // Utilise maintenant l'interface corrigée
  groupedOrders: GroupedOrderView[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  totalItemsCount: number = 0;
  cumulativeTotalPrice: number = 0;

  // ===> RÉ-AJOUT des traductions complètes <===
  statusTranslations: { [key in OrderStatus]: string } = {
    'Pending': 'En attente',
    'Processing': 'En préparation',
    'Shipped': 'Expédiée',
    'Delivered': 'Livrée', // Même si filtré, on garde pour la cohérence du type
    'Cancelled': 'Annulée'
  };
  // ===> FIN RÉ-AJOUT <===

  ngOnInit(): void {
    // console.log('[UserOrdersComponent] ngOnInit.'); // Log optionnel
    this.currentUser = this.userAuthService.getCurrentUser();
    // console.log('[UserOrdersComponent] Utilisateur actuel:', this.currentUser); // Log optionnel

    if (this.currentUser) {
       this.loadAndGroupUserOrders();
    } else {
        // console.log('[UserOrdersComponent] Utilisateur non connecté.'); // Log optionnel
        this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    // console.log('[UserOrdersComponent] ngOnDestroy.'); // Log optionnel
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAndGroupUserOrders(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.totalItemsCount = 0;
    this.cumulativeTotalPrice = 0;
    this.groupedOrders = [];
    this.cdr.detectChanges();
    // console.log('[UserOrdersComponent] loadAndGroupUserOrders: Début.'); // Log optionnel

    this.orderService.getUserOrders().pipe(
        takeUntil(this.destroy$),
        map(orders => this.groupOrdersByBookAndCustomer(orders)),
        tap(groupedData => console.log(`[UserOrdersComponent] Données groupées: ${groupedData.length} groupes`)) // Garder ce log peut être utile
    ).subscribe({
        next: (groupedOrdersData) => {
            // console.log(`[UserOrdersComponent] SUBSCRIBE Next: ${groupedOrdersData.length} groupes reçus.`); // Log optionnel
            this.groupedOrders = groupedOrdersData;
            this.totalItemsCount = this.groupedOrders.reduce((sum, group) => sum + group.totalQuantity, 0);
            this.cumulativeTotalPrice = this.groupedOrders.reduce((sum, group) => sum + group.totalGroupPrice, 0);
            this.isLoading = false;
            this.cdr.detectChanges();
        },
        error: (error) => {
            console.error('[UserOrdersComponent] SUBSCRIBE Error:', error);
            this.errorMessage = "Impossible de charger l'historique des commandes.";
            this.isLoading = false; this.groupedOrders = []; this.totalItemsCount = 0; this.cumulativeTotalPrice = 0;
            this.cdr.detectChanges();
        },
        // complete: () => { console.log('[UserOrdersComponent] SUBSCRIBE Complete.'); } // Log optionnel
    });
    // console.log('[UserOrdersComponent] loadAndGroupUserOrders: Abonnement explicite effectué.'); // Log optionnel
  }

  // Méthode groupOrdersByBookAndCustomer (devrait être OK maintenant)
  private groupOrdersByBookAndCustomer(orders: Order[]): GroupedOrderView[] {
      if (!orders || orders.length === 0) { return []; }
      // console.log(`[UserOrdersComponent] groupOrdersByBookAndCustomer: Groupement pour ${orders.length} commandes.`); // Log optionnel
      const groupedMap = new Map<string, GroupedOrderView>();
      orders.forEach(order => {
           if (!order.items || order.items.length === 0) { return; }
           const item = order.items[0];
           const groupKey = `book-${item.bookId}`;
           if (groupedMap.has(groupKey)) {
               const existingGroup = groupedMap.get(groupKey)!;
               existingGroup.totalQuantity += item.quantity;
               existingGroup.totalGroupPrice += (item.price * item.quantity);
               if (order.orderDate > existingGroup.latestOrderDate) {
                   existingGroup.latestOrderDate = order.orderDate;
                   existingGroup.latestStatus = order.status;
                   existingGroup.customerName = order.customerName;
                   existingGroup.customerEmail = order.customerEmail;
                   existingGroup.latestOrderNumber = order.orderNumber;
               }
           } else {
               groupedMap.set(groupKey, {
                   bookId: item.bookId, title: item.title, unitPrice: item.price,
                   totalQuantity: item.quantity, totalGroupPrice: item.price * item.quantity,
                   latestOrderDate: order.orderDate, latestStatus: order.status,
                   customerName: order.customerName, customerEmail: order.customerEmail,
                   latestOrderNumber: order.orderNumber
               });
           }
       });
       const groupedArray = Array.from(groupedMap.values())
           .sort((a, b) => b.latestOrderDate.getTime() - a.latestOrderDate.getTime());
       // console.log(`[UserOrdersComponent] groupOrdersByBookAndCustomer: Terminé. ${groupedArray.length} groupes trouvés.`); // Log optionnel
       return groupedArray;
  }

  // ===> CORRECTION de la méthode getStatusBadgeClass <===
  getStatusBadgeClass(status: OrderStatus | undefined): string {
     if (!status) return 'status-unknown'; // Cas où le statut est indéfini

     // Utiliser les clés de l'objet de traduction pour vérifier si le statut est connu
     const knownStatuses = Object.keys(this.statusTranslations) as OrderStatus[];

     if (knownStatuses.includes(status)) {
        // Convertir le statut en classe CSS (ex: 'Processing' -> 'status-processing')
        return 'status-' + status.toLowerCase().replace(/ /g, '-');
     }
     // Retourner une classe par défaut si le statut n'est pas reconnu
     return 'status-unknown';
   }
   // ===> FIN CORRECTION <===

}