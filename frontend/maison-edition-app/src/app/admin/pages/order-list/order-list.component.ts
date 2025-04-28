// src/app/admin/pages/order-list/order-list.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// ===> 1. VÉRIFIER CET IMPORT <===
import { RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { Order, OrderStatus } from '../../../models/order.model'; // Vérifier chemin

@Component({
  selector: 'app-order-list',
  standalone: true,
  // ===> 2. VÉRIFIER LA PRÉSENCE DE RouterLink DANS CE TABLEAU <===
  imports: [
    CommonModule,
    RouterLink // <-- IL DOIT ÊTRE ICI
  ],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit {

  // Injection du service OrderService
  private orderService = inject(OrderService);

  // Observable pour la liste des commandes
  orders$: Observable<Order[]> = of([]); // Initialisé avec un tableau vide

  // Liste des statuts possibles pour le menu déroulant
  possibleStatuses: OrderStatus[] = ['En attente', 'En préparation', 'Expédiée', 'Livrée', 'Annulée'];

  // Méthode exécutée à l'initialisation du composant
  ngOnInit(): void {
    console.log('[OrderListComponent] ngOnInit: Initialisation et chargement des commandes.');
    this.loadOrders(); // Appel pour charger les commandes
  }

  // Méthode pour charger les commandes depuis le service
  loadOrders(): void {
    this.orders$ = this.orderService.getOrders();
  }

  // Méthode appelée lors du changement de statut dans le <select>
  onStatusChange(orderId: string, event: Event): void {
    // Récupérer l'élément <select> qui a déclenché l'événement
    const selectElement = event.target as HTMLSelectElement;
    // Récupérer la nouvelle valeur sélectionnée et la caster en OrderStatus
    const newStatus = selectElement.value as OrderStatus;
    // Si un nouveau statut est bien sélectionné
    if (newStatus) {
      console.log(`[OrderListComponent] Changement de statut demandé pour ${orderId} vers ${newStatus}`);
      // Appeler le service pour mettre à jour le statut (mise à jour simulée)
      this.orderService.updateOrderStatus(orderId, newStatus);
      // La liste se mettra à jour automatiquement car orders$ est un Observable
    }
  }

  // Méthode appelée lors du clic sur le bouton de suppression
  deleteOrder(orderId: string): void {
    // Demander confirmation à l'utilisateur
    if (confirm(`Êtes-vous sûr de vouloir supprimer la commande ${orderId} ? Cette action est simulée et non persistante.`)) {
      console.log(`[OrderListComponent] Suppression demandée pour la commande ${orderId}`);
      // Appeler le service pour supprimer la commande (suppression simulée)
      this.orderService.deleteOrder(orderId);
      // La liste se mettra à jour automatiquement
    }
  }
}