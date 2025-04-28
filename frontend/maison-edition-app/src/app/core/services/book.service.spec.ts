// src/app/core/services/book.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs'; // Importer BehaviorSubject et throwError
import { map, tap } from 'rxjs/operators'; // Importer map et tap
import { Book } from '../../models/book.model';

@Injectable({
  providedIn: 'root'
})
export class BookService {

  // Utiliser un BehaviorSubject pour gérer les données mock en interne
  // Cela permet de notifier les changements facilement après une suppression/ajout/modif
  private booksSubject = new BehaviorSubject<Book[]>([
    // Initialiser avec les données mock
    { id: 1, title: 'Le Seigneur des Anneaux', author: 'J.R.R. Tolkien', coverUrl: 'assets/images/sda.jpg', summary: '...', price: 29.95, category: 'Fantasy' },
    { id: 2, title: 'Fondation', author: 'Isaac Asimov', coverUrl: 'assets/images/fondation.jpg', summary: '...', price: 19.90, category: 'Science-Fiction' },
    { id: 3, title: 'Dune', author: 'Frank Herbert', coverUrl: 'assets/images/dune.jpg', summary: '...', price: 22.50, category: 'Science-Fiction' }
  ]);

  // Observable public basé sur le BehaviorSubject
  public books$: Observable<Book[]> = this.booksSubject.asObservable();

  constructor() { }

  /**
   * Récupère l'observable des livres (maintenant basé sur le BehaviorSubject).
   */
  getBooks(): Observable<Book[]> {
    console.log('[BookService] getBooks: Retourne l\'observable books$.');
    // Retourne directement l'observable du BehaviorSubject.
    // Tous les composants abonnés recevront la dernière liste émise.
    return this.books$;
    // L'ancienne méthode avec of() ne reflétait pas les mises à jour.
    // return of(this.mockBooks);
  }

  /**
   * Simule la suppression d'un livre par son ID.
   * Met à jour le BehaviorSubject pour notifier les composants.
   * @param id - L'ID numérique du livre à supprimer.
   * @returns Observable<boolean> - true si la suppression a réussi, false sinon.
   */
  deleteBook(id: number): Observable<boolean> {
    console.log(`[BookService] Tentative de suppression du livre ID: ${id}`);
    // Récupérer la liste actuelle des livres depuis le sujet
    const currentBooks = this.booksSubject.getValue();
    // Filtrer la liste pour ne garder que les livres dont l'ID est DIFFÉRENT de celui à supprimer
    const updatedBooks = currentBooks.filter(book => book.id !== id);

    // Vérifier si un livre a effectivement été retiré (si la longueur a changé)
    if (updatedBooks.length < currentBooks.length) {
      // Le livre a été trouvé et retiré
      console.log(`[BookService] Livre ID: ${id} trouvé et retiré. Mise à jour du Subject.`);
      // Émettre la nouvelle liste (sans le livre supprimé) via le BehaviorSubject
      this.booksSubject.next(updatedBooks);
      // Retourner un Observable indiquant le succès
      return of(true);
    } else {
      // Le livre avec cet ID n'a pas été trouvé dans la liste
      console.warn(`[BookService] Livre ID: ${id} non trouvé pour suppression.`);
      // Retourner un Observable indiquant l'échec (livre non trouvé)
      return of(false);
    }
    // Dans une vraie API, on ferait un appel HTTP DELETE ici :
    // return this.http.delete(`/api/books/${id}`).pipe(map(() => true), catchError(...));
  }

  // --- Méthodes futures pour ajout/modification ---
  // addBook(newBookData: Omit<Book, 'id'>): Observable<Book> { ... }
  // updateBook(updatedBook: Book): Observable<Book> { ... }
  // getBookById(id: number): Observable<Book | undefined> { ... }
}