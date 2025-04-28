// src/app/admin/pages/book-management/book-management.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith, switchMap, tap } from 'rxjs/operators';
import { Book } from '../../../models/book.model';
import { BookService } from '../../../core/services/book.service';

@Component({
  selector: 'app-book-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-management.component.html',
  styleUrls: ['./book-management.component.scss']
})
export class BookManagementComponent implements OnInit {
  
  private bookService = inject(BookService);
  private router = inject(Router);
  
  // Observable pour les livres avec le pipe async
  books$!: Observable<Book[]>;
  
  // État de chargement
  isLoading = true;
  
  // Pour utiliser Math dans le template
  Math = Math;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalBooks = 0;
  paginatedBooks: Book[] = [];
  
  // Tri
  sortField: keyof Book = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Sujets pour déclencher les mises à jour
  private refreshSubject = new BehaviorSubject<boolean>(true);
  private sortSubject = new BehaviorSubject<{field: keyof Book, direction: 'asc' | 'desc'}>({field: 'id', direction: 'asc'});
  
  ngOnInit(): void {
    console.log('[BookManagementComponent] ngOnInit: Initialisation.');
    
    // Configurer l'observable pour réagir aux changements de tri et aux rafraîchissements
    this.books$ = combineLatest([
      this.refreshSubject.asObservable(),
      this.sortSubject.asObservable()
    ]).pipe(
      tap(() => this.isLoading = true),
      switchMap(([_, sort]) => this.bookService.books$.pipe(
        map(books => this.sortBooks(books, sort.field, sort.direction))
      )),
      tap(books => {
        this.totalBooks = books.length;
        this.updatePaginatedBooks(books);
        this.isLoading = false;
      })
    );
  }

  // Méthodes de pagination
  get totalPages(): number {
    return Math.ceil(this.totalBooks / this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.books$.subscribe(books => this.updatePaginatedBooks(books));
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1; // Réinitialiser à la première page
    this.books$.subscribe(books => this.updatePaginatedBooks(books));
  }

  paginationRange(): number[] {
    const range = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    
    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }
    
    return range;
  }

  updatePaginatedBooks(books: Book[]): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, books.length);
    this.paginatedBooks = books.slice(startIndex, endIndex);
  }

  // Méthode pour trier les livres
  sortBy(field: keyof Book): void {
    if (this.sortField === field) {
      // Inverser la direction si on clique sur le même champ
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    this.sortSubject.next({ field: this.sortField, direction: this.sortDirection });
  }

  private sortBooks(books: Book[], field: keyof Book, direction: 'asc' | 'desc'): Book[] {
    return [...books].sort((a, b) => {
      let comparison = 0;
      
      // Gérer différemment selon le type de champ
      if (field === 'id' || field === 'price') {
        // Trier numériquement
        comparison = Number(a[field]) - Number(b[field]);
      } else {
        // Trier alphabétiquement
        const valA = String(a[field]).toLowerCase();
        const valB = String(b[field]).toLowerCase();
        comparison = valA.localeCompare(valB);
      }
      
      // Inverser si direction est descendante
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  // Gestion des erreurs d'image
  onImageError(event: any): void {
    event.target.style.display = 'none';
    event.target.nextElementSibling.style.display = 'flex';
  }

  // Méthodes existantes modifiées
  deleteBook(bookId: number, bookTitle: string): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le livre "${bookTitle}" (ID: ${bookId}) ?`)) {
      this.bookService.deleteBook(bookId).subscribe({
        next: (success) => {
          if (success) { 
            alert(`Le livre "${bookTitle}" a été supprimé.`);
            this.refreshSubject.next(true); // Rafraîchir la liste après suppression
          } else { 
            alert(`Erreur: Impossible de trouver le livre avec l'ID ${bookId} pour le supprimer.`); 
          }
        },
        error: (err) => { 
          alert('Une erreur technique est survenue pendant la suppression.'); 
        }
      });
    }
  }

  /** Navigue vers la page d'édition du livre spécifié */
  editBook(bookId: number): void {
    console.log(`[BookManagementComponent] Clic sur Modifier pour ID: ${bookId}, navigation vers /admin/books/edit/${bookId}`);
    this.router.navigate(['/admin/books/edit', bookId]);
  }
    
  addBook(): void {
    console.log(`[BookManagementComponent] Clic sur Ajouter, navigation vers /admin/books/add`);
    this.router.navigate(['/admin/books/add']);
  }
}