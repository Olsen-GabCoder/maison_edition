// src/app/admin/pages/message-list/message-list.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators'; // catchError ajouté si besoin

import { ContactService } from '../../../core/services/contact.service'; // Import du service OK
// ===> CORRECTION DE L'IMPORTATION DE L'INTERFACE <===
import { ContactMessage } from '../../../models/contact-message.model'; // Importer depuis le modèle

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss']
})
export class MessageListComponent implements OnInit {

  private contactService = inject(ContactService);

  // L'observable vient toujours du service
  messages$: Observable<ContactMessage[]> = of([]);
  isLoading: boolean = true; // Ajouter indicateur de chargement
  errorMessage: string | null = null; // Ajouter gestion d'erreur
  selectedMessage: ContactMessage | null = null; // Pour afficher détail

  ngOnInit(): void {
    console.log('[MessageListComponent] ngOnInit: Initialisation.');
    this.loadMessages();
  }

  loadMessages(): void {
    console.log('[MessageListComponent] Chargement des messages...');
    this.isLoading = true;
    this.errorMessage = null;
    // S'abonner à l'observable du service
    this.messages$ = this.contactService.getMessages().pipe(
      tap(messages => {
        console.log(`[MessageListComponent] ${messages.length} messages reçus via l'observable.`);
        this.isLoading = false;
      }),
      catchError(error => {
        console.error('[MessageListComponent] Erreur lors de la réception des messages:', error);
        this.errorMessage = 'Impossible de charger les messages.';
        this.isLoading = false;
        return of([]); // Retourner un tableau vide en cas d'erreur
      })
    );
  }

  deleteMessage(messageId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      console.log(`[MessageListComponent] Demande de suppression du message ID: ${messageId}`);
      // Le service gère maintenant la mise à jour de l'observable
      this.contactService.deleteMessage(messageId);
      // Si le détail était affiché, le fermer
      if (this.selectedMessage?.id === messageId) {
         this.selectedMessage = null;
      }
    } else {
      console.log(`[MessageListComponent] Suppression annulée pour message ID: ${messageId}`);
    }
  }

  // --- Ajout de méthodes pour voir détail et marquer comme lu ---
  viewMessage(message: ContactMessage): void {
    this.selectedMessage = message;
    // Marquer comme lu si ce n'est pas déjà fait
    if (!message.isRead) {
       this.markAsRead(message.id);
    }
  }

  closeMessageDetail(): void {
     this.selectedMessage = null;
  }

  markAsRead(messageId: number): void {
     console.log(`[MessageListComponent] Marquer comme lu message ID: ${messageId}`);
     this.contactService.markAsRead(messageId);
     // Mettre à jour aussi le message sélectionné s'il est affiché
     if (this.selectedMessage?.id === messageId) {
         this.selectedMessage = { ...this.selectedMessage, isRead: true };
     }
  }

  // --- Ajout de méthodes pour le template HTML (status commande) ---
  // Note: Ces méthodes concernent les commandes, pas les messages.
  // Il est préférable de les avoir dans OrderListComponent.
  // Mais si elles sont utilisées ici par erreur, les voici :
  getOrderStatusClass(status: string): string {
     switch (status?.toUpperCase()) {
        case 'PENDING': return 'badge-pending';
        case 'PROCESSING': return 'badge-processing';
        case 'SHIPPED': return 'badge-shipped';
        case 'DELIVERED': return 'badge-delivered';
        case 'CANCELLED': return 'badge-cancelled';
        default: return 'badge-secondary';
     }
   }

   getOrderStatusText(status: string): string {
     switch (status?.toUpperCase()) {
        case 'PENDING': return 'En attente';
        case 'PROCESSING': return 'En traitement';
        case 'SHIPPED': return 'Expédiée';
        case 'DELIVERED': return 'Livrée';
        case 'CANCELLED': return 'Annulée';
        default: return status || 'Inconnu';
     }
   }

    // Méthode pour simuler changement statut (si utilisée ici)
   changeOrderStatus(orderId: number, newStatus: string): void {
      console.warn(`[MessageListComponent] Tentative de changer statut commande ${orderId} vers ${newStatus} (devrait être dans OrderListComponent)`);
      // Logique à déplacer dans OrderService/OrderListComponent
   }
    // Méthode pour voir détails commande (si utilisée ici)
   viewOrderDetails(order: any): void {
      console.warn(`[MessageListComponent] Tentative de voir détails commande ${order?.id} (devrait être dans OrderListComponent)`);
      // Logique à déplacer dans OrderListComponent
   }


}