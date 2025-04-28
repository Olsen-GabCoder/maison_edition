// src/app/core/services/book.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Book } from '../../models/book.model';

@Injectable({
  providedIn: 'root'
})
export class BookService {

  private booksSubject = new BehaviorSubject<Book[]>([
    { id: 1, title: 'Le Seigneur des Anneaux', author: 'J.R.R. Tolkien', coverUrl: 'assets/images/sda.jpg', summary: 'Un grand classique...', price: 29.95, category: 'Fantasy' },
    { id: 2, title: 'Fondation', author: 'Isaac Asimov', coverUrl: 'assets/images/fondation.jpg', summary: 'La chute de l\'Empire...', price: 19.90, category: 'Science-Fiction' },
    { id: 3, title: 'Dune', author: 'Frank Herbert', coverUrl: 'assets/images/dune.jpg', summary: 'L\'épice doit couler...', price: 22.50, category: 'Science-Fiction' }
  ]);
  public books$: Observable<Book[]> = this.booksSubject.asObservable();
  private nextId = 4;

  constructor() { }

  getBooks(): Observable<Book[]> {
    console.log('[BookService] getBooks: Retourne observable books$.');
    return this.books$;
  }

  /**
   * Récupère un livre spécifique par son ID.
   * @param id - L'ID numérique du livre à récupérer.
   * @returns Observable<Book | undefined> - Un observable émettant le livre trouvé ou undefined.
   */
  getBookById(id: number): Observable<Book | undefined> {
    console.log(`[BookService] Tentative de récupération du livre ID: ${id}`);
    // On prend la valeur actuelle du sujet
    const currentBooks = this.booksSubject.getValue();
    // On cherche le livre avec l'ID correspondant
    const foundBook = currentBooks.find(book => book.id === id);
    console.log(`[BookService] Livre trouvé pour ID ${id}:`, foundBook);
    // On retourne le livre trouvé (ou undefined) dans un Observable
    return of(foundBook);
    // Dans une vraie API: return this.http.get<Book>(`/api/books/${id}`);
  }

  deleteBook(id: number): Observable<boolean> {
    console.log(`[BookService] Tentative de suppression livre ID: ${id}`);
    const currentBooks = this.booksSubject.getValue();
    const updatedBooks = currentBooks.filter(book => book.id !== id);
    if (updatedBooks.length < currentBooks.length) {
      this.booksSubject.next(updatedBooks);
      console.log(`[BookService] Livre ID: ${id} supprimé.`);
      return of(true);
    } else {
      console.warn(`[BookService] Livre ID: ${id} non trouvé pour suppression.`);
      return of(false);
    }
  }

  addBook(newBookData: Omit<Book, 'id'>): Observable<Book> {
    console.log('[BookService] Tentative ajout livre:', newBookData.title);
    const currentBooks = this.booksSubject.getValue();
    const newBook: Book = { ...newBookData, id: this.nextId++ };
    const updatedBooks = [...currentBooks, newBook];
    this.booksSubject.next(updatedBooks);
    console.log('[BookService] Livre ajouté ID:', newBook.id);
    return of(newBook);
  }

  /**
   * Simule la mise à jour d'un livre existant.
   * @param updatedBookData - Les données complètes du livre mis à jour (incluant l'ID).
   * @returns Observable<Book | undefined> - Le livre mis à jour ou undefined si non trouvé.
   */
  updateBook(updatedBookData: Book): Observable<Book | undefined> {
    console.log(`[BookService] Tentative de mise à jour du livre ID: ${updatedBookData.id}`);
    const currentBooks = this.booksSubject.getValue();
    // Trouver l'index du livre à mettre à jour
    const indexToUpdate = currentBooks.findIndex(book => book.id === updatedBookData.id);

    if (indexToUpdate !== -1) {
      // Si le livre est trouvé
      // Créer une nouvelle liste en remplaçant l'ancien livre par le nouveau
      const updatedBooks = [
        ...currentBooks.slice(0, indexToUpdate), // Partie avant l'index
        updatedBookData,                         // Le livre mis à jour
        ...currentBooks.slice(indexToUpdate + 1) // Partie après l'index
      ];
      // Émettre la nouvelle liste
      this.booksSubject.next(updatedBooks);
      console.log(`[BookService] Livre ID: ${updatedBookData.id} mis à jour.`);
      // Retourner le livre mis à jour
      return of(updatedBookData);
    } else {
      // Si le livre n'est pas trouvé
      console.warn(`[BookService] Livre ID: ${updatedBookData.id} non trouvé pour mise à jour.`);
      return of(undefined); // Retourner undefined
    }
    // Dans une vraie API: return this.http.put<Book>(`/api/books/${updatedBookData.id}`, updatedBookData);
  }
}