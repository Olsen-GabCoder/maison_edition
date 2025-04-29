// src/app/admin/pages/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core'; // OnDestroy ajouté
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, of, Subject } from 'rxjs'; // Subject ajouté
import { map, tap, takeUntil } from 'rxjs/operators'; // takeUntil ajouté

import { BookService } from '../../../core/services/book.service';       // Vérifiez chemin
import { ContactService } from '../../../core/services/contact.service'; // Vérifiez chemin et existence
import { OrderService } from '../../../core/services/order.service';     // Vérifiez chemin

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy { // Implémente OnDestroy

  private bookService = inject(BookService);
  private contactService = inject(ContactService); // Assurez-vous qu'il a une méthode getMessages() qui retourne un Observable<Message[]>
  private orderService = inject(OrderService);
  private destroy$ = new Subject<void>(); // Pour la désinscription

  bookCount$: Observable<number> = of(0);
  messageCount$: Observable<number> = of(0);
  orderCount$: Observable<number> = of(0);

  ngOnInit(): void {
    console.log('[DashboardComponent] ngOnInit: Initialisation...');

    // Compteur Livres
    this.bookCount$ = this.bookService.books$.pipe(
      takeUntil(this.destroy$), // Se désabonner proprement
      map(books => books.length),
      tap(count => console.log(`[DashboardComponent] Nombre de livres (via books$): ${count}`))
    );

    // Compteur Messages
    this.messageCount$ = this.contactService.getMessages().pipe(
      takeUntil(this.destroy$),
      map(messages => messages.length),
      tap(count => console.log(`[DashboardComponent] Nombre de messages : ${count}`))
    );

    // Compteur Commandes
    this.orderCount$ = this.orderService.getOrders().pipe( // S'abonne à getOrders()
      takeUntil(this.destroy$),
      tap(orders => {
           // Log la réception de la liste avant de mapper
           console.log(`[DashboardComponent] TAP (Réception Observable): Liste commandes reçue pour comptage. Nombre: ${orders.length}`);
      }),
      map(orders => orders.length), // Calcule la longueur
      tap(count => console.log(`[DashboardComponent] Nombre de commandes calculé : ${count}`))
    );

    console.log('[DashboardComponent] ngOnInit: Observables configurés.');
  }

  ngOnDestroy(): void {
      console.log('[DashboardComponent] ngOnDestroy: Nettoyage.');
      this.destroy$.next();
      this.destroy$.complete();
  }
}