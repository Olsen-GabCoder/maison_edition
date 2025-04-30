import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { renderModule } from '@angular/platform-server';
// Assurez-vous que ce chemin est correct et que Book a bien les propriétés utilisées dans le HTML
import { Book } from '../../models/book.model';
import { BookService } from '../../core/services/book.service';
import { RouterLink } from '@angular/router'; // RouterLink pour [routerLink]

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink], // CommonModule pour *ngIf, | async; RouterLink pour [routerLink]
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  // Injection de service
  private bookService = inject(BookService);

  // Propriétés pour les données et l'état d'UI
  books$: Observable<Book[]> = of([]); // Observable pour la liste des livres
  isLoading: boolean = true;         // Indicateur de chargement
  errorMessage: string | null = null;  // Message d'erreur potentiel

  // Constructeur vide car on utilise inject()
  constructor() { }

  ngOnInit(): void {
    console.log('[HomeComponent] ngOnInit: Initialisation...');
    this.loadBooks(); // Charger les livres au démarrage
  }

  /**
   * Charge la liste des livres depuis le BookService.
   * Gère les états de chargement et d'erreur.
   */
  loadBooks(): void {
    this.isLoading = true;      // Indiquer le début du chargement
    this.errorMessage = null;   // Réinitialiser les erreurs précédentes
    console.log('[HomeComponent] loadBooks: Chargement des livres depuis BookService...');

    this.books$ = this.bookService.getBooks().pipe(
      // Utiliser tap pour exécuter des effets de bord sans modifier les données
      tap((books) => {
        this.isLoading = false; // Indiquer la fin du chargement (succès)
        console.log(`[HomeComponent] loadBooks (tap): ${books.length} livres chargés.`);
        // Optionnel: log si aucun livre n'est retourné
        if (books.length === 0) {
            console.log('[HomeComponent] loadBooks (tap): Aucun livre reçu du service.');
        }
      }),
      // Utiliser catchError pour intercepter les erreurs de l'observable
      catchError(error => {
        this.isLoading = false; // Indiquer la fin du chargement (erreur)
        console.error('[HomeComponent] loadBooks (catchError): Erreur lors du chargement des livres:', error);
        // Définir un message d'erreur pour l'utilisateur
        this.errorMessage = 'Impossible de charger les livres pour le moment. Veuillez réessayer plus tard.';
        // Retourner un observable avec un tableau vide pour que le reste de l'UI ne casse pas
        return of([]);
      })
    );
  }

  // La méthode buyBook() a été retirée car la navigation
  // est gérée par [routerLink] dans le template HTML.

}