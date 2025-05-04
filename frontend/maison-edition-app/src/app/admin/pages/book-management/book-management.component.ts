// src/app/admin/pages/book-management/book-management.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // RouterLink est là si jamais utilisé dans le template
import { FormsModule } from '@angular/forms'; // Nécessaire pour [(ngModel)]
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, startWith, switchMap, tap, catchError } from 'rxjs/operators';
import { Book } from '../../../models/book.model';
import { BookService } from '../../../core/services/book.service';
import { BookFilterPipe } from '../pipes/book-filter.pipe'; // Importez le pipe

@Component({
  selector: 'app-book-management',
  standalone: true,
  // Assurez-vous d'importer CommonModule et FormsModule ici
  imports: [CommonModule, FormsModule],
  templateUrl: './book-management.component.html',
  styleUrls: ['./book-management.component.scss']
})
export class BookManagementComponent implements OnInit {
  searchTerm = '';
  private bookService = inject(BookService);
  private router = inject(Router);
  private searchTerm$ = new BehaviorSubject<string>('');

  // Observable pour les livres avec le pipe async
  books$!: Observable<Book[]>;

  // État de chargement
  isLoading = true;
  errorMessage: string | null = null; // Pour les erreurs de chargement

  // Pour utiliser Math dans le template
  Math = Math;

  // Pagination
  currentPage = 1;
  pageSize = 10; // Valeur par défaut
  totalBooks = 0;
  paginatedBooks: Book[] = [];

  // Tri
  sortField: keyof Book = 'id'; // Champ de tri par défaut
  sortDirection: 'asc' | 'desc' = 'asc'; // Direction par défaut

  // Sujets pour déclencher les mises à jour
  private refreshSubject = new BehaviorSubject<boolean>(true); // Pour rafraîchir manuellement si besoin
  private sortSubject = new BehaviorSubject<{ field: keyof Book, direction: 'asc' | 'desc' }>({ field: this.sortField, direction: this.sortDirection });

  // === CORRECTION: Instancier le pipe pour l'utiliser dans le TS ===
  private bookFilterPipe = new BookFilterPipe();
  // ================================================================

  ngOnInit(): void {
    console.log('[BookManagement] ngOnInit');
    this.books$ = combineLatest([
      this.refreshSubject.asObservable(), // Écoute les demandes de rafraîchissement
      this.sortSubject.asObservable(),    // Écoute les changements de tri
      this.searchTerm$.asObservable()      // Écoute les changements de recherche
    ]).pipe(
      tap(() => {
         console.log('[BookManagement] CombineLatest trigger: Setting loading true');
         this.isLoading = true; // Mettre en chargement au début de chaque cycle
         this.errorMessage = null; // Réinitialiser l'erreur
      }),
      switchMap(([_, sort, searchTerm]) => // Le premier élément (refresh) n'est pas utilisé directement ici
        this.bookService.books$.pipe( // Récupère l'observable des livres du service
          map(books => {
            console.log(`[BookManagement] Books received from service: ${books.length}`);
            // 1. Filtrer
            const filtered = this.bookFilterPipe.transform(books, searchTerm); // Utilisation correcte
            console.log(`[BookManagement] Books after filter ('${searchTerm}'): ${filtered.length}`);
            // 2. Trier
            const sorted = this.sortBooks(filtered, sort.field, sort.direction);
             console.log(`[BookManagement] Books after sort ('${sort.field}', '${sort.direction}'): ${sorted.length}`);
            return sorted; // Retourner les livres filtrés ET triés
          }),
           catchError(err => { // Gérer les erreurs venant de bookService.books$
                console.error('[BookManagement] Error fetching books from service:', err);
                this.errorMessage = "Erreur lors de la récupération des livres.";
                this.isLoading = false; // Arrêter le chargement en cas d'erreur
                return of([]); // Retourner un tableau vide pour éviter de casser la suite
           })
        )
      ),
      tap(sortedAndFilteredBooks => { // Ce tap s'exécute après le map et switchMap
        this.totalBooks = sortedAndFilteredBooks.length;
        this.updatePaginatedBooks(sortedAndFilteredBooks); // Mettre à jour la pagination
        this.isLoading = false; // Marquer comme chargé
        console.log(`[BookManagement] Processing complete. Total: ${this.totalBooks}, Paginated: ${this.paginatedBooks.length}. Loading false.`);
      })
    );
  }

  onSearchTermChanged(term: string): void {
    this.searchTerm = term; // Met à jour la propriété pour [(ngModel)]
    this.searchTerm$.next(term); // Pousse la nouvelle valeur dans l'observable
    this.currentPage = 1; // Revenir à la première page lors d'une nouvelle recherche
     console.log(`[BookManagement] Search term changed: '${term}', Page reset to 1.`);
  }

  // --- Méthodes de pagination (logique semble correcte) ---
  get totalPages(): number {
    return Math.ceil(this.totalBooks / this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      // Pas besoin de subscribe ici, le tap dans l'observable principal s'en charge
      // this.books$.pipe(take(1)).subscribe(books => this.updatePaginatedBooks(books));
      this.refreshSubject.next(true); // Ou simplement déclencher une mise à jour
      console.log(`[BookManagement] Navigating to page: ${page}`);
    }
  }

  onPageSizeChange(): void {
     console.log(`[BookManagement] Page size changed to: ${this.pageSize}`);
    this.currentPage = 1; // Réinitialiser à la première page
    // Le changement de pageSize n'est pas directement dans l'observable combineLatest,
    // mais updatePaginatedBooks sera appelé dans le tap final.
    // On peut forcer une réévaluation si nécessaire :
    this.refreshSubject.next(true);
  }

  paginationRange(): number[] {
    // Logique semble correcte
    const range = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) { range.push(i); }
    return range;
  }

  updatePaginatedBooks(allSortedBooks: Book[]): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    // Correction : utiliser Math.min pour éviter un endIndex > totalBooks
    const endIndex = Math.min(startIndex + Number(this.pageSize), this.totalBooks);
    this.paginatedBooks = allSortedBooks.slice(startIndex, endIndex);
     console.log(`[BookManagement] Updating pagination: Page ${this.currentPage}, Size ${this.pageSize}. Displaying indices ${startIndex}-${endIndex-1} from ${this.totalBooks} total.`);
  }

  // --- Méthode de tri (logique semble correcte) ---
  sortBy(field: keyof Book): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    console.log(`[BookManagement] Sorting by: ${this.sortField}, Direction: ${this.sortDirection}`);
    this.sortSubject.next({ field: this.sortField, direction: this.sortDirection });
    this.currentPage = 1; // Revenir à la page 1 lors du tri
  }

  private sortBooks(books: Book[], field: keyof Book, direction: 'asc' | 'desc'): Book[] {
     // Logique semble correcte (gestion nombre/string)
    return [...books].sort((a, b) => {
      let comparison = 0;
      const valA = a[field];
      const valB = b[field];

      if (field === 'id' || field === 'price') {
        comparison = Number(valA) - Number(valB);
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB, undefined, { sensitivity: 'base' });
      } else {
         // Fallback simple si types mixtes ou non prévus
         comparison = String(valA).localeCompare(String(valB), undefined, { sensitivity: 'base' });
      }
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  // --- Gestion des erreurs d'image (OK) ---
  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none'; // Cache l'image cassée
    const placeholder = imgElement.nextElementSibling as HTMLElement;
    if (placeholder && placeholder.classList.contains('no-cover')) {
      placeholder.style.display = 'flex'; // Affiche le placeholder
    }
  }

  // --- Actions (delete, edit, add - OK) ---
  deleteBook(bookId: number, bookTitle: string): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le livre "${bookTitle}" (ID: ${bookId}) ?`)) {
      this.bookService.deleteBook(bookId).subscribe({
        next: (success) => {
          if (success) {
            alert(`Le livre "${bookTitle}" a été supprimé.`);
            this.refreshSubject.next(true); // Rafraîchir la liste
          } else {
            alert(`Erreur: Impossible de trouver le livre avec l'ID ${bookId}.`);
          }
        },
        error: (err) => {
          alert(`Une erreur technique est survenue : ${err.message || 'Inconnue'}`);
        }
      });
    }
  }

  editBook(bookId: number): void {
    this.router.navigate(['/admin/books/edit', bookId]);
  }

  addBook(): void {
    this.router.navigate(['/admin/books/add']);
  }
}