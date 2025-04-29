// src/app/features/user/pages/user-orders/user-orders.component.ts
import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core'; // ChangeDetectorRef, OnDestroy ajoutés
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../../core/services/order.service';
import { Order, OrderStatus } from '../../../../models/order.model';
import { Observable, of, Subject } from 'rxjs'; // Subject ajouté
import { catchError, tap, takeUntil } from 'rxjs/operators'; // takeUntil ajouté

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.scss']
})
export class UserOrdersComponent implements OnInit, OnDestroy { // Implémente OnDestroy

  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef); // Injecter ChangeDetectorRef
  private destroy$ = new Subject<void>(); // Pour la désinscription

  userOrders$: Observable<Order[]> = of([]);
  isLoading: boolean = true;
  errorMessage: string | null = null;

  statusTranslations: { [key in OrderStatus]: string } = {
    'Pending': 'En attente', 'Processing': 'En préparation', 'Shipped': 'Expédiée',
    'Delivered': 'Livrée', 'Cancelled': 'Annulée'
  };

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
    this.cdr.detectChanges(); // Forcer la détection pour afficher "isLoading" immédiatement
    console.log('[UserOrdersComponent] loadUserOrders: Début, isLoading=true.');

    // Explicitement s'abonner ici en plus du pipe async pour débugger
    this.orderService.getUserOrders().pipe(
        takeUntil(this.destroy$) // Se désabonner à la destruction
    ).subscribe({
        next: (orders) => {
            console.log(`[UserOrdersComponent] SUBSCRIBE Next: Commandes reçues (depuis getUserOrders). Nombre: ${orders.length}`, orders);
            // Assigner l'observable pour le pipe async (même si on a les données ici)
            this.userOrders$ = of(orders);
            this.isLoading = false;
            console.log('[UserOrdersComponent] SUBSCRIBE Next: isLoading mis à false.');
            this.cdr.detectChanges(); // Forcer la détection de changement après mise à jour
        },
        error: (error) => {
             // Ne devrait pas arriver car getUserOrders retourne of() ou un catch interne
            console.error('[UserOrdersComponent] SUBSCRIBE Error:', error);
            this.errorMessage = "Impossible de charger l'historique des commandes.";
            this.isLoading = false;
            console.log('[UserOrdersComponent] SUBSCRIBE Error: isLoading mis à false.');
            this.userOrders$ = of([]); // Assurer que l'observable a une valeur
            this.cdr.detectChanges(); // Forcer la détection
        },
        complete: () => {
            // of() complète immédiatement après avoir émis
            console.log('[UserOrdersComponent] SUBSCRIBE Complete: Observable getUserOrders complété.');
            // Pas besoin de changer isLoading ici, déjà fait dans 'next'
        }
    });

    console.log('[UserOrdersComponent] loadUserOrders: Abonnement explicite effectué.');
  }


   getStatusBadgeClass(status: OrderStatus | undefined): string {
     // ... (fonction inchangée)
     if (!status) return 'status-unknown';
     const knownStatuses = Object.keys(this.statusTranslations);
     if (knownStatuses.includes(status)) {
        return 'status-' + status.toLowerCase().replace(/ /g, '-');
     }
     return 'status-unknown';
   }
}