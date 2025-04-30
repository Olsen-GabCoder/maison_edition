// src/app/features/user/pages/user-orders/user-orders.component.ts
import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../../core/services/order.service'; // Vérifier chemin
import { Order, OrderStatus } from '../../../../models/order.model';    // Vérifier chemin
import { OrderItem } from '../../../../models/order-item.model';  // Importer OrderItem
import { Observable, of, Subject } from 'rxjs';
import { catchError, tap, takeUntil, map } from 'rxjs/operators'; // map est déjà importé

// Interface pour la vue groupée (inchangée, contient déjà ce qu'il faut)
interface GroupedOrderView {
  bookId: number;
  title: string;
  unitPrice: number;
  totalQuantity: number;
  totalGroupPrice: number;
  latestOrderDate: Date;
  latestStatus: OrderStatus;
  customerName: string;
  customerEmail: string;
  latestOrderNumber: string;
}

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule], // RouterLink n'est pas importé car non utilisé dans le HTML fourni
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.scss']
})
export class UserOrdersComponent implements OnInit, OnDestroy {

  // Injections (inchangées)
  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Propriétés pour les données et l'état (inchangées)
  groupedOrders: GroupedOrderView[] = [];
  isLoading: boolean = true;
  errorMessage: string | null = null;
  totalItemsCount: number = 0;
  cumulativeTotalPrice: number = 0;

  // Traductions (inchangées)
  statusTranslations: { [key in OrderStatus]: string } = {
    'Pending': 'En attente', 'Processing': 'En préparation', 'Shipped': 'Expédiée',
    'Delivered': 'Livrée', 'Cancelled': 'Annulée'
  };

  // --- Méthodes Lifecycle (inchangées) ---
  ngOnInit(): void {
    console.log('[UserOrdersComponent] ngOnInit.');
    this.loadAndGroupUserOrders();
  }

  ngOnDestroy(): void {
    console.log('[UserOrdersComponent] ngOnDestroy.');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Méthode de Chargement et Traitement (inchangée) ---
  loadAndGroupUserOrders(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.totalItemsCount = 0;
    this.cumulativeTotalPrice = 0;
    this.groupedOrders = [];
    this.cdr.detectChanges();
    console.log('[UserOrdersComponent] loadAndGroupUserOrders: Début, isLoading=true.');

    this.orderService.getUserOrders().pipe( // Rappel: getUserOrders filtre déjà les 'Delivered'
        takeUntil(this.destroy$),
        // Appel de la méthode de groupement (qui contient la logique modifiée)
        map(orders => this.groupOrdersByBookAndCustomer(orders)),
        tap(groupedData => console.log(`[UserOrdersComponent] Données après groupement par client/livre: ${groupedData.length} groupes`))
    ).subscribe({
        next: (groupedOrdersData) => {
            // Stockage et calculs des totaux globaux (inchangés)
            console.log(`[UserOrdersComponent] SUBSCRIBE Next: Données groupées reçues. Nombre: ${groupedOrdersData.length}`, groupedOrdersData);
            this.groupedOrders = groupedOrdersData;
            this.totalItemsCount = this.groupedOrders.reduce((sum, group) => sum + group.totalQuantity, 0);
            this.cumulativeTotalPrice = this.groupedOrders.reduce((sum, group) => sum + group.totalGroupPrice, 0);
            console.log(`[UserOrdersComponent] SUBSCRIBE Next: Calcul totaux globaux: totalItems=${this.totalItemsCount}, cumulativePrice=${this.cumulativeTotalPrice}`);
            this.isLoading = false;
            this.cdr.detectChanges(); // Mettre à jour la vue
        },
        error: (error) => {
            // Gestion erreur (inchangée)
            console.error('[UserOrdersComponent] SUBSCRIBE Error:', error);
            this.errorMessage = "Impossible de charger ou traiter l'historique des commandes.";
            this.isLoading = false; this.groupedOrders = []; this.totalItemsCount = 0; this.cumulativeTotalPrice = 0; this.cdr.detectChanges();
        },
        complete: () => { console.log('[UserOrdersComponent] SUBSCRIBE Complete.'); }
    });
    console.log('[UserOrdersComponent] loadAndGroupUserOrders: Abonnement explicite effectué.');
  }

  /** ===> MODIFICATION PRINCIPALE: Logique de groupement maintenant par Client ET Livre <=== */
  private groupOrdersByBookAndCustomer(orders: Order[]): GroupedOrderView[] {
      if (!orders || orders.length === 0) {
          return [];
      }
      console.log(`[UserOrdersComponent] groupOrdersByBookAndCustomer: Début groupement pour ${orders.length} commandes.`);

      // Utilisation d'une Map pour stocker les groupes en cours de construction
      const groupedMap = new Map<string, GroupedOrderView>();

      // Itération sur chaque commande reçue
      orders.forEach(order => {
          // Ignorer les commandes sans items (sécurité)
          if (!order.items || order.items.length === 0) {
              console.warn(`[UserOrdersComponent] groupOrdersByBookAndCustomer: Commande ${order.id} sans items ignorée.`);
              return;
          }
          // Prendre le premier item (basé sur le flux actuel: 1 commande = 1 livre)
          const item = order.items[0];

          // *** Construction de la Clé de Groupement (Utilisateur + Livre) ***
          // 1. Identifier l'utilisateur: Priorité à customerId, sinon email (en minuscule)
          const customerIdentifier = order.customerId ? `id-${order.customerId}` : `email-${order.customerEmail?.toLowerCase() ?? 'unknown-email'}`;
          // 2. Combiner avec l'ID du livre
          const groupKey = `${customerIdentifier}_book-${item.bookId}`;
          // *** Fin Clé ***

          // Vérifier si ce groupe (client+livre) existe déjà dans la Map
          if (groupedMap.has(groupKey)) {
              // Oui: Mettre à jour le groupe existant
              const existingGroup = groupedMap.get(groupKey)!;
              existingGroup.totalQuantity += item.quantity; // Ajouter la quantité (qui est 1 dans le flux actuel)
              existingGroup.totalGroupPrice += (item.price * item.quantity); // Ajouter au prix total du groupe
              // Garder les informations de la commande la PLUS RÉCENTE pour ce groupe
              if (order.orderDate > existingGroup.latestOrderDate) {
                  existingGroup.latestOrderDate = order.orderDate;
                  existingGroup.latestStatus = order.status;
                  existingGroup.customerName = order.customerName; // Mise à jour Nom (devrait être identique)
                  existingGroup.customerEmail = order.customerEmail; // Mise à jour Email (devrait être identique)
                  existingGroup.latestOrderNumber = order.orderNumber; // Mise à jour N° Commande
              }
          } else {
              // Non: Créer une nouvelle entrée pour ce groupe dans la Map
              groupedMap.set(groupKey, {
                  bookId: item.bookId,
                  title: item.title,
                  unitPrice: item.price,
                  totalQuantity: item.quantity, // Quantité initiale
                  totalGroupPrice: item.price * item.quantity, // Prix total initial
                  latestOrderDate: order.orderDate, // Infos de la 1ère commande de ce groupe
                  latestStatus: order.status,
                  customerName: order.customerName,
                  customerEmail: order.customerEmail,
                  latestOrderNumber: order.orderNumber
              });
          }
      });

      // Convertir la Map finale en tableau et trier par date la plus récente
      const groupedArray = Array.from(groupedMap.values())
          .sort((a, b) => b.latestOrderDate.getTime() - a.latestOrderDate.getTime());

      console.log(`[UserOrdersComponent] groupOrdersByBookAndCustomer: Groupement terminé. ${groupedArray.length} groupes uniques client/livre trouvés.`);
      return groupedArray; // Retourner le tableau groupé et trié
  }
  /** ===> FIN MODIFICATION MÉTHODE <=== */


  // Fonction pour badge statut (inchangée)
   getStatusBadgeClass(status: OrderStatus | undefined): string {
     if (!status) return 'status-unknown';
     const knownStatuses = Object.keys(this.statusTranslations);
     if (knownStatuses.includes(status)) {
        return 'status-' + status.toLowerCase().replace(/ /g, '-');
     }
     return 'status-unknown';
   }
}