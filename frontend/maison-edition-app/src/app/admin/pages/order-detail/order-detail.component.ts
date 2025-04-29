// src/app/admin/pages/order-detail/order-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, of, switchMap, catchError, tap, map } from 'rxjs';
import { OrderService } from '../../../core/services/order.service'; // Vérifiez chemin
import { Order, OrderStatus } from '../../../models/order.model';    // Vérifiez chemin

@Component({
  selector: 'app-order-detail', // Garder le sélecteur correct
  standalone: true,
  imports: [CommonModule, RouterLink],
  // === CORRECTION templateUrl et styleUrls ===
  templateUrl: './order-detail.component.html', // Pointe vers son propre template
  styleUrls: ['./order-detail.component.scss']   // Pointe vers ses propres styles
})
// === CORRECTION Nom de la classe ===
export class OrderDetailComponent implements OnInit { // Nommé OrderDetailComponent

  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  order$: Observable<Order | undefined> = of(undefined);
  errorMessage: string | null = null;

  // Objet de traduction (identique à OrderListComponent)
  statusTranslations: { [key in OrderStatus]: string } = {
    'Pending': 'En attente', 'Processing': 'En préparation', 'Shipped': 'Expédiée',
    'Delivered': 'Livrée', 'Cancelled': 'Annulée'
  };

  ngOnInit(): void {
    console.log('[OrderDetailComponent] ngOnInit: Initialisation.');
    this.loadOrderDetails();
  }

  loadOrderDetails(): void {
    this.errorMessage = null;
    console.log('[OrderDetailComponent] loadOrderDetails: Début chargement.');
    this.order$ = this.route.paramMap.pipe(
      map(params => params.get('id')),
      tap(orderId => console.log(`[OrderDetailComponent] ID récupéré de l'URL: ${orderId}`)),
      switchMap(orderId => {
        if (orderId) {
          return this.orderService.getOrderById(orderId).pipe( // Utilise ID string
             tap(order => {
                if (!order) {
                   console.warn(`[OrderDetailComponent] Commande non trouvée pour l'ID: ${orderId}`);
                   this.errorMessage = `Désolé, la commande avec l'ID "${orderId}" n'a pas été trouvée.`;
                } else {
                   console.log(`[OrderDetailComponent] Détails de la commande ${orderId} chargés:`, order);
                }
             }),
            catchError(error => {
              console.error('[OrderDetailComponent] Erreur lors de la récupération de la commande:', error);
              this.errorMessage = 'Une erreur est survenue lors du chargement des détails de la commande.';
              return of(undefined);
            })
          );
        } else {
          console.warn('[OrderDetailComponent] Aucun ID de commande fourni dans l\'URL.');
          this.errorMessage = 'Aucun identifiant de commande n\'a été spécifié.';
          return of(undefined);
        }
      })
    );
  }

  // Fonction pour générer la classe CSS du badge
  getStatusBadgeClass(status: OrderStatus | undefined): string {
    if (!status) return 'status-unknown';
    return 'status-' + status.toLowerCase().replace(/ /g, '-');
  }
}