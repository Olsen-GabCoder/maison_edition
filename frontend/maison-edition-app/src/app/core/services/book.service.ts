// src/app/core/services/book.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Book } from '../../models/book.model';

// Clé unique pour le stockage des livres dans localStorage
const BOOKS_STORAGE_KEY = 'editAppBooks';

@Injectable({
  providedIn: 'root'
})
export class BookService {

  // BehaviorSubject initialisé avec les données persistantes ou les mocks initiaux
  private booksSubject = new BehaviorSubject<Book[]>(this.loadInitialBooks());
  public books$: Observable<Book[]> = this.booksSubject.asObservable();

  // Garder une trace du prochain ID (simpliste, mieux géré par un backend)
  private nextId: number;

  constructor() {
    // Initialiser nextId basé sur les livres chargés
    const currentBooks = this.booksSubject.getValue();
    this.nextId = this.calculateNextId(currentBooks);
    console.log(`[BookService] Initialisé. Source de données: ${this.isLocalStorageAvailable() ? `localStorage ('${BOOKS_STORAGE_KEY}')` : 'mémoire'}. Prochain ID: ${this.nextId}`);
  }

  /**
   * Vérifie si localStorage est disponible dans l'environnement actuel.
   */
  private isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && window.localStorage != null;
    } catch (e) {
      return false;
    }
  }

  /**
   * Charge les livres depuis localStorage si disponible, sinon utilise les mocks.
   */
  private loadInitialBooks(): Book[] {
    console.log(`[BookService] loadInitialBooks: Tentative de lecture depuis localStorage ('${BOOKS_STORAGE_KEY}').`);
    if (this.isLocalStorageAvailable()) {
      try {
        const storedBooks = localStorage.getItem(BOOKS_STORAGE_KEY);
        if (storedBooks) {
          const books: Book[] = JSON.parse(storedBooks);
          if (Array.isArray(books)) {
            console.log(`[BookService] loadInitialBooks: ${books.length} livres chargés depuis localStorage.`);
            return books;
          } else {
            console.warn('[BookService] loadInitialBooks: Données invalides trouvées dans localStorage. Utilisation des mocks.');
            localStorage.removeItem(BOOKS_STORAGE_KEY); // Nettoyer les données invalides
            return this.getInitialMockBooks();
          }
        } else {
          console.log('[BookService] loadInitialBooks: localStorage vide. Utilisation des mocks initiaux.');
          const mockBooks = this.getInitialMockBooks();
          this.saveBooksToStorage(mockBooks); // Sauvegarder les mocks initiaux pour la première fois
          return mockBooks;
        }
      } catch (e) {
        console.error('[BookService] Erreur lecture/parsing localStorage:', e);
        return this.getInitialMockBooks();
      }
    } else {
      console.log('[BookService] loadInitialBooks: localStorage non disponible. Utilisation des mocks initiaux.');
      return this.getInitialMockBooks();
    }
  }

  /** Retourne le tableau des livres mock initiaux */
  private getInitialMockBooks(): Book[] {
    return [
      { id: 1, title: 'Le Seigneur des Anneaux', author: 'J.R.R. Tolkien', coverUrl: 'assets/images/sda.jpg', summary: 'Un grand classique...', price: 29.95, category: 'Fantasy' },
      { id: 2, title: 'Fondation', author: 'Isaac Asimov', coverUrl: 'assets/images/fondation.jpg', summary: 'La chute de l\'Empire...', price: 19.90, category: 'Science-Fiction' },
      { id: 3, title: 'Dune', author: 'Frank Herbert', coverUrl: 'assets/images/dune.jpg', summary: 'L\'épice doit couler...', price: 22.50, category: 'Science-Fiction' }
      // Ajoutez d'autres livres mock si nécessaire
    ];
  }

  /** Sauvegarde la liste complète des livres dans localStorage si disponible */
  private saveBooksToStorage(books: Book[]): void {
    if (this.isLocalStorageAvailable()) {
      try {
        const sortedBooks = [...books].sort((a, b) => a.id - b.id);
        localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(sortedBooks));
        console.log(`[BookService] saveBooksToStorage: ${sortedBooks.length} livres sauvegardés ('${BOOKS_STORAGE_KEY}').`);
      } catch (e) {
        console.error('[BookService] saveBooksToStorage: Erreur écriture localStorage:', e);
        // Gérer l'erreur (par exemple, notifier l'utilisateur que la sauvegarde a échoué)
      }
    } else {
      console.warn('[BookService] saveBooksToStorage: localStorage non disponible. Les données ne seront pas persistées.');
      // Ici, tu pourrais implémenter une autre stratégie de persistance si nécessaire
    }
  }

  /** Calcule le prochain ID disponible (méthode simple pour mocks) */
  private calculateNextId(books: Book[]): number {
    return books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1;
  }

  // --- Méthodes Publiques ---

  getBooks(): Observable<Book[]> {
    console.log('[BookService] getBooks: Retourne observable books$.');
    return this.books$;
  }

  getBookById(id: number): Observable<Book | undefined> {
    console.log(`[BookService] Tentative de récupération du livre ID: ${id}`);
    return this.books$.pipe(
      map(books => books.find(book => book.id === id)),
      tap(foundBook => console.log(`[BookService] Livre trouvé pour ID ${id}:`, foundBook ? 'Oui' : 'Non'))
    );
  }

  addBook(newBookData: Omit<Book, 'id'>): Observable<Book> {
    console.log('[BookService] Tentative ajout livre:', newBookData.title);
    const currentBooks = this.booksSubject.getValue();
    const newBook: Book = { ...newBookData, id: this.nextId++ }; // Assigner et incrémenter nextId
    const updatedBooks = [...currentBooks, newBook];

    this.booksSubject.next(updatedBooks); // Mettre à jour le sujet en mémoire
    this.saveBooksToStorage(updatedBooks); // <-- SAUVEGARDER DANS LOCALSTORAGE

    console.log('[BookService] Livre ajouté ID:', newBook.id);
    return of(newBook);
  }

  updateBook(updatedBookData: Book): Observable<Book | undefined> {
    console.log(`[BookService] Tentative de mise à jour du livre ID: ${updatedBookData.id}`);
    const currentBooks = this.booksSubject.getValue();
    const indexToUpdate = currentBooks.findIndex(book => book.id === updatedBookData.id);

    if (indexToUpdate !== -1) {
      const updatedBooks = [
        ...currentBooks.slice(0, indexToUpdate),
        updatedBookData, // Le livre mis à jour
        ...currentBooks.slice(indexToUpdate + 1)
      ];

      this.booksSubject.next(updatedBooks); // Mettre à jour le sujet
      this.saveBooksToStorage(updatedBooks); // <-- SAUVEGARDER DANS LOCALSTORAGE

      console.log(`[BookService] Livre ID: ${updatedBookData.id} mis à jour.`);
      return of(updatedBookData);
    } else {
      console.warn(`[BookService] Livre ID: ${updatedBookData.id} non trouvé pour mise à jour.`);
      return of(undefined);
    }
  }

  deleteBook(id: number): Observable<boolean> {
    console.log(`[BookService] Tentative de suppression livre ID: ${id}`);
    const currentBooks = this.booksSubject.getValue();
    const updatedBooks = currentBooks.filter(book => book.id !== id);

    if (updatedBooks.length < currentBooks.length) {
      this.booksSubject.next(updatedBooks); // Mettre à jour le sujet
      this.saveBooksToStorage(updatedBooks); // <-- SAUVEGARDER DANS LOCALSTORAGE

      console.log(`[BookService] Livre ID: ${id} supprimé.`);
      return of(true);
    } else {
      console.warn(`[BookService] Livre ID: ${id} non trouvé pour suppression.`);
      return of(false);
    }
  }
}