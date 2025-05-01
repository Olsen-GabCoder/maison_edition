// src/app/admin/pages/message-list/message-list.component.ts - VERSION NETTOYÉE
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importé pour *ngIf, *ngFor, async pipe, date pipe etc.
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { ContactService } from '../../../core/services/contact.service';
import { ContactMessage } from '../../../models/contact-message.model';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule], // CommonModule est nécessaire
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss']
})
export class MessageListComponent implements OnInit {

  private contactService = inject(ContactService);

  // Observable des messages venant du service
  messages$: Observable<ContactMessage[]> = of([]);
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // Propriété pour stocker le message actuellement sélectionné pour l'affichage détaillé
  selectedMessage: ContactMessage | null = null;

  ngOnInit(): void {
    // console.log('[MessageListComponent] ngOnInit: Initialisation.'); // Log optionnel
    this.loadMessages();
  }

  /**
   * Charge les messages depuis le ContactService.
   * Gère les états de chargement et d'erreur.
   */
  loadMessages(): void {
    // console.log('[MessageListComponent] Chargement des messages...'); // Log optionnel
    this.isLoading = true;
    this.errorMessage = null;
    this.selectedMessage = null; // Réinitialiser le message sélectionné au chargement

    this.messages$ = this.contactService.getMessages().pipe(
      tap(messages => {
        // console.log(`[MessageListComponent] ${messages.length} messages reçus via l'observable.`); // Log optionnel
        this.isLoading = false; // Arrêter le chargement après réception
      }),
      catchError(error => {
        console.error('[MessageListComponent] Erreur lors de la réception des messages:', error);
        this.errorMessage = 'Impossible de charger les messages.';
        this.isLoading = false;
        return of([]); // Retourner un tableau vide en cas d'erreur pour que le template ne casse pas
      })
    );
  }

  /**
   * Supprime un message via le ContactService.
   * @param messageId L'ID du message à supprimer.
   */
  deleteMessage(messageId: number): void {
    // Confirmation utilisateur
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message définitivement ?')) {
      // console.log(`[MessageListComponent] Demande de suppression du message ID: ${messageId}`); // Log optionnel
      this.contactService.deleteMessage(messageId); // Appelle le service

      // Si le message actuellement affiché en détail est celui supprimé, on le masque.
      if (this.selectedMessage?.id === messageId) {
         this.selectedMessage = null;
      }
    } else {
      // console.log(`[MessageListComponent] Suppression annulée pour message ID: ${messageId}`); // Log optionnel
    }
  }

  /**
   * Sélectionne un message pour l'affichage détaillé et le marque comme lu si nécessaire.
   * @param message Le message ContactMessage à afficher.
   */
  viewMessage(message: ContactMessage): void {
    // console.log('[MessageListComponent] Affichage détail pour message ID:', message.id); // Log optionnel
    this.selectedMessage = message; // Stocke le message pour affichage

    // Si le message n'est pas déjà marqué comme lu, on appelle la méthode pour le faire
    if (!message.isRead) {
       this.markAsRead(message.id);
    }
  }

  /**
   * Ferme la vue détaillée du message.
   */
  closeMessageDetail(): void {
     // console.log('[MessageListComponent] Fermeture du détail.'); // Log optionnel
     this.selectedMessage = null; // Remet la sélection à null
  }

  /**
   * Appelle le ContactService pour marquer un message comme lu.
   * Met également à jour l'objet selectedMessage si c'est celui qui est marqué.
   * @param messageId L'ID du message à marquer comme lu.
   */
  markAsRead(messageId: number): void {
     // console.log(`[MessageListComponent] Marquer comme lu message ID: ${messageId}`); // Log optionnel
     this.contactService.markAsRead(messageId); // Appelle le service

     // Si le message affiché en détail est celui qu'on vient de marquer,
     // on met à jour sa propriété 'isRead' pour refléter le changement immédiatement
     // sans attendre la prochaine émission de l'observable messages$.
     if (this.selectedMessage?.id === messageId) {
         this.selectedMessage = { ...this.selectedMessage, isRead: true };
     }
  }

  // --- Les méthodes liées aux commandes (getOrderStatusClass, etc.) ont été supprimées ---
  // --- car elles n'appartiennent pas à la logique de ce composant. ---

}