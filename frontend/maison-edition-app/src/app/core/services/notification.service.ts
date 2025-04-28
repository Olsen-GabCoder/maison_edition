// src/app/core/services/notification.service.ts
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs'; // Utiliser Subject pour pousser les messages

// Interface pour définir la structure d'une notification
export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning'; // Types de notifications
  duration?: number; // Durée d'affichage en ms (optionnel)
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  // Subject pour émettre les nouvelles notifications
  private notificationSubject = new Subject<Notification>();

  // Observable auquel les composants peuvent s'abonner pour recevoir les notifications
  public notification$: Observable<Notification> = this.notificationSubject.asObservable();

  constructor() { }

  /**
   * Affiche une notification de succès.
   * @param message Le message à afficher.
   * @param duration Durée en ms (par défaut 5000ms).
   */
  showSuccess(message: string, duration: number = 5000): void {
    this.show({ message, type: 'success', duration });
  }

  /**
   * Affiche une notification d'erreur.
   * @param message Le message à afficher.
   * @param duration Durée en ms (par défaut 7000ms).
   */
  showError(message: string, duration: number = 7000): void {
    this.show({ message, type: 'error', duration });
  }

   /**
   * Affiche une notification d'information.
   * @param message Le message à afficher.
   * @param duration Durée en ms (par défaut 5000ms).
   */
  showInfo(message: string, duration: number = 5000): void {
    this.show({ message, type: 'info', duration });
  }

   /**
   * Affiche une notification d'avertissement.
   * @param message Le message à afficher.
   * @param duration Durée en ms (par défaut 6000ms).
   */
  showWarning(message: string, duration: number = 6000): void {
    this.show({ message, type: 'warning', duration });
  }


  /**
   * Méthode privée pour pousser la notification via le Subject.
   * @param notification L'objet Notification à émettre.
   */
  private show(notification: Notification): void {
    console.log(`[NotificationService] Showing ${notification.type}: ${notification.message}`);
    this.notificationSubject.next(notification);
  }
}