// src/app/admin/pages/book-edit/book-edit.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router'; // ActivatedRoute pour lire l'ID dans l'URL
import { Observable, switchMap, of, tap } from 'rxjs'; // switchMap pour enchaîner les observables
import { BookFormComponent } from '../../components/book-form/book-form.component'; // Notre formulaire réutilisable
import { BookService } from '../../../core/services/book.service';
import { Book } from '../../../models/book.model';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-book-edit',
  standalone: true,
  imports: [
    CommonModule,
    BookFormComponent,
    ReactiveFormsModule   // Utiliser le composant formulaire
  ],
  templateUrl: './book-edit.component.html',
  styleUrls: ['./book-edit.component.scss']
})
export class BookEditComponent implements OnInit {

  private route = inject(ActivatedRoute); // Pour lire les paramètres de l'URL
  private router = inject(Router);
  private bookService = inject(BookService);

  pageTitle = "Modifier le Livre";
  bookToEdit$: Observable<Book | undefined> | undefined; // Observable pour les données du livre à éditer
  bookId: number | null = null; // Pour stocker l'ID

  ngOnInit(): void {
    console.log('[BookEditComponent] ngOnInit: Initialisation.');
    // Récupérer l'ID du livre depuis les paramètres de la route
    // switchMap permet de passer de l'observable des paramètres de route
    // à l'observable retourné par getBookById
    this.bookToEdit$ = this.route.paramMap.pipe(
      tap(params => console.log('[BookEditComponent] Paramètres de route reçus:', params)),
      switchMap(params => {
        const idParam = params.get('id'); // 'id' doit correspondre au nom du paramètre dans admin.routes.ts
        if (idParam) {
          this.bookId = +idParam; // Convertir le paramètre string en nombre
          console.log(`[BookEditComponent] ID extrait de l'URL: ${this.bookId}`);
          // Appeler le service pour récupérer le livre correspondant à cet ID
          return this.bookService.getBookById(this.bookId);
        } else {
          // Si pas d'ID dans l'URL, retourner un observable de undefined
          console.error('[BookEditComponent] Aucun ID trouvé dans les paramètres de route.');
          this.pageTitle = "Erreur: ID de livre manquant"; // Mettre à jour le titre
          return of(undefined);
        }
      }),
      tap(book => { // Log après avoir récupéré le livre
        if (!book) {
          console.error(`[BookEditComponent] Livre avec ID ${this.bookId} non trouvé par le service.`);
          this.pageTitle = `Erreur: Livre ID ${this.bookId} non trouvé`;
        } else {
          console.log('[BookEditComponent] Données initiales pour le formulaire:', book);
          this.pageTitle = `Modifier : ${book.title}`; // Mettre à jour le titre avec celui du livre
        }
      })
    );
  }

  /**
   * Gère la soumission du formulaire d'édition.
   * Appelle la méthode updateBook du service.
   * @param bookData Les données mises à jour du formulaire (devraient inclure l'ID ici).
   */
  handleBookUpdate(bookData: any): void { // Type 'any' pour correspondre à l'emit
    // Vérifier si on a bien l'ID stocké
    if (this.bookId === null) {
      console.error('[BookEditComponent] Tentative de mise à jour sans ID valide.');
      alert('Erreur: Impossible de mettre à jour le livre sans son ID.');
      return;
    }

    // Vérifier si les propriétés requises existent dans bookData
    if (!bookData.title || !bookData.author || !bookData.coverUrl || !bookData.summary || bookData.price === null || bookData.price === undefined || !bookData.category) {
      console.error('[BookEditComponent] Données de formulaire incomplètes:', bookData);
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // Construire l'objet Book complet avec l'ID
    const bookToUpdate: Book = {
      id: this.bookId,
      title: bookData.title,
      author: bookData.author,
      coverUrl: bookData.coverUrl,
      summary: bookData.summary,
      price: bookData.price,
      category: bookData.category
    };

    console.log('[BookEditComponent] Demande de mise à jour pour ID:', this.bookId, 'avec données:', bookToUpdate);

    // Appel de la méthode updateBook du service
    this.bookService.updateBook(bookToUpdate).subscribe({
      next: (updatedBook) => {
        if (updatedBook) {
          console.log('[BookEditComponent] Livre mis à jour avec succès:', updatedBook);
          alert(`Le livre "${updatedBook.title}" a été mis à jour.`);
          this.router.navigate(['/admin/books']); // Rediriger vers la liste
        } else {
          // Cas où le service retourne undefined (ne devrait pas arriver si getBookById a fonctionné)
          console.error('[BookEditComponent] Erreur: Le service n\'a pas retourné de livre mis à jour.');
          alert(`Erreur lors de la mise à jour du livre ID ${this.bookId}.`);
        }
      },
      error: (err) => {
        console.error('[BookEditComponent] Erreur technique lors de la mise à jour:', err);
        alert('Une erreur technique est survenue lors de la mise à jour.');
      }
    });
  }

  /** Gère l'annulation depuis le formulaire */
  handleCancel(): void {
    console.log('[BookEditComponent] Annulation, retour à la liste des livres.');
    this.router.navigate(['/admin/books']);
  }
}