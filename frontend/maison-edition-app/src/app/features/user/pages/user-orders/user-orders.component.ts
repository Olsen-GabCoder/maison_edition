// src/app/features/user/pages/user-orders/user-orders.component.ts
import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core'; // ChangeDetectorRef, OnDestroy sont déjà là
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../../core/services/order.service';
import { Order, OrderStatus } from '../../../../models/order.model';
import { Observable, of, Subject } from 'rxjs'; // Subject est déjà là
import { catchError, tap, takeUntil } from 'rxjs/operators'; // takeUntil est déjà là
// import { RouterLink } from '@angular/router'; // <<< Reste commenté/absent si non utilisé

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule], // <<< Ne pas rajouter RouterLink
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.scss']
})
export class UserOrdersComponent implements OnInit, OnDestroy {

  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  userOrders$: Observable<Order[]> = of([]);
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // ===> AJOUT N°1 : Propriétés pour stocker les totaux <===
  totalOrderCount: number = 0;
  cumulativeTotalPrice: number = 0;
  // ===> FIN AJOUT N°1 <===

  statusTranslations: { [key in OrderStatus]: string } = {
    'Pending': 'En attente', 'Processing': 'En préparation', 'Shipped': 'Expédiée',
    'Delivered': 'Livrée', 'Cancelled': 'Annulée'
  };

  // Le constructeur est vide, c'est ok
  // constructor() {}

  ngOnInit(): void {
    console.log('[UserOrdersComponent] ngOnInit.');
    this.loadUserOrders();
  }

  ngOnDestroy(): void {
    console.log('[UserOrdersComponent] ngOnDestroy.');
    this.destroy$.next();
    this.destroy$.complete();
  }


  loadUserOrders(): void {
    this.isLoading = true;
    this.errorMessage = null;
    // ===> AJOUT N°2 : Réinitialiser les totaux ici <===
    this.totalOrderCount = 0;
    this.cumulativeTotalPrice = 0;
    // ===> FIN AJOUT N°2 <===
    this.cdr.detectChanges();
    console.log('[UserOrdersComponent] loadUserOrders: Début, isLoading=true.');

    this.orderService.getUserOrders().pipe(
        takeUntil(this.destroy$)
    ).subscribe({
        next: (orders) => {
            console.log(`[UserOrdersComponent] SUBSCRIBE Next: Commandes reçues (depuis getUserOrders). Nombre: ${orders.length}`, orders);

            // ===> AJOUT N°3 : Calculer les totaux ici <===
            this.totalOrderCount = orders ? orders.length : 0;
            this.cumulativeTotalPrice = orders ? orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) : 0; // Ajouter (|| 0) pour sécurité
            console.log(`[UserOrdersComponent] TAP: Calcul des totaux: count=${this.totalOrderCount}, total=${this.cumulativeTotalPrice}`);
            // ===> FIN AJOUT N°3 <===

            // Le reste de votre logique next (qui fonctionne)
            this.userOrders$ = of(orders);
            this.isLoading = false;
            console.log('[UserOrdersComponent] SUBSCRIBE Next: isLoading mis à false.');
            this.cdr.detectChanges();
        },
        error: (error) => {
            console.error('[UserOrdersComponent] SUBSCRIBE Error:', error);
            this.errorMessage = "Impossible de charger l'historique des commandes.";
            this.isLoading = false;
            console.log('[UserOrdersComponent] SUBSCRIBE Error: isLoading mis à false.');
            this.userOrders$ = of([]);
             // ===> AJOUT N°4 : Réinitialiser les totaux en cas d'erreur <===
             this.totalOrderCount = 0;
             this.cumulativeTotalPrice = 0;
             // ===> FIN AJOUT N°4 <===
            this.cdr.detectChanges();
        },
        complete: () => {
            console.log('[UserOrdersComponent] SUBSCRIBE Complete: Observable getUserOrders complété.');
        }
    });

    console.log('[UserOrdersComponent] loadUserOrders: Abonnement explicite effectué.');
  }

  getStatusBadgeClass(status: OrderStatus | undefined): string {
    // Votre fonction existante (qui fonctionne)
    if (!status) return 'status-unknown';
    const knownStatuses = Object.keys(this.statusTranslations);
    if (knownStatuses.includes(status)) {
      return 'status-' + status.toLowerCase().replace(/ /g, '-');
    }
    return 'status-unknown';
  }
}