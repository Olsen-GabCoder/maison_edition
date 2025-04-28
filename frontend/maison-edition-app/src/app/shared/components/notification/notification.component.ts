// src/app/shared/components/notification/notification.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations'; // Pour les animations
import { NotificationService, Notification } from '../../../core/services/notification.service'; // Importez le service et l'interface

@Component({
  selector: 'app-notification', // Sélecteur à utiliser dans app.component.html
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  animations: [ // Définition d'une animation simple (fade in/out)
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, transform: 'translateY(-20px)' })), // État initial (caché)
      state('*', style({ opacity: 1, transform: 'translateY(0)' })),          // État visible
      transition('void <=> *', animate('300ms ease-in-out')) // Transition entre les états
    ])
  ]
})
export class NotificationComponent implements OnInit, OnDestroy {

  private notificationService = inject(NotificationService);
  private notificationSubscription: Subscription | undefined;

  notifications: Notification[] = []; // Tableau pour stocker les notifications actives

  ngOnInit(): void {
    this.notificationSubscription = this.notificationService.notification$
      .subscribe(notification => {
        this.addNotification(notification);
      });
  }

  ngOnDestroy(): void {
    this.notificationSubscription?.unsubscribe(); // Nettoyer l'abonnement
  }

  /** Ajoute une notification à la liste et programme sa suppression */
  private addNotification(notification: Notification): void {
    this.notifications.push(notification);

    // Si une durée est spécifiée, programmer la suppression
    if (notification.duration) {
      setTimeout(() => this.removeNotification(notification), notification.duration);
    }
  }

  /** Supprime une notification de la liste (pour la faire disparaître) */
  removeNotification(notificationToRemove: Notification): void {
    this.notifications = this.notifications.filter(n => n !== notificationToRemove);
  }

  /** Retourne la classe CSS appropriée basée sur le type de notification */
  getCssClass(notification: Notification): string {
    switch (notification.type) {
      case 'success': return 'alert-success';
      case 'error': return 'alert-danger';
      case 'info': return 'alert-info';
      case 'warning': return 'alert-warning';
      default: return 'alert-secondary'; // Style par défaut
    }
  }

    /** Retourne l'icône Font Awesome appropriée basée sur le type */
    getIconClass(notification: Notification): string {
     switch (notification.type) {
       case 'success': return 'fas fa-check-circle';
       case 'error': return 'fas fa-times-circle';
       case 'info': return 'fas fa-info-circle';
       case 'warning': return 'fas fa-exclamation-triangle';
       default: return 'fas fa-bell';
     }
    }
}