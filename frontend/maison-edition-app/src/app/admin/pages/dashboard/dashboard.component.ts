// src/app/admin/pages/dashboard/dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { BookService } from '../../../core/services/book.service';
import { ContactService } from '../../../core/services/contact.service';
import { OrderService } from '../../../core/services/order.service'; // <<<=== Importer OrderService

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  // Injecter les services nécessaires
  private bookService = inject(BookService);
  private contactService = inject(ContactService);
  private orderService = inject(OrderService); // <<<=== Injecter OrderService

  // Observables pour les compteurs, initialisés à 0
  bookCount$: Observable<number> = of(0);
  messageCount$: Observable<number> = of(0);
  orderCount$: Observable<number> = of(0); // <<<=== Ajouter observable pour le compteur de commandes

  ngOnInit(): void {
    console.log('[DashboardComponent] Initialisation...');

    // Observer et compter les livres
    this.bookCount$ = this.bookService.books$.pipe(
      map(books => books.length),
      tap(count => console.log(`[DashboardComponent] Nombre de livres : ${count}`))
    );

    // Observer et compter les messages
    this.messageCount$ = this.contactService.getMessages().pipe(
      map(messages => messages.length),
      tap(count => console.log(`[DashboardComponent] Nombre de messages : ${count}`))
    );

    // <<<=== Observer et compter les commandes ===>>>
    this.orderCount$ = this.orderService.getOrders().pipe(
      map(orders => orders.length),
      tap(count => console.log(`[DashboardComponent] Nombre de commandes : ${count}`))
    );
    // <<<=== Fin ajout commandes ===>>>

    console.log('[DashboardComponent] Observables configurés.');
  }
}