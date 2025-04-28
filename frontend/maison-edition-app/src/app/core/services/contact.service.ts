// src/app/core/services/contact.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ContactMessage } from '../../models/contact-message.model'; // Assurez-vous que le chemin est correct

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  private readonly STORAGE_KEY = 'contactMessages';
  // BehaviorSubject pour contenir la liste actuelle des messages et notifier les changements
  private messagesSubject: BehaviorSubject<ContactMessage[]>;
  // Liste interne (miroir) - utile pour certaines logiques mais la source de vérité est le Subject pour les abonnés
  private messages: ContactMessage[] = [];

  constructor() {
    // Charger les messages depuis localStorage une seule fois à l'initialisation
    const initialMessages = this.loadMessagesFromStorage();
    this.messages = initialMessages; // Mettre à jour la liste interne
    this.messagesSubject = new BehaviorSubject<ContactMessage[]>(initialMessages);
    console.log('[ContactService] Initialisé. Messages chargés depuis localStorage:', initialMessages.length);
  }

  /**
   * Charge les messages depuis localStorage et les prépare.
   * @returns ContactMessage[] - Le tableau des messages.
   */
  private loadMessagesFromStorage(): ContactMessage[] {
    if (typeof localStorage === 'undefined') {
        console.warn('[ContactService] localStorage n\'est pas disponible.');
        return [];
    }
    try {
      const rawData = localStorage.getItem(this.STORAGE_KEY);
      if (!rawData) return [];
      const messagesRaw: any[] = JSON.parse(rawData);
      const loadedMessages = messagesRaw
        .map(msg => {
          // Utilisation de l'ID timestamp ou 0 si invalide pour filtrage
          const id = typeof msg?.id === 'number' ? msg.id : 0;
          const parsedDate = new Date(msg.date);
          // Vérifier validité ID et Date
          if (id === 0 || isNaN(parsedDate.getTime()) || !msg.name || !msg.email || !msg.message) {
             console.warn('[ContactService] Message invalide/incomplet trouvé:', msg);
             return null;
          }
          return {
            id: id,
            name: String(msg.name),
            email: String(msg.email),
            subject: String(msg.subject ?? 'N/A'), // Sujet optionnel
            message: String(msg.message),
            date: parsedDate,
            isRead: !!msg.isRead // Convertir en booléen
          } as ContactMessage;
        })
        .filter((msg): msg is ContactMessage => msg !== null); // Garder seulement les valides

      loadedMessages.sort((a, b) => b.date.getTime() - a.date.getTime()); // Trier
      return loadedMessages;
    } catch (error) {
      console.error('[ContactService] Erreur lors de la lecture/parsing de localStorage:', error);
      return [];
    }
  }

  /**
   * Sauvegarde la liste des messages dans localStorage et notifie les abonnés.
   * @param messagesToSave - Le tableau des messages à sauvegarder.
   */
  private saveAndNotify(messagesToSave: ContactMessage[]): void {
     if (typeof localStorage === 'undefined') {
        console.warn('[ContactService] saveAndNotify: localStorage non disponible.');
        return; // Ne rien faire si localStorage n'est pas dispo
     }
    try {
      // ===> LOG 1: Vérifier la liste JUSTE AVANT sauvegarde/notification <===
      console.log('[ContactService] saveAndNotify: Liste à sauvegarder/notifier:', JSON.stringify(messagesToSave, null, 2));

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messagesToSave));
      // Mettre à jour la liste interne aussi
      this.messages = messagesToSave;
      // Émettre une NOUVELLE référence de tableau via le BehaviorSubject
      this.messagesSubject.next([...messagesToSave]); // IMPORTANT: cloner avec [...]

      // ===> LOG 2: Confirmer que .next() a été appelé <===
      console.log(`[ContactService] saveAndNotify: ${messagesToSave.length} messages sauvegardés et messagesSubject.next() appelé.`);

    } catch (error) {
      console.error('[ContactService] Erreur lors de la sauvegarde dans localStorage:', error);
    }
  }

  /**
   * Récupère un Observable de la liste des messages.
   */
  getMessages(): Observable<ContactMessage[]> {
    return this.messagesSubject.asObservable();
  }

  /**
   * Ajoute un nouveau message à la liste et sauvegarde.
   */
  addMessage(name: string, email: string, subject: string, message: string): void {
    const newMessage: ContactMessage = {
      id: Date.now(), // Utiliser le timestamp comme ID simple et unique
      name, email, subject, message,
      date: new Date()
    };

    // ===> LOG 3: Vérifier le message créé et l'état AVANT modification <===
    console.log('[ContactService] addMessage: Nouveau message créé:', newMessage);
    const currentMessages = this.messagesSubject.getValue(); // Obtenir la liste actuelle
    console.log('[ContactService] addMessage: Liste actuelle AVANT ajout:', JSON.stringify(currentMessages, null, 2));

    // Ajouter le nouveau message au début de la liste pour la sauvegarde
    const updatedMessages = [newMessage, ...currentMessages];

     // ===> LOG 4: Vérifier l'état APRÈS modification, AVANT sauvegarde <===
    console.log('[ContactService] addMessage: Liste à sauvegarder APRÈS ajout:', JSON.stringify(updatedMessages, null, 2));

    // Sauvegarder la nouvelle liste (localStorage + notification Subject)
    this.saveAndNotify(updatedMessages);
    console.log('[ContactService] addMessage: Appel à saveAndNotify terminé pour ID:', newMessage.id);
  }

  /**
   * Supprime un message basé sur son ID.
   */
  deleteMessage(messageId: number): void {
    console.log(`[ContactService] Tentative de suppression du message ID: ${messageId}`);
    const currentMessages = this.messagesSubject.getValue();
    const initialLength = currentMessages.length;
    const updatedMessages = currentMessages.filter(msg => msg.id !== messageId);

    if (updatedMessages.length < initialLength) {
      this.saveAndNotify(updatedMessages);
      console.log(`[ContactService] Message ID: ${messageId} supprimé avec succès.`);
    } else {
      console.warn(`[ContactService] Aucun message trouvé avec l'ID ${messageId} pour suppression.`);
    }
  }

   // --- Méthode pour marquer comme lu (inchangée) ---
   markAsRead(messageId: number): void {
      const currentMessages = this.messagesSubject.getValue(); // Utiliser la valeur du Subject
      const messageIndex = currentMessages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1 && !currentMessages[messageIndex].isRead) {
          const updatedMessage = { ...currentMessages[messageIndex], isRead: true };
          // Créer un nouveau tableau pour la mise à jour
          const updatedMessagesList = [
              ...currentMessages.slice(0, messageIndex),
              updatedMessage,
              ...currentMessages.slice(messageIndex + 1)
          ];
          console.log(`[ContactService] Message ID: ${messageId} marqué comme lu.`);
          this.saveAndNotify(updatedMessagesList); // Sauvegarder et notifier avec la nouvelle liste
      } else if (messageIndex !== -1) {
          console.log(`[ContactService] Message ID: ${messageId} était déjà marqué comme lu.`);
      } else {
          console.warn(`[ContactService] Message ID: ${messageId} non trouvé pour marquer comme lu.`);
      }
   }
}