import { Component, OnInit, inject } from '@angular/core'; // inject ajouté
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators'; // catchError et tap ajoutés
import { Book } from '../../models/book.model';
import { BookService } from '../../core/services/book.service';
import { RouterLink } from '@angular/router'; // RouterLink est déjà là

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink], // RouterLink est bien importé
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  // Injection de service plus moderne
  private bookService = inject(BookService);

  books$: Observable<Book[]> = of([]);
  isLoading: boolean = true; // Pour l'indicateur de chargement
  errorMessage: string | null = null; // Pour afficher les erreurs

  // Le constructeur peut souvent être vide si on utilise inject()
  constructor() { }

  ngOnInit(): void {
    console.log('HomeComponent: Initialisation...');
    this.loadBooks(); // Appeler la méthode de chargement
  }

  loadBooks(): void {
    this.isLoading = true; // Début du chargement
    this.errorMessage = null; // Réinitialiser l'erreur
    console.log('HomeComponent: Chargement des livres depuis BookService...');
    this.books$ = this.bookService.getBooks().pipe(
      tap((books) => {
        this.isLoading = false; // Fin du chargement (succès)
        console.log(`HomeComponent: ${books.length} livres chargés.`);
        if (books.length === 0) {
            console.log('HomeComponent: Aucuns livres reçus du service.');
        }
      }),
      catchError(error => {
        this.isLoading = false; // Fin du chargement (erreur)
        console.error('HomeComponent: Erreur lors du chargement des livres:', error);
        this.errorMessage = 'Impossible de charger les livres pour le moment. Veuillez réessayer plus tard.';
        return of([]); // Retourner un tableau vide pour éviter de casser l'UI
      })
    );
  }

  // === SUPPRESSION DE LA MÉTHODE buyBook ===
  // Cette méthode n'est plus nécessaire car la navigation
  // est gérée directement par [routerLink] dans le template.
  // buyBook(book: Book): void {
  //   console.log('Clic sur Acheter pour:', book.title);
  //   // La logique de navigation est maintenant dans le HTML
  // }
  // === FIN SUPPRESSION ===
}