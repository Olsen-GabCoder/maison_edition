// src/app/admin/pages/order-detail/order-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
// Correction: Importer map, catchError, tap UNE SEULE FOIS depuis 'rxjs'
import { Observable, of, switchMap, catchError, tap, map } from 'rxjs'; // Assurez-vous que map est bien ici
import { OrderService } from '../../../core/services/order.service';
import { Order, OrderStatus } from '../../../models/order.model'; // Vérifier chemin

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
   ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  order$: Observable<Order | undefined> = of(undefined);
  errorMessage: string | null = null;

  ngOnInit(): void {
    console.log('[OrderDetailComponent] ngOnInit: Initialisation.');
    this.loadOrderDetails();
  }

  loadOrderDetails(): void {
    this.errorMessage = null;
    this.order$ = this.route.paramMap.pipe(
      map(params => params.get('id')),
      tap(orderId => console.log(`[OrderDetailComponent] ID récupéré de l'URL: ${orderId}`)),
      switchMap(orderId => {
        if (orderId) {
          return this.orderService.getOrderById(orderId).pipe(
             tap(order => {
                if (!order) {
                   console.warn(`[OrderDetailComponent] Commande non trouvée pour l'ID: ${orderId}`);
                   this.errorMessage = `Désolé, la commande avec l'ID "${orderId}" n'a pas été trouvée.`;
                } else {
                   console.log(`[OrderDetailComponent] Détails de la commande ${orderId} chargés.`);
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

  // Fonction pour générer la classe CSS du badge (alternative au pipe replace)
  // Vous pouvez l'utiliser dans le template si besoin avec [ngClass] ou [class]
  // Exemple d'utilisation dans le HTML (à la place de la version précédente):
  // <span class="status-badge" [class]="getStatusBadgeClass(order.status)">
  getStatusBadgeClass(status: OrderStatus): string {
    // Remplace les espaces par des tirets et met en minuscule
    return 'status-' + status.toLowerCase().replace(/ /g, '-');
  }
}

// LIGNE REDONDANTE SUPPRIMÉE CI-DESSOUS :
// import { map, catchError, tap } from 'rxjs/operators'; // <<<=== SUPPRIMER CETTE LIGNE