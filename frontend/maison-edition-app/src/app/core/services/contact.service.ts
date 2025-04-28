// src/app/core/services/contact.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';

// Interface mise à jour : ajout d'un ID et utilisation de Date object
export interface ContactMessage {
  id: number; // ID unique pour identifier et supprimer les messages
  name: string;
  email: string;
  subject: string; // Ajout du sujet si vous le collectez dans le formulaire
  message: string;
  date: Date;   // Utiliser un objet Date pour faciliter le tri et le formatage
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  private readonly STORAGE_KEY = 'contactMessages';
  // BehaviorSubject pour contenir la liste actuelle des messages et notifier les changements
  private messagesSubject: BehaviorSubject<ContactMessage[]>;

  constructor() {
    // Charger les messages depuis localStorage une seule fois à l'initialisation
    const initialMessages = this.loadMessagesFromStorage();
    this.messagesSubject = new BehaviorSubject<ContactMessage[]>(initialMessages);
    console.log('[ContactService] Initialisé. Messages chargés depuis localStorage:', initialMessages.length);
  }

  /**
   * Charge les messages depuis localStorage et les prépare.
   * @returns ContactMessage[] - Le tableau des messages.
   */
  private loadMessagesFromStorage(): ContactMessage[] {
    // Vérifier si localStorage est disponible (utile pour SSR ou environnements spécifiques)
    if (typeof localStorage === 'undefined') {
        console.warn('[ContactService] localStorage n\'est pas disponible.');
        return [];
    }

    try {
      const rawData = localStorage.getItem(this.STORAGE_KEY);
      if (!rawData) {
        return []; // Pas de données stockées
      }

      const messagesRaw: any[] = JSON.parse(rawData);

      // Mapper les données brutes vers notre interface et convertir les dates strings en objets Date
      const messages = messagesRaw
        .map(msg => ({
          id: msg.id ?? Date.parse(msg.date), // Essayer d'utiliser l'ID s'il existe, sinon fallback (peut nécessiter ajustement)
          name: msg.name || '',
          email: msg.email || '',
          subject: msg.subject || 'N/A', // Gérer le cas où le sujet n'existe pas
          message: msg.message || '',
          date: new Date(msg.date) // Convertir la string ISO en objet Date
        }))
        // Filtrer les messages invalides (par ex. si la date n'a pas pu être parsée)
        .filter(msg => !isNaN(msg.date.getTime()) && msg.id);

      // Trier les messages par date (du plus récent au plus ancien)
      messages.sort((a, b) => b.date.getTime() - a.date.getTime());

      return messages;

    } catch (error) {
      console.error('[ContactService] Erreur lors de la lecture/parsing de localStorage:', error);
      // En cas d'erreur de parsing (données corrompues?), vider ou ignorer
      // localStorage.removeItem(this.STORAGE_KEY); // Optionnel: supprimer les données corrompues
      return []; // Retourner un tableau vide en cas d'erreur
    }
  }

  /**
   * Sauvegarde la liste des messages dans localStorage et notifie les abonnés.
   * @param messages - Le tableau des messages à sauvegarder.
   */
  private saveMessagesToStorage(messages: ContactMessage[]): void {
     if (typeof localStorage === 'undefined') {
        return; // Ne rien faire si localStorage n'est pas dispo
     }

    try {
      // Préparer les données pour la sauvegarde (JSON.stringify gère bien les dates en ISO string)
      const dataToSave = JSON.stringify(messages);
      localStorage.setItem(this.STORAGE_KEY, dataToSave);
      // Émettre la nouvelle liste mise à jour via le BehaviorSubject
      this.messagesSubject.next([...messages]); // Émettre une nouvelle référence de tableau
      console.log('[ContactService] Messages sauvegardés et Subject mis à jour.');
    } catch (error) {
      console.error('[ContactService] Erreur lors de la sauvegarde dans localStorage:', error);
    }
  }

  /**
   * Récupère un Observable de la liste des messages.
   * Les composants s'abonnant recevront la liste actuelle et les futures mises à jour.
   * @returns Observable<ContactMessage[]>
   */
  getMessages(): Observable<ContactMessage[]> {
    // Retourne l'observable public dérivé du BehaviorSubject
    return this.messagesSubject.asObservable();
  }

  /**
   * Ajoute un nouveau message à la liste et sauvegarde.
   * Cette méthode devrait être appelée par le ContactComponent.
   * @param name
   * @param email
   * @param subject
   * @param message
   */
  addMessage(name: string, email: string, subject: string, message: string): void {
    const newMessage: ContactMessage = {
      id: Date.now(), // Utiliser le timestamp comme ID simple et unique
      name,
      email,
      subject,
      message,
      date: new Date() // Date de création
    };

    // Récupérer la liste actuelle depuis le Subject
    const currentMessages = this.messagesSubject.getValue();
    // Ajouter le nouveau message au début de la liste
    const updatedMessages = [newMessage, ...currentMessages];

    // Sauvegarder la nouvelle liste (localStorage + notification Subject)
    this.saveMessagesToStorage(updatedMessages);
    console.log('[ContactService] Nouveau message ajouté:', newMessage.id);
  }

  /**
   * Supprime un message basé sur son ID.
   * @param messageId - L'ID du message à supprimer.
   */
  deleteMessage(messageId: number): void {
    console.log(`[ContactService] Tentative de suppression du message ID: ${messageId}`);
    const currentMessages = this.messagesSubject.getValue();
    const initialLength = currentMessages.length;

    // Filtrer la liste pour exclure le message avec l'ID donné
    const updatedMessages = currentMessages.filter(msg => msg.id !== messageId);

    // Vérifier si un message a réellement été supprimé
    if (updatedMessages.length < initialLength) {
      // Sauvegarder la liste mise à jour (localStorage + notification Subject)
      this.saveMessagesToStorage(updatedMessages);
      console.log(`[ContactService] Message ID: ${messageId} supprimé avec succès.`);
    } else {
      console.warn(`[ContactService] Aucun message trouvé avec l'ID ${messageId} pour suppression.`);
    }
  }
}