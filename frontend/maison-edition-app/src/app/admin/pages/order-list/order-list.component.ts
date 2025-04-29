import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Pour NgFor, NgIf, AsyncPipe, etc.
import { RouterLink } from '@angular/router';   // Pour les liens [routerLink]
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { OrderService } from '../../../core/services/order.service'; // Vérifiez chemin
// Importer Order ET OrderStatus du modèle
import { Order, OrderStatus } from '../../../models/order.model';   // Vérifiez chemin

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterLink], // RouterLink si vous avez des liens détails
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit {

  private orderService = inject(OrderService);

  orders$: Observable<Order[]> = of([]);
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // ===> CORRECTION 1 : Utiliser les valeurs du type OrderStatus <===
  // Ce tableau contient les valeurs internes/techniques des statuts
  availableStatuses: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  // ===> CORRECTION 2 : Créer un objet pour les traductions <===
  // Cet objet mappe les statuts internes à leur affichage en français
  statusTranslations: { [key in OrderStatus]: string } = {
    'Pending': 'En attente',
    'Processing': 'En préparation',
    'Shipped': 'Expédiée',
    'Delivered': 'Livrée',
    'Cancelled': 'Annulée'
  };

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.orders$ = this.orderService.getOrders().pipe(
      tap(() => this.isLoading = false),
      catchError(error => {
        console.error('[OrderList] Erreur chargement commandes:', error);
        this.errorMessage = 'Impossible de charger la liste des commandes.';
        this.isLoading = false;
        return of([]); // Retourner tableau vide en cas d'erreur
      })
    );
  }

  /**
   * Appelée lorsqu'un nouveau statut est sélectionné pour une commande.
   * @param orderId L'ID (string) de la commande à mettre à jour.
   * @param event L'événement du changement du <select>
   */
  changeStatus(orderId: string, event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    // La valeur du select DOIT être une des clés de OrderStatus ('Pending', 'Processing', etc.)
    const newStatus = selectElement.value as OrderStatus;

    // Vérifier si la valeur est valide (optionnel mais plus sûr)
    if (this.availableStatuses.includes(newStatus)) {
      console.log(`[OrderList] Changement de statut demandé pour ${orderId} vers ${newStatus}`);
      // Appeler le service avec l'ID (string) et le statut (OrderStatus)
      this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
        next: (updatedOrder) => {
            if (updatedOrder) {
                 console.log(`[OrderList] Statut de ${orderId} mis à jour avec succès.`);
                 // La liste devrait se mettre à jour via l'observable,
                 // mais on pourrait forcer un rechargement si nécessaire.
                 // this.loadOrders();
            } else {
                 console.warn(`[OrderList] Commande ${orderId} non trouvée par le service lors de la mise à jour.`);
                 this.errorMessage = `Impossible de mettre à jour la commande ${orderId} (non trouvée).`;
            }
        },
        error: (err) => {
          console.error(`[OrderList] Erreur lors de la mise à jour du statut pour ${orderId}:`, err);
          this.errorMessage = `Erreur mise à jour statut: ${err.message || 'Inconnue'}`;
        }
      });
    } else {
        console.error(`[OrderList] Tentative de mise à jour avec un statut invalide : ${selectElement.value}`);
        this.errorMessage = "Statut sélectionné invalide.";
    }
  }

  /**
   * Appelée pour supprimer une commande.
   * @param orderId L'ID (string) de la commande à supprimer.
   */
  deleteOrder(orderId: string): void {
    // Ajouter une confirmation
    if (confirm(`Êtes-vous sûr de vouloir supprimer la commande ${orderId} ? (Simulation)`)) {
      console.log(`[OrderList] Demande de suppression pour commande ${orderId}`);
      this.orderService.deleteOrder(orderId).subscribe({
          next: () => {
               console.log(`[OrderList] Commande ${orderId} marquée pour suppression.`);
               // La liste se met à jour via l'observable.
          },
          error: (err) => {
               console.error(`[OrderList] Erreur lors de la suppression de ${orderId}:`, err);
               this.errorMessage = `Erreur suppression: ${err.message || 'Inconnue'}`;
          }
      });
    }
  }
}